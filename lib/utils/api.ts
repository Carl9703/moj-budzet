import { NextResponse } from 'next/server'
import { serializeDecimals } from './decimal'

/**
 * Zamiennik dla NextResponse.json() który automatycznie konwertuje
 * Prisma.Decimal → number przed serializacją do JSON.
 *
 * Prisma.Decimal.toJSON() zwraca string, co powoduje konkatenację
 * zamiast dodawania w komponentach. Ten wrapper to naprawia.
 */
export function jsonResponse(data: unknown, init?: { status?: number; headers?: Record<string, string> }): NextResponse {
  return NextResponse.json(serializeDecimals(data), init)
}
