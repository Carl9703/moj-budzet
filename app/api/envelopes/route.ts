import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getUserIdFromToken, unauthorizedResponse } from '@/lib/auth/jwt'

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

    // Utwórz kopertę
    const envelope = await prisma.envelope.create({
      data: {
        userId,
        name,
        icon: icon || null,
        plannedAmount: plannedAmount || 0,
        currentAmount: 0,
        type,
        group: group || null
      }
    })

    return NextResponse.json({ success: true, envelope }, { status: 201 })
  } catch (error) {
    console.error('Error creating envelope:', error)
    return NextResponse.json({ error: 'Błąd tworzenia koperty' }, { status: 500 })
  }
}

