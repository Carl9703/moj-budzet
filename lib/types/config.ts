export interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    type: 'monthly' | 'yearly'
    isArchived?: boolean
    isAccumulating?: boolean
}

export interface BonusDistributionRule {
    envelopeId: string
    envelopeName: string
    percentage: number
}

export interface UserConfig {
    defaultSalary: number
    bonusDistribution: BonusDistributionRule[] | null
    apiToken?: string | null
}

export interface EnvelopeUpdateData {
    name?: string
    icon?: string | null
    plannedAmount?: number
    group?: string
    isAccumulating?: boolean
    type?: 'monthly' | 'yearly'
}
