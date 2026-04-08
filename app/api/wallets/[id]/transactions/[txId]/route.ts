import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    const { id, txId } = await params

    const tx = await prisma.currencyTransaction.findFirst({
      where: { id: txId, walletId: id, userId }
    })
    if (!tx) {
      return jsonResponse({ error: 'Transakcja nie znaleziona' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.currencyTransaction.delete({ where: { id: txId } }),
      prisma.currencyWallet.update({
        where: { id },
        data: { balance: { decrement: tx.amount } }
      })
    ])

    return jsonResponse({ success: true })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    return jsonResponse({ error: 'Błąd usuwania transakcji' }, { status: 500 })
  }
}
