import { unstable_cache } from 'next/cache'

interface PriceMap {
    [symbol: string]: number
}

// Cache keys
const PRICE_CACHE_TAG = 'investment-prices'
const CACHE_DURATION = 300 // 5 minutes

export const getAssetPrices = async (symbols: { symbol: string, type: 'CRYPTO' | 'STOCK' | 'PPK' }[]): Promise<PriceMap> => {
    return await getCachedPrices(symbols)
}

const getCachedPrices = unstable_cache(
    async (symbols) => fetchPrices(symbols),
    ['investment-prices-data-yahoo-v2'],
    {
        revalidate: CACHE_DURATION,
        tags: [PRICE_CACHE_TAG]
    }
)

async function fetchPrices(symbols: { symbol: string, type: 'CRYPTO' | 'STOCK' | 'PPK' }[]): Promise<PriceMap> {
    const prices: PriceMap = {}
    // Filter unique symbols to avoid double fetching
    const uniqueSymbols = Array.from(new Set(symbols.map(s => s.symbol)))

    // 1. Fetch Asset Prices (Parallel)
    // Yahoo Finance "chart" endpoint is unofficial but robust for basic queries.
    // It returns price AND currency.
    const assetData = await Promise.all(
        uniqueSymbols.map(async (sym) => {
            try {
                // Find the asset type for this symbol from the input array
                const symbolInfo = symbols.find(s => s.symbol === sym)
                const isCrypto = symbolInfo?.type === 'CRYPTO'

                let querySym = sym
                // Auto-append -USD for crypto if standard text ticker (no hyphens)
                // This fixes issues where user enters "BNB" but Yahoo expects "BNB-USD"
                if (isCrypto && !sym.includes('-')) {
                    querySym = `${sym}-USD`
                }

                // Special case for major cryptos if not caught above or if specific override needed
                // if (sym === 'BTC' || sym === 'ETH') querySym = `${sym}-USD` 

                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${querySym}?interval=1d&range=1d`
                const res = await fetch(url)
                if (!res.ok) return null

                const data = await res.json()
                const meta = data?.chart?.result?.[0]?.meta
                if (!meta) return null

                return {
                    symbol: sym, // Return original symbol as key so it matches what we requested
                    price: meta.regularMarketPrice,
                    currency: meta.currency
                }
            } catch (e) {
                console.error(`Error fetching ${sym}:`, e)
                return null
            }
        })
    )

    // 2. Identify Currencies needing conversion
    const currenciesToFetch = new Set<string>()
    assetData.forEach(item => {
        if (item && item.currency && item.currency.toUpperCase() !== 'PLN') {
            currenciesToFetch.add(item.currency.toUpperCase())
        }
    })

    // 3. Fetch Exchange Rates
    const rates: { [key: string]: number } = {}
    await Promise.all(
        Array.from(currenciesToFetch).map(async (currency) => {
            try {
                const pair = `${currency}PLN=X`
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?interval=1d&range=1d`
                const res = await fetch(url)
                if (!res.ok) return

                const data = await res.json()
                const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
                if (price) {
                    rates[currency] = price
                }
            } catch (e) {
                console.error(`Error fetching rate for ${currency}:`, e)
            }
        })
    )

    // 4. Convert and Populate Map
    assetData.forEach(item => {
        if (!item) return

        let finalPrice = item.price
        const currency = item.currency?.toUpperCase()

        if (currency && currency !== 'PLN') {
            const rate = rates[currency]
            if (rate) {
                finalPrice = finalPrice * rate
            } else {
                // Check if maybe it's USD based but labeled weirdly? No, stick to logic.
                // If rate missing, we keep original (better than 0) but maybe log warning.
                console.warn(`Missing rate for ${currency}, using original price.`)
            }
        }

        prices[item.symbol] = finalPrice
    })

    return prices
}
