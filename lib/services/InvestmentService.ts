import { prisma } from '@/lib/utils/prisma';
import { InvestmentAsset } from '@prisma/client';

export type AssetType = 'CRYPTO' | 'STOCK' | 'PPK';

interface PriceCache {
    price: number;
    timestamp: number;
}

const cache = new Map<string, PriceCache>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Currency conversion cache
const currencyCache = new Map<string, { rate: number, timestamp: number }>();
const CURRENCY_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export interface InvestmentPosition extends InvestmentAsset {
    name?: string;
    history?: InvestmentAsset[];
}

export interface DetailedInvestment extends InvestmentPosition {
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    totalProfit: number;
    profitPercentage: number;
}

export class InvestmentService {
    private static async fetchCryptoPrice(symbol: string): Promise<number> {
        try {
            const apiKey = process.env.CRYPTOCOMPARE_API_KEY;
            const response = await fetch(
                `https://min-api.cryptocompare.com/data/price?fsym=${symbol.toUpperCase()}&tsyms=PLN&api_key=${apiKey}`
            );
            const data = await response.json();
            return data.PLN || 0;
        } catch (error) {
            console.error(`Error fetching crypto price for ${symbol}:`, error);
            return 0;
        }
    }

    private static async getExchangeRate(fromCurrency: string, toCurrency: string = 'PLN'): Promise<number> {
        const cacheKey = `${fromCurrency}_${toCurrency}`;
        const cached = currencyCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CURRENCY_CACHE_TTL) {
            return cached.rate;
        }

        try {
            // Yahoo Finance currency conversion
            const pair = `${fromCurrency}${toCurrency}=X`;
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?interval=1d&range=1d`
            );
            const data = await response.json();
            const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;

            if (rate > 0) {
                currencyCache.set(cacheKey, { rate, timestamp: Date.now() });
                console.log(`💱 Exchange rate ${fromCurrency}/${toCurrency}: ${rate}`);
                return rate;
            }
        } catch (error) {
            console.error(`Error fetching exchange rate ${fromCurrency}/${toCurrency}:`, error);
        }

        return 1; // Default to 1:1 if conversion fails
    }

    private static async fetchYahooFinancePrice(symbol: string): Promise<{ price: number, currency: string } | null> {
        try {
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
            );
            const data = await response.json();

            if (data?.chart?.result?.[0]) {
                const result = data.chart.result[0];
                const price = result.meta?.regularMarketPrice || 0;
                const currency = result.meta?.currency || 'USD';

                console.log(`📊 Yahoo Finance - ${symbol}: ${price} ${currency}`);
                return { price, currency };
            }
        } catch (error) {
            console.error(`Error fetching Yahoo Finance price for ${symbol}:`, error);
        }

        return null;
    }

    private static async fetchStockPrice(symbol: string): Promise<number> {
        console.log(`🔍 Fetching price for ${symbol}...`);

        // Try Finnhub first (for US stocks)
        try {
            const apiKey = process.env.FINNHUB_API_KEY;
            const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`
            );
            const data = await response.json();

            if (data.c && data.c > 0) {
                console.log(`📈 Finnhub - ${symbol}: ${data.c} USD`);
                // Finnhub returns USD, convert to PLN
                const rate = await this.getExchangeRate('USD', 'PLN');
                return data.c * rate;
            }
        } catch (error) {
            console.error(`Finnhub error for ${symbol}:`, error);
        }

        // Fallback to Yahoo Finance (supports all exchanges)
        const yahooData = await this.fetchYahooFinancePrice(symbol);
        if (yahooData && yahooData.price > 0) {
            // Convert to PLN if needed
            if (yahooData.currency === 'PLN' || yahooData.currency === 'p') {
                return yahooData.price;
            }

            const rate = await this.getExchangeRate(yahooData.currency, 'PLN');
            const priceInPLN = yahooData.price * rate;
            console.log(`💰 Final price for ${symbol}: ${priceInPLN.toFixed(2)} PLN`);
            return priceInPLN;
        }

        console.warn(`⚠️ No price data found for ${symbol}`);
        return 0;
    }

    static async getCurrentPrice(symbol: string, type: AssetType): Promise<number> {
        const cached = cache.get(symbol);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.price;
        }

        let price = 0;
        if (type === 'CRYPTO') {
            price = await this.fetchCryptoPrice(symbol);
        } else {
            price = await this.fetchStockPrice(symbol);
        }

        if (price > 0) {
            cache.set(symbol, { price, timestamp: Date.now() });
        }

        return price;
    }

    static async getUserInvestments(userId: string) {
        const positions = await prisma.investmentAsset.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // 1. Aggregate duplicate positions (same Symbol + Type)
        const groupedMap = new Map<string, InvestmentPosition>();

        for (const pos of positions) {
            const key = `${pos.symbol.toUpperCase()}-${pos.type}`;

            if (groupedMap.has(key)) {
                const existing = groupedMap.get(key)!;
                const totalQty = existing.quantity + pos.quantity;
                const totalCost = (existing.quantity * existing.averagePurchasePrice) + (pos.quantity * pos.averagePurchasePrice);
                const newAvgPrice = totalQty > 0 ? totalCost / totalQty : 0;

                existing.quantity = totalQty;
                existing.averagePurchasePrice = newAvgPrice;

                if (!existing.history) existing.history = [];
                existing.history.push(pos);
            } else {
                groupedMap.set(key, { ...pos, history: [pos] });
            }
        }

        const uniquePositions = Array.from(groupedMap.values());
        const detailedPositions: DetailedInvestment[] = [];

        // Batch processing to avoid rate limits
        const BATCH_SIZE = 4;
        const DELAY_MS = 300;

        for (let i = 0; i < uniquePositions.length; i += BATCH_SIZE) {
            const batch = uniquePositions.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
                batch.map(async (pos) => {
                    let currentPrice: number = 0;

                    if (pos.type === 'PPK') {
                        currentPrice = pos.averagePurchasePrice;
                    } else {
                        let retries = 2;
                        while (retries > 0) {
                            currentPrice = await this.getCurrentPrice(pos.symbol, pos.type as AssetType);
                            if (currentPrice > 0) break;
                            retries--;
                            if (retries > 0) await new Promise(r => setTimeout(r, 500));
                        }
                    }

                    const marketValue = pos.quantity * currentPrice;
                    const costBasis = pos.quantity * pos.averagePurchasePrice;
                    const totalProfit = marketValue - costBasis;
                    const profitPercentage = costBasis > 0 ? (totalProfit / costBasis) * 100 : 0;

                    return {
                        ...pos,
                        currentPrice,
                        marketValue,
                        costBasis,
                        totalProfit,
                        profitPercentage
                    };
                })
            );

            detailedPositions.push(...batchResults);

            if (i + BATCH_SIZE < uniquePositions.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        const totalMarketValue = detailedPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
        const totalCostBasis = detailedPositions.reduce((sum, pos) => sum + pos.costBasis, 0);
        const totalProfit = totalMarketValue - totalCostBasis;
        const totalProfitPercentage = totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : 0;

        return {
            positions: detailedPositions,
            summary: {
                totalMarketValue,
                totalCostBasis,
                totalProfit,
                totalProfitPercentage
            }
        };
    }
}
