import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import bcrypt from 'bcryptjs'
import { jsonResponse } from '@/lib/utils/api'
import { signupSchema } from '@/lib/validations/auth'
import { ENVELOPE_TYPES } from '@/lib/constants/envelopeTypes'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import { rateLimit } from '@/lib/middleware/rateLimit'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const limitResult = rateLimit(ip, { limit: 5, windowMs: 15 * 60 * 1000 }) // 5 requests per 15 min

    if (!limitResult.success) {
      return jsonResponse(
        { error: 'Zbyt wiele prób rejestracji. Spróbuj ponownie później.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limitResult.reset! - Date.now()) / 1000)) } }
      )
    }

    const body = await req.json()

    // Walidacja z Zod
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return jsonResponse(
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
      return jsonResponse(
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

    return jsonResponse(
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
    logger.error('Signup error', error)

    return jsonResponse(
      {
        error: 'Wystąpił błąd podczas tworzenia konta',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
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
    { name: 'Auto: Serwis i Ubezpieczenie', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 2000, icon: '🚗', group: 'needs', isAccumulating: true },

    { name: 'Wydatki Osobiste', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 500, icon: '🎮', group: 'lifestyle' },
    { name: 'Gastronomia', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 300, icon: '🍽️', group: 'lifestyle' },
    { name: 'Ubrania i Akcesoria', type: 'monthly', envelopeType: ENVELOPE_TYPES.BUDGET, plannedAmount: 200, icon: '👕', group: 'lifestyle' },
    { name: 'Prezenty i Okazje', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 1500, icon: '🎁', group: 'lifestyle', isAccumulating: true },
    { name: 'Podróże', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 5000, icon: '✈️', group: 'lifestyle', isAccumulating: true },
    { name: 'Wesele', type: 'yearly', envelopeType: ENVELOPE_TYPES.GOAL, plannedAmount: 15000, icon: '💍', group: 'lifestyle', isAccumulating: true },

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
        isAccumulating: envelope.isAccumulating || false
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
