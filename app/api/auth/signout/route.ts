import { NextResponse } from 'next/server'
import { jsonResponse } from '@/lib/utils/api'

export async function POST() {
    const response = jsonResponse({ success: true, message: 'Wylogowano' })
    response.cookies.delete('authToken')
    return response
}
