import { describe, it, expect } from 'vitest'
import { roundToCents, formatMoney, formatMoneyWithSeparators } from '@/lib/utils/money'

describe('money utils', () => {
    describe('roundToCents', () => {
        it('rounds values up correctly', () => {
            expect(roundToCents(10.555)).toBe(10.56)
        })

        it('rounds values down correctly', () => {
            expect(roundToCents(10.554)).toBe(10.55)
        })

        it('handles exact cent values without changes', () => {
            expect(roundToCents(10.50)).toBe(10.50)
        })

        it('handles negative values correctly', () => {
            expect(roundToCents(-10.555)).toBe(-10.55)
        })
    })

    describe('formatMoney', () => {
        it('formats money with currency by default', () => {
            expect(formatMoney(10.5)).toBe('10,50 zł')
        })

        it('formats money without currency when showCurrency is false', () => {
            expect(formatMoney(10.5, false)).toBe('10,50')
        })

        it('replaces dot with comma in decimals', () => {
            expect(formatMoney(1234.56)).toBe('1234,56 zł')
        })
    })

    describe('formatMoneyWithSeparators', () => {
        it('formats money with thousand separators and currency', () => {
            // Uwaga: pl-PL używa spacji/NBSP jako separatora tysięcy
            const formatted = formatMoneyWithSeparators(1234.56)
            expect(formatted.replace(/\s/g, ' ')).toMatch(/1\s?234,56 zł/)
        })

        it('formats money with thousand separators without currency', () => {
            const formatted = formatMoneyWithSeparators(1234.56, false)
            expect(formatted.replace(/\s/g, ' ')).toMatch(/1\s?234,56/)
        })

        it('adds two decimal places for integers', () => {
            const formatted = formatMoneyWithSeparators(1000)
            expect(formatted.replace(/\s/g, ' ')).toMatch(/1\s?000,00 zł/)
        })
    })
})
