import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { AssetType } from '@prisma/client'
import { jsonResponse } from '@/lib/utils/api'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        const body = await request.json();

        if (!Array.isArray(body)) {
            return jsonResponse({ error: 'Expected an array of investments' }, { status: 400 });
        }

        const results = [];
        for (const item of body) {
            const { symbol, quantity, averagePurchasePrice, type } = item;

            if (symbol && quantity && averagePurchasePrice && type) {
                const position = await prisma.investmentAsset.create({
                    data: {
                        userId,
                        symbol: symbol.toUpperCase(),
                        quantity: parseFloat(String(quantity).replace(',', '.')),
                        averagePurchasePrice: parseFloat(String(averagePurchasePrice).replace(',', '.')),
                        type: type as AssetType
                    }
                });
                results.push(position);
            }
        }

        return jsonResponse({
            success: true,
            count: results.length,
            positions: results
        });

    } catch (error: any) {
        console.error('Fatal error in POST /api/investments/bulk:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);
        const authErrors = [
            'Brak tokenu autoryzacji',
            'Nieprawidłowy token - brak userId',
            'Token wygasł - zaloguj się ponownie',
            'Nieprawidłowy token',
            'Brak autoryzacji'
        ];

        if (authErrors.some(e => errorMessage.includes(e))) {
            return unauthorizedResponse(errorMessage);
        }

        return jsonResponse({
            error: 'Failed to bulk create investments',
            details: errorMessage
        }, { status: 500 });
    }
}
