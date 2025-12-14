import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(1, 'Hasło jest wymagane'),
})

export const registerSchema = z.object({
    name: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

export const transactionSchema = z.object({
    amount: z.number().min(0.01, 'Kwota musi być większa od 0'),
    description: z.string().optional(),
    date: z.string(),
    type: z.enum(['income', 'expense', 'transfer']),
    categoryId: z.string().optional(),
    envelopeId: z.string().optional(),
    fromEnvelopeId: z.string().optional(),
    toEnvelopeId: z.string().optional(),
})

export const envelopeSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    icon: z.string().min(1, 'Ikona jest wymagana'),
    plannedAmount: z.number().min(0, 'Kwota planowana nie może być ujemna'),
    type: z.enum(['monthly', 'yearly']),
    group: z.string().optional(),
})

export const recurringPaymentSchema = z.object({
    name: z.string().min(1, 'Nazwa jest wymagana'),
    amount: z.number().min(0.01, 'Kwota musi być większa od 0'),
    dayOfMonth: z.number().min(1).max(31),
    type: z.enum(['expense', 'transfer']),
    category: z.string().optional(),
    envelopeId: z.string().optional(),
    fromEnvelopeId: z.string().optional(),
    toEnvelopeId: z.string().optional(),
    isActive: z.boolean(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type TransactionFormData = z.infer<typeof transactionSchema>
export type EnvelopeFormData = z.infer<typeof envelopeSchema>
export type RecurringPaymentFormData = z.infer<typeof recurringPaymentSchema>

// Modal schemas - using coerce for HTML input compatibility
export const expenseSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Kwota musi być większa od 0'),
    description: z.string().optional(),
    envelopeId: z.string().min(1, 'Wybierz kopertę'),
    category: z.string().min(1, 'Wybierz kategorię'),
    date: z.string().min(1, 'Wybierz datę'),
})

export const incomeSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Kwota musi być większa od 0'),
    description: z.string().optional(),
    includeInStats: z.boolean(),
    type: z.enum(['salary', 'other', 'bonus']),
    date: z.string().min(1, 'Wybierz datę'),
})

export const transferSchema = z.object({
    fromEnvelopeId: z.string().min(1, 'Wybierz kopertę źródłową'),
    toEnvelopeId: z.string().min(1, 'Wybierz kopertę docelową'),
    amount: z.coerce.number().min(0.01, 'Kwota musi być większa od 0'),
    description: z.string().optional(),
    date: z.string().min(1, 'Wybierz datę'),
    toCategory: z.string().optional(),
})

// Form data types - output types after Zod validation  
export type ExpenseFormData = z.output<typeof expenseSchema>
export type IncomeFormData = z.output<typeof incomeSchema>
export type TransferFormData = z.output<typeof transferSchema>
