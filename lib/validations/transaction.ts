import { z } from 'zod'

/** Wspólna walidacja daty — akceptuje YYYY-MM-DD, ISO datetime, i inne parsowalne formaty */
const dateStringSchema = z.string().refine((val) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
  return dateRegex.test(val) || datetimeRegex.test(val) || !isNaN(Date.parse(val))
}, 'Nieprawidłowy format daty')

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500, 'Opis może mieć maksymalnie 500 znaków').optional(),
  date: dateStringSchema.optional(),
  envelopeId: z.string().optional(),
  category: z.string().max(100).optional(),
  includeInStats: z.boolean().optional().default(true)
})

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  date: dateStringSchema.optional(),
  envelopeId: z.string().optional(),
  category: z.string().max(100).optional()
})

export const incomeSchema = z.object({
  type: z.enum(['salary', 'other', 'bonus']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500).optional(),
  date: dateStringSchema.optional(),
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
  toFreedom: z.number().nonnegative().optional(),
  bonusDistribution: z.array(z.object({
    envelopeId: z.string().min(1, 'Envelope ID is required'),
    amount: z.number().nonnegative('Amount must be non-negative')
  })).optional()
})

export const expenseSchema = z.object({
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500, 'Opis może mieć maksymalnie 500 znaków').optional(),
  envelopeId: z.string().min(1, 'Wybierz kopertę'),
  category: z.string().min(1, 'Wybierz kategorię'),
  date: dateStringSchema.optional(),
  includeInStats: z.boolean().optional().default(true)
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>

