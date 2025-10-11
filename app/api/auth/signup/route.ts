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
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia konta' },
      { status: 500 }
    )
  }
}

async function createDefaultEnvelopes(userId: string) {
  // GRUPA 1: POTRZEBY (miesięczne)
  const needsEnvelopes = [
    { name: 'Mieszkanie', plannedAmount: 1500, icon: '🏠', group: 'needs' },
    { name: 'Żywność', plannedAmount: 1200, icon: '🍕', group: 'needs' },
    { name: 'Transport', plannedAmount: 400, icon: '🚗', group: 'needs' },
    { name: 'Zdrowie i Higiena', plannedAmount: 300, icon: '💊', group: 'needs' },
    { name: 'Rachunki i Subskrypcje', plannedAmount: 200, icon: '📱', group: 'needs' }
  ]

  // GRUPA 2: STYL ŻYCIA (miesięczne)
  const lifestyleEnvelopes = [
    { name: 'Wydatki Osobiste', plannedAmount: 500, icon: '🎮', group: 'lifestyle' },
    { name: 'Gastronomia', plannedAmount: 300, icon: '🍽️', group: 'lifestyle' },
    { name: 'Ubrania i Akcesoria', plannedAmount: 200, icon: '👕', group: 'lifestyle' }
  ]

  // GRUPA 3: CELE FINANSOWE (miesięczne)
  const financialGoalsEnvelopes = [
    { name: 'Fundusz Awaryjny', plannedAmount: 1000, icon: '🚨', group: 'financial' }
  ]

  // FUNDUSZE CELOWE (roczne)
  const targetFundsEnvelopes = [
    { name: 'Auto: Serwis i Ubezpieczenie', plannedAmount: 2000, icon: '🚗', group: 'target' },
    { name: 'Prezenty i Okazje', plannedAmount: 1500, icon: '🎁', group: 'target' },
    { name: 'Podróże', plannedAmount: 5000, icon: '✈️', group: 'target' },
    { name: 'Wesele', plannedAmount: 15000, icon: '💍', group: 'target' },
    { name: 'Budowanie Przyszłości', plannedAmount: 9600, icon: '📈', group: 'target' },
    { name: 'Wolne środki (roczne)', plannedAmount: 2000, icon: '🎉', group: 'target' }
  ]

  // Stwórz wszystkie koperty miesięczne
  const allMonthlyEnvelopes = [...needsEnvelopes, ...lifestyleEnvelopes, ...financialGoalsEnvelopes]
  
  for (const envelope of allMonthlyEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'monthly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: 0, // Nowy użytkownik zaczyna z pustymi kopertami
        icon: envelope.icon,
        group: envelope.group
      }
    })
  }

  // Stwórz wszystkie koperty roczne
  for (const envelope of targetFundsEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'yearly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: 0,
        icon: envelope.icon,
        group: envelope.group
      }
    })
  }
}
