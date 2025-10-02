// app/api/auth/signin/route.ts - Prosty endpoint logowania
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production'

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Signin API called')
    const { email, password } = await req.json()
    console.log('📧 Email:', email)

    // Podstawowa walidacja
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { error: 'Email i hasło są wymagane' },
        { status: 400 }
      )
    }

    // Demo użytkownik
    if (email === 'demo@example.com' && password === 'demo123') {
      console.log('🚀 Demo user login attempt')
      console.log('🔗 DATABASE_URL exists:', !!process.env.DATABASE_URL)
      console.log('🔗 DATABASE_URL_DEV exists:', !!process.env.DATABASE_URL_DEV)
      
      let user = await prisma.user.findUnique({
        where: { email: 'demo@example.com' }
      })

      if (!user) {
        console.log('👤 Creating demo user')
        // Stwórz demo użytkownika
        user = await prisma.user.create({
          data: {
            email: 'demo@example.com',
            name: 'Demo User',
          }
        })
        console.log('✅ Demo user created:', user.id)

        // Stwórz podstawowe koperty dla demo użytkownika
        console.log('📦 Creating envelopes')
        await createDefaultEnvelopes(user.id)
        console.log('⚙️ Creating config')
        await createDemoConfig(user.id)
        console.log('✅ Demo setup complete')
      } else {
        console.log('👤 Demo user found:', user.id)
      }

      console.log('🔑 Creating JWT token')
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      console.log('✅ Demo login successful')
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
    console.error('❌ Login error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas logowania: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
