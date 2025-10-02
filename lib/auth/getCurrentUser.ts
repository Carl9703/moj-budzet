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
        // Pobierz token z nagłówka Authorization
        const authHeader = request.headers.get('authorization')
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }

        const token = authHeader.substring(7) // Usuń "Bearer "
        
        // Zweryfikuj token
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
        
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
