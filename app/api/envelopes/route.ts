import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'
import { jsonResponse } from '@/lib/utils/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    let userId: string
    try {
      userId = await getUserIdFromToken(request)
    } catch (error) {
      return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
    }

    const envelopes = await prisma.envelope.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, icon: true, type: true, currentAmount: true, plannedAmount: true, currencyCode: true, parentEnvelopeId: true, isAccumulating: true },
      orderBy: { name: 'asc' }
    })

    return jsonResponse({ envelopes })
  } catch (error) {
    return jsonResponse({ error: 'Błąd pobierania kopert' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pobierz userId z JWT tokenu
    let userId: string
    try {
      userId = await getUserIdFromToken(request)
    } catch (error) {
      return unauthorizedResponse(error instanceof Error ? error.message : 'Brak autoryzacji')
    }

    const body = await request.json()
    const { name, icon, plannedAmount, type, group, isAccumulating, currencyCode, parentEnvelopeId } = body as {
      name: string
      icon?: string | null
      plannedAmount?: number
      type: 'monthly' | 'yearly'
      group?: string
      isAccumulating?: boolean
      currencyCode?: string
      parentEnvelopeId?: string | null
    }

    if (!name || !type) {
      return jsonResponse(
        { error: 'Nazwa i typ koperty są wymagane' },
        { status: 400 }
      )
    }

    // Utwórz kopertę (domyślnie nie zarchiwizowana)
    const envelope = await prisma.envelope.create({
      data: {
        userId,
        name,
        icon: icon || null,
        plannedAmount: plannedAmount || 0,
        currentAmount: 0,
        type,
        group: group || null,
        isArchived: false, // Jawnie ustawiamy, że nowa koperta nie jest zarchiwizowana
        isAccumulating: isAccumulating || false,
        currencyCode: currencyCode || 'PLN',
        parentEnvelopeId: parentEnvelopeId || null,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        type: true,
        plannedAmount: true,
        currentAmount: true,
        icon: true,
        group: true,
        isArchived: true, // Upewnij się, że isArchived jest zwracane
        isAccumulating: true
      }
    })

    // Sprawdź, czy koperta rzeczywiście nie jest zarchiwizowana
    if (envelope.isArchived) {
      // Spróbuj zaktualizować
      const updated = await prisma.envelope.update({
        where: { id: envelope.id },
        data: { isArchived: false },
        select: {
          id: true,
          userId: true,
          name: true,
          type: true,
          plannedAmount: true,
          currentAmount: true,
          icon: true,
          group: true,
          isArchived: true,
          isAccumulating: true
        }
      })
      return jsonResponse({ success: true, envelope: updated }, { status: 201 })
    }

    return jsonResponse({ success: true, envelope }, { status: 201 })
  } catch (error) {
    console.error('Error creating envelope:', error)
    return jsonResponse({ error: 'Błąd tworzenia koperty' }, { status: 500 })
  }
}

