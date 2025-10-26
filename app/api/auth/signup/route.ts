import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import bcrypt from 'bcryptjs'
import { signupSchema } from '@/lib/validations/auth'

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

    // Stwórz konfigurację użytkownika
    await prisma.userConfig.create({
      data: {
        userId: user.id,
        defaultSalary: 5000,
        defaultToJoint: 1500,
        defaultToSavings: 1000,
        defaultToVacation: 400,
        defaultToWedding: 0,
        defaultToGroceries: 0,
        defaultToInvestment: 500
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
    // Koperty miesięczne
    { name: 'Mieszkanie', type: 'monthly', plannedAmount: 1500, icon: '🏠', group: 'needs' },
    { name: 'Żywność', type: 'monthly', plannedAmount: 1200, icon: '🍕', group: 'needs' },
    { name: 'Transport', type: 'monthly', plannedAmount: 400, icon: '🚗', group: 'needs' },
    { name: 'Zdrowie i Higiena', type: 'monthly', plannedAmount: 300, icon: '💊', group: 'needs' },
    { name: 'Rachunki i Subskrypcje', type: 'monthly', plannedAmount: 200, icon: '📱', group: 'needs' },
    { name: 'Wydatki Osobiste', type: 'monthly', plannedAmount: 500, icon: '🎮', group: 'lifestyle' },
    { name: 'Gastronomia', type: 'monthly', plannedAmount: 300, icon: '🍽️', group: 'lifestyle' },
    { name: 'Ubrania i Akcesoria', type: 'monthly', plannedAmount: 200, icon: '👕', group: 'lifestyle' },
    { name: 'Fundusz Awaryjny', type: 'monthly', plannedAmount: 1000, icon: '🚨', group: 'financial' },
    
    // Koperty roczne
    { name: 'Auto: Serwis i Ubezpieczenie', type: 'yearly', plannedAmount: 2000, icon: '🚗', group: 'target' },
    { name: 'Prezenty i Okazje', type: 'yearly', plannedAmount: 1500, icon: '🎁', group: 'target' },
    { name: 'Podróże', type: 'yearly', plannedAmount: 5000, icon: '✈️', group: 'target' },
    { name: 'Wesele', type: 'yearly', plannedAmount: 15000, icon: '💍', group: 'target' },
    { name: 'Budowanie Przyszłości', type: 'yearly', plannedAmount: 9600, icon: '📈', group: 'target' },
    { name: 'Wolne środki (roczne)', type: 'yearly', plannedAmount: 2000, icon: '🎉', group: 'target' },
  ]

  for (const envelope of defaultEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: envelope.type,
        plannedAmount: envelope.plannedAmount,
        currentAmount: 0,
        icon: envelope.icon,
        group: envelope.group
      }
    })
  }
}
