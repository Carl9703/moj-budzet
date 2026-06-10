import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env'

const JWT_SECRET = env.JWT_SECRET

interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export async function getUserIdFromToken(request: NextRequest): Promise<string> {
  try {
    const token = request.cookies.get('authToken')?.value

    if (!token) {
      throw new Error('Brak tokenu autoryzacji')
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    if (!decoded.userId) {
      throw new Error('Nieprawidłowy token - brak userId')
    }

    return decoded.userId
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token wygasł - zaloguj się ponownie')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Nieprawidłowy token')
    }
    throw error
  }
}

export function unauthorizedResponse(message: string = 'Brak autoryzacji') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}
