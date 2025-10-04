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
        { error: validation.error.errors[0].message },
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
  // Koperty miesięczne
  const monthlyEnvelopes = [
    { name: 'Jedzenie', plannedAmount: 1200, icon: '🍕' },
    { name: 'Transport', plannedAmount: 400, icon: '🚗' },
    { name: 'Rozrywka', plannedAmount: 300, icon: '🎬' },
    { name: 'Higiena/Zdrowie', plannedAmount: 200, icon: '💊' },
    { name: 'Ubrania', plannedAmount: 200, icon: '👕' },
    { name: 'Dom', plannedAmount: 300, icon: '🏠' },
    { name: 'Telekom/Subskrypcje', plannedAmount: 150, icon: '📱' },
    { name: 'Nieprzewidziane', plannedAmount: 250, icon: '⚠️' }
  ]

  for (const envelope of monthlyEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'monthly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: 0, // Nowy użytkownik zaczyna z pustymi kopertami
        icon: envelope.icon
      }
    })
  }

  // Koperty roczne
  const yearlyEnvelopes = [
    { name: 'Wakacje', plannedAmount: 5000, icon: '✈️' },
    { name: 'Prezenty', plannedAmount: 2000, icon: '🎁' },
    { name: 'OC', plannedAmount: 800, icon: '📋' },
    { name: 'Święta', plannedAmount: 1500, icon: '🎄' },
    { name: 'Awaryjne', plannedAmount: 10000, icon: '🚨' }
  ]

  for (const envelope of yearlyEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'yearly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: 0,
        icon: envelope.icon
      }
    })
  }
}
