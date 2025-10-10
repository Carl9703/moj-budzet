import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500, 'Opis może mieć maksymalnie 500 znaków').optional(),
  date: z.string().refine((val) => {
    // Accept both date (YYYY-MM-DD) and datetime (ISO string) formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    return dateRegex.test(val) || datetimeRegex.test(val) || !isNaN(Date.parse(val))
  }, 'Nieprawidłowy format daty').optional(),
  envelopeId: z.string().optional(),
  category: z.string().max(100).optional(),
  includeInStats: z.boolean().optional().default(true)
})

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  date: z.string().refine((val) => {
    // Accept both date (YYYY-MM-DD) and datetime (ISO string) formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    return dateRegex.test(val) || datetimeRegex.test(val) || !isNaN(Date.parse(val))
  }, 'Nieprawidłowy format daty').optional(),
  envelopeId: z.string().optional(),
  category: z.string().max(100).optional()
})

export const incomeSchema = z.object({
  type: z.enum(['salary', 'other', 'bonus']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500).optional(),
  date: z.string().refine((val) => {
    // Accept both date (YYYY-MM-DD) and datetime (ISO string) formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    return dateRegex.test(val) || datetimeRegex.test(val) || !isNaN(Date.parse(val))
  }, 'Nieprawidłowy format daty').optional(),
  includeInStats: z.boolean().optional(),
  // Dla salary
  toSavings: z.number().nonnegative().optional(),
  toVacation: z.number().nonnegative().optional(),
  toWedding: z.number().nonnegative().optional(),
  toInvestment: z.number().nonnegative().optional(),
  toJoint: z.number().nonnegative().optional(),
  toGroceries: z.number().nonnegative().optional(),
  forExpenses: z.number().nonnegative().optional(),
  // Dla bonus
  toGifts: z.number().nonnegative().optional(),
  toInsurance: z.number().nonnegative().optional(),
  toHolidays: z.number().nonnegative().optional(),
  toFreedom: z.number().nonnegative().optional()
})

export const expenseSchema = z.object({
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500, 'Opis może mieć maksymalnie 500 znaków').optional(),
  envelopeId: z.string().min(1, 'Wybierz kopertę'),
  category: z.string().min(1, 'Wybierz kategorię'),
  date: z.string().refine((val) => {
    // Accept both date (YYYY-MM-DD) and datetime (ISO string) formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    return dateRegex.test(val) || datetimeRegex.test(val) || !isNaN(Date.parse(val))
  }, 'Nieprawidłowy format daty').optional(),
  includeInStats: z.boolean().optional().default(true)
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>

