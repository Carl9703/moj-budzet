import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export async function getUserIdFromToken(request: NextRequest): Promise<string> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Brak tokenu autoryzacji')
    }

    const token = authHeader.substring(7)
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
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
