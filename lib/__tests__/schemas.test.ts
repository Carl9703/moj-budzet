import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import {
    expenseSchema,
    incomeSchema,
    transferSchema,
    loginSchema,
    registerSchema
} from '@/lib/schemas'

describe('Form Schemas', () => {
    describe('loginSchema', () => {
        it('should validate correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123'
            }
            expect(() => loginSchema.parse(validData)).not.toThrow()
        })

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'not-an-email',
                password: 'password123'
            }
            expect(() => loginSchema.parse(invalidData)).toThrow()
        })

        it('should reject empty password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: ''
            }
            expect(() => loginSchema.parse(invalidData)).toThrow()
        })
    })

    describe('expenseSchema', () => {
        it('should validate correct expense data', () => {
            const validData = {
                amount: 100.50,
                description: 'Test expense',
                envelopeId: 'env-123',
                category: 'food',
                date: '2024-01-15'
            }
            const result = expenseSchema.parse(validData)
            expect(result.amount).toBe(100.50)
        })

        it('should coerce string amount to number', () => {
            const dataWithStringAmount = {
                amount: '50.25',
                description: '',
                envelopeId: 'env-123',
                category: 'food',
                date: '2024-01-15'
            }
            const result = expenseSchema.parse(dataWithStringAmount)
            expect(result.amount).toBe(50.25)
            expect(typeof result.amount).toBe('number')
        })

        it('should reject amount less than 0.01', () => {
            const invalidData = {
                amount: 0,
                envelopeId: 'env-123',
                category: 'food',
                date: '2024-01-15'
            }
            expect(() => expenseSchema.parse(invalidData)).toThrow()
        })
    })

    describe('incomeSchema', () => {
        it('should validate salary income', () => {
            const validData = {
                amount: 5000,
                type: 'salary',
                includeInStats: true,
                date: '2024-01-15'
            }
            expect(() => incomeSchema.parse(validData)).not.toThrow()
        })

        it('should validate bonus income', () => {
            const validData = {
                amount: 1000,
                type: 'bonus',
                includeInStats: true,
                date: '2024-01-15'
            }
            expect(() => incomeSchema.parse(validData)).not.toThrow()
        })

        it('should reject invalid income type', () => {
            const invalidData = {
                amount: 5000,
                type: 'invalid-type',
                includeInStats: true,
                date: '2024-01-15'
            }
            expect(() => incomeSchema.parse(invalidData)).toThrow()
        })
    })

    describe('transferSchema', () => {
        it('should validate correct transfer data', () => {
            const validData = {
                fromEnvelopeId: 'env-1',
                toEnvelopeId: 'env-2',
                amount: 200,
                date: '2024-01-15'
            }
            expect(() => transferSchema.parse(validData)).not.toThrow()
        })

        it('should require both envelope IDs', () => {
            const missingTo = {
                fromEnvelopeId: 'env-1',
                toEnvelopeId: '',
                amount: 200,
                date: '2024-01-15'
            }
            expect(() => transferSchema.parse(missingTo)).toThrow()
        })
    })

    describe('registerSchema', () => {
        it('should validate correct registration data', () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'secure123'
            }
            expect(() => registerSchema.parse(validData)).not.toThrow()
        })

        it('should require name with at least 2 characters', () => {
            const invalidData = {
                name: 'J',
                email: 'john@example.com',
                password: 'secure123'
            }
            expect(() => registerSchema.parse(invalidData)).toThrow()
        })

        it('should require password with at least 6 characters', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '12345'
            }
            expect(() => registerSchema.parse(invalidData)).toThrow()
        })
    })
})
