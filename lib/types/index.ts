// Shared types used across the application

export interface DateRange {
    from: Date | undefined
    to: Date | undefined
}

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
    icon?: string
}

export interface Transaction {
    id: string
    type: string
    amount: number
    description: string | null
    date: string
    category?: string
    envelopeId?: string
    envelope?: {
        id: string
        name: string
        icon: string
    }
}

export interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    isArchived?: boolean
}

// App configuration from API
export interface AppConfig {
    defaultSalary?: number
    bonusDistribution?: string
    [key: string]: unknown
}

// Transaction item from list API  
export interface TransactionListItem {
    id: string
    type: string
    amount: number
    description: string | null
    date: string
    category?: string
    envelopeId?: string
    envelope?: {
        id: string
        name: string
        icon: string
    }
}
