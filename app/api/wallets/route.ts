import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'
import { jsonResponse } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

const SUPPORTED_CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'NOK', 'SEK', 'DKK', 'CZK', 'HUF'] as const

const createWalletSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  currency: z.enum(SUPPORTED_CURRENCIES, { message: 'Nieobsługiwana waluta' }),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)

    const wallets = await prisma.currencyWallet.findMany({
      where: { userId, isActive: true },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 20,
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return jsonResponse({ wallets })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    console.error('GET /api/wallets error:', error)
    return jsonResponse({ error: 'Błąd pobierania portfeli' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    const body = await request.json()

    const validation = createWalletSchema.safeParse(body)
    if (!validation.success) {
      return jsonResponse(
        { error: 'Nieprawidłowe dane', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, currency } = validation.data

    const wallet = await prisma.currencyWallet.create({
      data: { userId, name, currency, balance: 0 }
    })

    return jsonResponse({ wallet }, { status: 201 })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    console.error('POST /api/wallets error:', error)
    return jsonResponse({ error: 'Błąd tworzenia portfela' }, { status: 500 })
  }
}
