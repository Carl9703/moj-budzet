import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { z } from 'zod'
import { jsonResponse } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    const { id } = await params
    const body = await request.json()

    const validation = patchSchema.safeParse(body)
    if (!validation.success) {
      return jsonResponse({ error: 'Nieprawidłowe dane' }, { status: 400 })
    }

    const wallet = await prisma.currencyWallet.findFirst({ where: { id, userId } })
    if (!wallet) {
      return jsonResponse({ error: 'Portfel nie znaleziony' }, { status: 404 })
    }

    const updated = await prisma.currencyWallet.update({
      where: { id },
      data: validation.data,
    })

    return jsonResponse({ wallet: updated })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    return jsonResponse({ error: 'Błąd aktualizacji portfela' }, { status: 500 })
  }
}

export async function DELETE(
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

    await prisma.currencyWallet.update({ where: { id }, data: { isActive: false } })

    return jsonResponse({ success: true })
  } catch (error: any) {
    if (error?.message?.includes('Brak autoryzacji')) {
      return unauthorizedResponse(error.message)
    }
    return jsonResponse({ error: 'Błąd usuwania portfela' }, { status: 500 })
  }
}
