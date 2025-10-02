import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

interface JWTPayload {
    userId: string
    email: string
    iat: number
    exp: number
}

export async function getCurrentUser(request: NextRequest): Promise<{ userId: string; email: string } | null> {
    try {
        console.log('🔍 Checking JWT token...')
        
        // Pobierz token z nagłówka Authorization
        const authHeader = request.headers.get('authorization')
        console.log('📋 Auth header:', authHeader ? 'present' : 'missing')
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No valid auth header')
            return null
        }

        const token = authHeader.substring(7) // Usuń "Bearer "
        console.log('🔑 Token length:', token.length)
        
        // Zweryfikuj token
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
        console.log('✅ Token verified for user:', decoded.email)
        
        return {
            userId: decoded.userId,
            email: decoded.email
        }
    } catch (error) {
        console.error('❌ Error verifying JWT token:', error)
        return null
    }
}

export function createAuthResponse(message: string = 'Unauthorized') {
    return Response.json(
        { error: message },
        { status: 401 }
    )
}
