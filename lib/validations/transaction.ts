import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500, 'Opis może mieć maksymalnie 500 znaków').optional(),
  date: z.string().datetime().optional(),
  envelopeId: z.string().optional(),
  category: z.string().max(100).optional(),
  includeInStats: z.boolean().optional().default(true)
})

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
  envelopeId: z.string().optional(),
  category: z.string().max(100).optional()
})

export const incomeSchema = z.object({
  type: z.enum(['salary', 'other', 'bonus']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  description: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
  includeInStats: z.boolean().optional(),
  // Dla salary
  toSavings: z.number().nonnegative().optional(),
  toVacation: z.number().nonnegative().optional(),
  toInvestment: z.number().nonnegative().optional(),
  toJoint: z.number().nonnegative().optional(),
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
  date: z.string().datetime().optional(),
  includeInStats: z.boolean().optional().default(true)
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>

