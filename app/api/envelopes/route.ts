import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

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
    const { name, icon, plannedAmount, type, group } = body as {
      name: string
      icon?: string | null
      plannedAmount?: number
      type: 'monthly' | 'yearly'
      group?: string
    }

    if (!name || !type) {
      return NextResponse.json(
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
        isArchived: false // Jawnie ustawiamy, że nowa koperta nie jest zarchiwizowana
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
        isArchived: true // Upewnij się, że isArchived jest zwracane
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
          isArchived: true
        }
      })
      return NextResponse.json({ success: true, envelope: updated }, { status: 201 })
    }

    return NextResponse.json({ success: true, envelope }, { status: 201 })
  } catch (error) {
    console.error('Error creating envelope:', error)
    return NextResponse.json({ error: 'Błąd tworzenia koperty' }, { status: 500 })
  }
}

