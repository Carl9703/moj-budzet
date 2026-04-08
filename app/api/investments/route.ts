import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { getAssetPrices } from '@/lib/investments/price-service'
import { jsonResponse } from '@/lib/utils/api'
import { AssetType } from '@prisma/client'
import { toNum } from '@/lib/utils/decimal'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request)
        // console.log cleared

        // Fetch all assets
        const assets = await prisma.investmentAsset.findMany({
            where: { userId },
        })

        // Prepare symbols for price fetching (Live assets only)
        const liveAssets = assets.filter(a => a.type === 'CRYPTO' || a.type === 'STOCK')
        const priceMap = await getAssetPrices(
            liveAssets.map(a => ({ symbol: a.symbol, type: a.type as 'CRYPTO' | 'STOCK' }))
        )

        // Process assets
        const positions = assets.map(asset => {
            let marketValue = 0
            let totalCost = 0
            let currentPrice = 0

            // Determine Mode: Manual (PPK/Private) vs Live (Crypto/Stock)
            // Note: AssetType might be 'PPK', 'CRYPTO', 'STOCK'.
            if (asset.type === 'PPK' || asset.type === 'PRIVATE_EQUITY' as any) {
                // Manual Mode
                // For PPK, "currentPrice" is effectively the manual value (or unit price if quantity=1)
                // We use manualCurrentValue as the distinct field.
                marketValue = toNum(asset.manualCurrentValue) || 0
                totalCost = toNum(asset.totalContributed) || 0
                currentPrice = marketValue // Display purpose
            } else {
                // Live Mode
                currentPrice = priceMap[asset.symbol] || 0
                marketValue = toNum(asset.quantity) * currentPrice
                totalCost = toNum(asset.quantity) * toNum(asset.averagePurchasePrice)
            }

            const totalProfit = marketValue - totalCost
            const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

            return {
                id: asset.id,
                symbol: asset.symbol,
                type: asset.type,
                quantity: asset.quantity,
                averagePurchasePrice: asset.averagePurchasePrice,
                currentPrice,
                marketValue,
                totalCost,
                totalProfit,
                profitPercentage,
                totalContributed: asset.totalContributed,
                manualCurrentValue: asset.manualCurrentValue,
                createdAt: asset.createdAt,
                history: [] // Placeholder
            }
        })

        // Aggregation by Symbol + Type
        const groupedMap = new Map<string, any>()

        positions.forEach(pos => {
            const key = `${pos.symbol}-${pos.type}`
            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    ...pos,
                    subPositions: [], // Initialize empty, will push below
                    quantity: 0,
                    marketValue: 0,
                    totalCost: 0,
                    totalProfit: 0,
                    totalContributed: 0,
                    manualCurrentValue: 0
                })
            }

            const group = groupedMap.get(key)
            group.subPositions.push(pos)

            // Sum metrics
            group.quantity += pos.quantity
            group.marketValue += pos.marketValue
            group.totalCost += pos.totalCost
            group.totalProfit += pos.totalProfit
            group.totalContributed = (group.totalContributed || 0) + (pos.totalContributed || 0)
            group.manualCurrentValue = (group.manualCurrentValue || 0) + (pos.manualCurrentValue || 0)
        })

        // reconstruct aggregated positions array
        const aggregatedPositions = Array.from(groupedMap.values()).map(group => {
            // Recalculate derived fields
            // Average Purchase Price = Total Cost / Total Quantity
            // For PPK (Manual), avg price might not make sense, but for stocks it does.
            const averagePurchasePrice = group.quantity > 0 ? group.totalCost / group.quantity : 0

            const profitPercentage = group.totalCost > 0
                ? (group.totalProfit / group.totalCost) * 100
                : 0

            return {
                ...group,
                id: group.subPositions[0].id, // Use first ID as primary (needed for keys)
                ids: group.subPositions.map((p: any) => p.id), // All IDs for operations
                averagePurchasePrice,
                profitPercentage,
                subPositions: group.subPositions // Pass through for Chart granularity
            }
        })

        // Sort by market value desc
        aggregatedPositions.sort((a, b) => b.marketValue - a.marketValue)

        // Aggregations (unchanged logic, just ensuring variables match)
        const totalMarketValue = aggregatedPositions.reduce((sum, p) => sum + p.marketValue, 0)
        const totalCostBasis = aggregatedPositions.reduce((sum, p) => sum + p.totalCost, 0)
        const totalProfit = totalMarketValue - totalCostBasis
        const totalProfitPercentage = totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : 0

        const summary = {
            totalMarketValue,
            totalCostBasis,
            totalProfit,
            totalProfitPercentage
        }

        return jsonResponse({ summary, positions: aggregatedPositions })

    } catch (error: any) {
        console.error('❌ Error in GET /api/investments:', error)
        if (error instanceof Error && error.message.includes('Brak autoryzacji')) {
            return unauthorizedResponse(error.message)
        }
        return jsonResponse({ error: 'Failed to fetch investments' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request)
        const body = await request.json()
        const {
            symbol, quantity, averagePurchasePrice, type,
            totalContributed, manualCurrentValue
        } = body

        if (!symbol || !type) {
            return jsonResponse({ error: 'Missing required fields' }, { status: 400 })
        }

        const asset = await prisma.investmentAsset.create({
            data: {
                userId,
                symbol: symbol.toUpperCase(),
                quantity: parseFloat(String(quantity || 0).replace(',', '.')),
                averagePurchasePrice: parseFloat(String(averagePurchasePrice || 0).replace(',', '.')),
                type: type as AssetType,
                totalContributed: totalContributed ? parseFloat(String(totalContributed).replace(',', '.')) : null,
                manualCurrentValue: manualCurrentValue ? parseFloat(String(manualCurrentValue).replace(',', '.')) : null,
            }
        })

        return jsonResponse(asset)

    } catch (error: any) {
        console.error('Error in POST /api/investments:', error)
        if (error instanceof Error && error.message.includes('Brak autoryzacji')) {
            return unauthorizedResponse(error.message)
        }
        return jsonResponse({ error: 'Failed to create investment' }, { status: 500 })
    }
}
