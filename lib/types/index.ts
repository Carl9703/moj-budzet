// Shared types used across the application

export interface DateRange {
    from: Date | undefined
    to: Date | undefined
}

export type EnvelopeGroup = 'needs' | 'wants' | 'assets' | 'emergency';
export type EnvelopeType = 'monthly' | 'yearly' | 'emergency';

export interface SpendingTreeNode {
    type: 'GROUP' | 'ENVELOPE' | 'CATEGORY' | 'TRANSACTION'
    id: string
    name: string
    total: number
    comparison?: {
        previousTotal: number
        change: number
        changePercent: number
    }
    children?: SpendingTreeNode[]
    date?: string
    description?: string
    amount?: number
    categoryId?: string
    icon?: string | null
}

export interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: EnvelopeGroup
    type: EnvelopeType
    isArchived?: boolean
    userId: string
    createdAt: Date
    updatedAt: Date
}

export interface Category {
    id: string
    name: string
    icon: string
    defaultEnvelope: string | null
    isArchived: boolean
    userId: string
}

export interface RecurringPayment {
    id: string
    name: string
    amount: number
    dayOfMonth: number
    envelopeId: string | null
    category: string
    type: 'expense' | 'transfer'
    fromEnvelopeId?: string | null
    toEnvelopeId?: string | null
    isActive: boolean
    dismissedUntil?: Date | null
    userId: string
    envelope?: Envelope
    fromEnvelope?: Envelope
    toEnvelope?: Envelope
}

export interface Transaction {
    id: string
    type: string
    amount: number
    description: string | null
    date: string
    category?: string
    envelopeId?: string
    includeInStats: boolean
    transferPairId?: string | null
    envelope?: {
        id: string
        name: string
        icon: string
    }
}

export interface AppConfig {
    id: string
    userId: string
    defaultSalary: number
    bonusDistribution: string | null // JSON string of BonusDistributionRule[]
    updatedAt: Date
}

export interface BonusDistributionRule {
    envelopeId: string
    envelopeName: string
    percentage: number
}

// Transaction item from list API  
export type TransactionListItem = Transaction;
