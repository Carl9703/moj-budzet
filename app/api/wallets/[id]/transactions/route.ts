import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'
import { jsonResponse } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

const createTxSchema = z.object({
  type: z.enum(['exchange_in', 'expense', 'exchange_out']),
  amount: z.number().refine(v => v !== 0, 'Kwota nie może być zerowa'),
  plnAmount: z.number().positive('Kwota PLN musi być dodatnia').optional(),
  exchangeRate: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Data jest wymagana'),
  // Optional: link to a PLN envelope — creates a PLN Transaction atomically
  envelopeId: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    const { id } = await params

    const wallet = await prisma.currencyWallet.findFirst({ where: { id, userId } })
    if (!wallet) {
      return jsonResponse({ error: 'Portfel nie znaleziony' }, { status: 404 })
    }

    const transactions = await prisma.currencyTransaction.findMany({
      where: { walletId: id, userId },
      orderBy: { date: 'desc' },
    })

    return jsonResponse({ transactions })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    return jsonResponse({ error: 'Błąd pobierania transakcji' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    const { id } = await params
    const body = await request.json()

    const wallet = await prisma.currencyWallet.findFirst({ where: { id, userId } })
    if (!wallet) {
      return jsonResponse({ error: 'Portfel nie znaleziony' }, { status: 404 })
    }

    const validation = createTxSchema.safeParse(body)
    if (!validation.success) {
      return jsonResponse(
        { error: 'Nieprawidłowe dane', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { type, amount, plnAmount, exchangeRate, description, date, envelopeId, category } = validation.data

    // exchange_in → positive balance (money in), expense/exchange_out → negative
    const signedAmount = type === 'exchange_in' ? Math.abs(amount) : -Math.abs(amount)
    const txDate = new Date(date)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the currency wallet transaction
      const currencyTx = await tx.currencyTransaction.create({
        data: {
          walletId: id,
          userId,
          amount: signedAmount,
          plnAmount: plnAmount ?? null,
          exchangeRate: exchangeRate ?? null,
          description: description ?? null,
          date: txDate,
          type,
        }
      })

      // 2. Update wallet balance
      const updatedWallet = await tx.currencyWallet.update({
        where: { id },
        data: { balance: { increment: signedAmount } }
      })

      // 3. If an envelope is linked, create a PLN Transaction and update envelope balance
      if (envelopeId && plnAmount) {
        const envelope = await tx.envelope.findFirst({ where: { id: envelopeId, userId } })
        if (!envelope) throw new Error('ENVELOPE_NOT_FOUND')

        // exchange_in: PLN leaves the envelope (expense, not counted in stats — it's a transfer to wallet)
        // exchange_out: PLN returns to the envelope (income)
        // expense: PLN leaves the envelope (expense, counted in stats)
        const plnType = type === 'exchange_out' ? 'income' : 'expense'
        const includeInStats = type === 'expense'

        await tx.transaction.create({
          data: {
            userId,
            type: plnType,
            amount: plnAmount,
            description: description || (type === 'exchange_in'
              ? `Wymiana PLN → ${wallet.currency}`
              : type === 'exchange_out'
                ? `Wymiana ${wallet.currency} → PLN`
                : `Wydatek ${wallet.currency}`),
            date: txDate,
            envelopeId,
            category: category ?? null,
            includeInStats,
          }
        })

        const delta = plnType === 'expense' ? -plnAmount : plnAmount
        await tx.envelope.update({
          where: { id: envelopeId },
          data: { currentAmount: { increment: delta } }
        })
      }

      return { transaction: currencyTx, wallet: updatedWallet }
    })

    return jsonResponse(result, { status: 201 })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    if (error?.message === 'ENVELOPE_NOT_FOUND') {
      return jsonResponse({ error: 'Koperta nie znaleziona' }, { status: 404 })
    }
    console.error('POST /api/wallets/[id]/transactions error:', error)
    return jsonResponse({ error: 'Błąd dodawania transakcji' }, { status: 500 })
  }
}
