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
        { error: validation.error.errors[0].message },
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
        currentAmount: envelope.plannedAmount, // Demo user zaczyna z pełnymi kopertami
        icon: envelope.icon
      }
    })
  }

  // Koperty roczne
  const yearlyEnvelopes = [
    { name: 'Wesele', plannedAmount: 15000, icon: '💑' },
    { name: 'Wakacje', plannedAmount: 5000, icon: '✈️' },
    { name: 'Prezenty', plannedAmount: 2000, icon: '🎁' },
    { name: 'OC', plannedAmount: 800, icon: '📋' },
    { name: 'Święta', plannedAmount: 1500, icon: '🎄' }
  ]

  for (const envelope of yearlyEnvelopes) {
    await prisma.envelope.create({
      data: {
        userId,
        name: envelope.name,
        type: 'yearly',
        plannedAmount: envelope.plannedAmount,
        currentAmount: Math.floor(envelope.plannedAmount * 0.3), // 30% wypełnienia
        icon: envelope.icon
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
