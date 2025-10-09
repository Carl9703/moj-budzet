import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env'
import { signinSchema } from '@/lib/validations/auth'

const JWT_SECRET = env.JWT_SECRET

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Walidacja z Zod (pomiń dla demo user)
    const validation = signinSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Demo użytkownik
    if (email === 'demo@example.com' && password === 'demo123') {
      let user = await prisma.user.findUnique({
        where: { email: 'demo@example.com' }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            name: 'Demo User',
          }
        })

        await createDefaultEnvelopes(user.id)
        await createDemoConfig(user.id)
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    }

    // Sprawdź prawdziwego użytkownika
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.hashedPassword) {
      return NextResponse.json(
        { error: 'Nieprawidłowy email lub hasło' },
        { status: 401 }
      )
    }

    // Sprawdź hasło
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Nieprawidłowy email lub hasło' },
        { status: 401 }
      )
    }

    // Stwórz token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas logowania' },
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
    { name: 'Fundusz Awaryjny', plannedAmount: 1000, icon: '🚨', group: 'financial' },
    { name: 'Budowanie Przyszłości', plannedAmount: 800, icon: '📈', group: 'financial' }
  ]

  // FUNDUSZE CELOWE (roczne)
  const targetFundsEnvelopes = [
    { name: 'Auto: Serwis i Ubezpieczenie', plannedAmount: 2000, icon: '🚗', group: 'target' },
    { name: 'Prezenty i Okazje', plannedAmount: 1500, icon: '🎁', group: 'target' },
    { name: 'Podróże', plannedAmount: 5000, icon: '✈️', group: 'target' },
    { name: 'Wesele', plannedAmount: 15000, icon: '💍', group: 'target' },
    { name: 'Wolne środki (roczne)', plannedAmount: 2000, icon: '🎉', group: 'target' }
  ]

  // Stwórz wszystkie koperty miesięczne (demo user zaczyna z pełnymi kopertami)
  const allMonthlyEnvelopes = [...needsEnvelopes, ...lifestyleEnvelopes, ...financialGoalsEnvelopes]
  
  for (const envelope of allMonthlyEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'monthly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: envelope.plannedAmount, // Demo user zaczyna z pełnymi kopertami
        icon: envelope.icon,
        group: envelope.group
      }
    })
  }

  // Stwórz wszystkie koperty roczne (demo user ma 30% wypełnienia)
  for (const envelope of targetFundsEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'yearly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: Math.floor(envelope.plannedAmount * 0.3), // 30% wypełnienia
        icon: envelope.icon,
        group: envelope.group
      }
    })
  }
}

async function createDemoConfig(userId: string) {
  await prisma.userConfig.create({
    data: {
      userId,
      defaultSalary: 6000,
      defaultToJoint: 1500,
      defaultToSavings: 1000,
      defaultToVacation: 420,
      defaultToInvestment: 600
    }
  })
}
