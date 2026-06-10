import { Prisma } from '@prisma/client'

/** Konwertuje Prisma.Decimal, number, lub string do number. */
export function toNum(v: Prisma.Decimal | number | string | null | undefined): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v) || 0
  return v.toNumber()
}

/**
 * Rekurencyjnie konwertuje wszystkie Prisma.Decimal w obiekcie/tablicy na number.
 * Stosuj przed NextResponse.json() aby uniknąć serializacji Decimal jako string.
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  // Prisma.Decimal ma metodę toNumber()
  if (typeof obj === 'object' && typeof (obj as any).toNumber === 'function') {
    return (obj as any).toNumber() as unknown as T
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimals) as unknown as T
  }
  if (obj instanceof Date) {
    return obj as unknown as T
  }
  if (typeof obj === 'object' && obj !== null && (obj as Object).constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeDecimals(v)])
    ) as unknown as T
  }
  return obj
}
