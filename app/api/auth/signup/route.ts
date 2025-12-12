import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import bcrypt from 'bcryptjs'
import { signupSchema } from '@/lib/validations/auth'
import { ENVELOPE_TYPES } from '@/lib/constants/envelopeTypes'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Walidacja z Zod
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik z tym emailem już istnieje' },
        { status: 400 }
      )
    }

    // Hash hasła
    const hashedPassword = await bcrypt.hash(password, 12)

    // Stwórz użytkownika
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
      }
    })

    // Stwórz podstawowe koperty dla nowego użytkownika
    await createDefaultEnvelopes(user.id)

    // Stwórz domyślne kategorie
    await createDefaultCategories(user.id)

    // Stwórz konfigurację użytkownika
    await prisma.userConfig.create({
      data: {
        userId: user.id,
        defaultSalary: 5000
      }
    })

    return NextResponse.json(
      {
        message: 'Konto zostało utworzone pomyślnie',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('❌ SIGNUP ERROR:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')

    return NextResponse.json(
      {
        error: 'Wystąpił błąd podczas tworzenia konta',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function createDefaultEnvelopes(userId: string) {
  const defaultEnvelopes = [
    // Koperty miesięczne (budżetowe)
    { name: 'Mieszkanie', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 1500, icon: '🏠', group: 'needs' },
    { name: 'Żywność', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 1200, icon: '🍕', group: 'needs' },
    { name: 'Transport', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 400, icon: '🚗', group: 'needs' },
    { name: 'Zdrowie i Higiena', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 300, icon: '💊', group: 'needs' },
    { name: 'Rachunki i Subskrypcje', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 200, icon: '📱', group: 'needs' },
    { name: 'Auto: Serwis i Ubezpieczenie', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 2000, icon: '🚗', group: 'needs', isAccumulating: true }, // Changed group to needs, added accumulation

    { name: 'Wydatki Osobiste', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 500, icon: '🎮', group: 'lifestyle' },
    { name: 'Gastronomia', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 300, icon: '🍽️', group: 'lifestyle' },
    { name: 'Ubrania i Akcesoria', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 200, icon: '👕', group: 'lifestyle' },
    { name: 'Prezenty i Okazje', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 1500, icon: '🎁', group: 'lifestyle', isAccumulating: true }, // Changed group to lifestyle
    { name: 'Podróże', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 5000, icon: '✈️', group: 'lifestyle', isAccumulating: true }, // Changed group to lifestyle
    { name: 'Wesele', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 15000, icon: '💍', group: 'lifestyle', isAccumulating: true }, // Changed group to lifestyle

    // Majątek i Cele
    { name: 'Fundusz Awaryjny', type: 'monthly', envelopeType: ENVELOPE_TYPES.EMERGENCY, plannedAmount: 1000, icon: '🚨', group: 'assets', isAccumulating: true },
    { name: 'Budowanie Przyszłości', type: 'yearly', envelopeType: ENVELOPE_TYPES.SAVINGS, plannedAmount: 9600, icon: '📈', group: 'assets', isAccumulating: true },
    { name: 'Wolne środki (roczne)', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 2000, icon: '🎉', group: 'assets', isAccumulating: true },
  ]

  for (const envelope of defaultEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: envelope.type,
        envelopeType: envelope.envelopeType,
        plannedAmount: envelope.plannedAmount,
        currentAmount: 0,
        icon: envelope.icon,
        group: envelope.group,
        isAccumulating: envelope.isAccumulating || false // Add this line
      }
    })
  }
}

async function createDefaultCategories(userId: string) {
  await prisma.category.createMany({
    data: EXPENSE_CATEGORIES.map(c => ({
      userId,
      name: c.name,
      icon: c.icon,
      type: c.type,
      defaultEnvelope: c.defaultEnvelope || null
    }))
  })
}
