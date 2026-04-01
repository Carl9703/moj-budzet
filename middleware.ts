import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { rateLimit } from '@/lib/middleware/rateLimit'

export async function middleware(request: NextRequest) {
  // 1. Handle OPTIONS for CORS
  if (request.method === 'OPTIONS') {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Global API Protections (Applies to ALL /api/ routes)
  if (pathname.startsWith('/api/')) {
    // A. Request Size Limiting (2MB)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      )
    }

    // B. Global Rate Limiting (100 req/min per IP)
    // Acts as a safety net. Auth routes have stricter limits handled internally.
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const globalLimit = rateLimit(ip + ':global', { limit: 100, windowMs: 60 * 1000 })

    if (!globalLimit.success) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((globalLimit.reset! - Date.now()) / 1000)) } }
      )
    }

    // C. Authorization Check (Skip for auth endpoints)
    if (!pathname.startsWith('/api/auth/')) {
      const authHeader = request.headers.get('Authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      const token = authHeader.substring(7)
      const secretStr = process.env.JWT_SECRET

      if (!secretStr) {
        console.error('JWT_SECRET is not defined in environment variables')
        return NextResponse.json(
          { error: 'Internal Server Configuration Error' },
          { status: 500 }
        )
      }

      const secret = new TextEncoder().encode(secretStr)

      try {
        // Verify token using jose (Edge compatible)
        await jwtVerify(token, secret)
        // Token valid - proceed
        return NextResponse.next()
      } catch (error) {
        console.error('JWT Verification failed:', error)
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }
  }

  // Allow all other requests (pages, statics, etc.)
  return NextResponse.next()
}

export const config = {
  // Match only API routes to reduce overhead
  matcher: ['/api/:path*'],
}
