import { describe, it, expect } from 'vitest'
import { toNum, serializeDecimals } from '@/lib/utils/decimal'
import { Prisma } from '@prisma/client'

describe('decimal utils', () => {
    describe('toNum', () => {
        it('handles null and undefined', () => {
            expect(toNum(null)).toBe(0)
            expect(toNum(undefined)).toBe(0)
        })

        it('returns numbers directly', () => {
            expect(toNum(10.5)).toBe(10.5)
            expect(toNum(0)).toBe(0)
        })

        it('parses strings', () => {
            expect(toNum('10.5')).toBe(10.5)
            expect(toNum('invalid')).toBe(0)
        })

        it('converts Prisma.Decimal to number', () => {
            const decimal = new Prisma.Decimal('10.5')
            expect(toNum(decimal)).toBe(10.5)
        })
    })

    describe('serializeDecimals', () => {
        it('handles null and undefined', () => {
            expect(serializeDecimals(null)).toBeNull()
            expect(serializeDecimals(undefined)).toBeUndefined()
        })

        it('converts single Prisma.Decimal to number', () => {
            const decimal = new Prisma.Decimal('15.75')
            expect(serializeDecimals(decimal)).toBe(15.75)
        })

        it('recursively converts arrays', () => {
            const arr = [new Prisma.Decimal('1.1'), new Prisma.Decimal('2.2')]
            expect(serializeDecimals(arr)).toEqual([1.1, 2.2])
        })

        it('recursively converts nested objects', () => {
            const obj = {
                id: 1,
                name: 'Test',
                amount: new Prisma.Decimal('100.5'),
                nested: {
                    value: new Prisma.Decimal('50.25')
                },
                dates: new Date('2024-01-01')
            }
            
            const result = serializeDecimals(obj) as any
            expect(result.amount).toBe(100.5)
            expect(result.nested.value).toBe(50.25)
            expect(result.id).toBe(1)
            expect(result.name).toBe('Test')
            expect(result.dates).toBeInstanceOf(Date)
        })

        it('preserves plain objects without Decimals', () => {
            const obj = { a: 1, b: 'string' }
            expect(serializeDecimals(obj)).toEqual({ a: 1, b: 'string' })
        })
    })
})
