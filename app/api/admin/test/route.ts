import { NextResponse } from 'next/server'

export async function GET() {
    try {
        return NextResponse.json({
            message: 'Test endpoint działa!',
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasJwtSecret: !!process.env.JWT_SECRET,
                nodeEnv: process.env.NODE_ENV
            }
        })
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

