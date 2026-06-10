import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { AssetType } from '@prisma/client'
import { jsonResponse } from '@/lib/utils/api'
import { z } from 'zod'

const bulkInvestmentSchema = z.array(z.object({
    symbol: z.string().min(1),
    quantity: z.number().min(0, 'Ilość nie może być ujemna'),
    averagePurchasePrice: z.number().min(0, 'Cena nie może być ujemna'),
    type: z.enum(['CRYPTO', 'STOCK', 'PPK'])
}))

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        const body = await request.json();

        if (!Array.isArray(body)) {
            return jsonResponse({ error: 'Expected an array of investments' }, { status: 400 });
        }

        const preprocessedBody = body.map((item: any) => ({
            ...item,
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity.replace(',', '.')) : item.quantity,
            averagePurchasePrice: typeof item.averagePurchasePrice === 'string' ? parseFloat(item.averagePurchasePrice.replace(',', '.')) : item.averagePurchasePrice
        }))

        const validation = bulkInvestmentSchema.safeParse(preprocessedBody)
        if (!validation.success) {
            return jsonResponse({ error: 'Nieprawidłowe dane', details: validation.error.issues }, { status: 400 })
        }

        const results = [];
        for (const item of validation.data) {
            const { symbol, quantity, averagePurchasePrice, type } = item;

            const position = await prisma.investmentAsset.create({
                data: {
                    userId,
                    symbol: symbol.toUpperCase(),
                    quantity,
                    averagePurchasePrice,
                    type: type as AssetType
                }
            });
            results.push(position);
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
