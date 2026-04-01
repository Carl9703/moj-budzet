// Envelope type constants - used for business logic instead of hardcoded names
export const ENVELOPE_TYPES = {
    SAVINGS: 'savings',    // For accumulating money (e.g., "Budowanie Przyszłości")
    BUDGET: 'budget',      // Regular monthly spending envelopes
    EMERGENCY: 'emergency', // Emergency fund (e.g., "Fundusz Awaryjny") 
    GOAL: 'goal'           // Specific savings goals (e.g., "Wesele", "Wakacje")
} as const

export type EnvelopeType = typeof ENVELOPE_TYPES[keyof typeof ENVELOPE_TYPES]

// Helper to check envelope types
export const isSavingsEnvelope = (envelopeType: string | null | undefined, name?: string): boolean => {
    if (envelopeType === ENVELOPE_TYPES.SAVINGS) return true
    if (!envelopeType && name) return getEnvelopeTypeFromName(name) === ENVELOPE_TYPES.SAVINGS
    return false
}

export const isEmergencyEnvelope = (envelopeType: string | null | undefined, name?: string): boolean => {
    if (envelopeType === ENVELOPE_TYPES.EMERGENCY) return true
    if (!envelopeType && name) return getEnvelopeTypeFromName(name) === ENVELOPE_TYPES.EMERGENCY
    return false
}

export const isGoalEnvelope = (envelopeType: string | null | undefined, name?: string): boolean => {
    if (envelopeType === ENVELOPE_TYPES.GOAL) return true
    if (!envelopeType && name) return getEnvelopeTypeFromName(name) === ENVELOPE_TYPES.GOAL
    return false
}

export const isBudgetEnvelope = (envelopeType: string | null | undefined, name?: string): boolean => {
    if (envelopeType === ENVELOPE_TYPES.BUDGET) return true
    if (!envelopeType && name) return getEnvelopeTypeFromName(name) === ENVELOPE_TYPES.BUDGET
    return envelopeType === ENVELOPE_TYPES.BUDGET || !envelopeType
}

// Protected envelopes that shouldn't be reset on month close (Savings, Emergency, Goal)
export const isProtectedEnvelope = (envelopeType: string | null | undefined, name?: string): boolean => {
    if (envelopeType) {
        const type = envelopeType.toLowerCase().trim()
        return type === ENVELOPE_TYPES.SAVINGS ||
            type === ENVELOPE_TYPES.EMERGENCY ||
            type === ENVELOPE_TYPES.GOAL
    }

    // Fallback to name-based check for legacy envelopes
    if (name) {
        const type = getEnvelopeTypeFromName(name)
        return type === ENVELOPE_TYPES.SAVINGS ||
            type === ENVELOPE_TYPES.EMERGENCY ||
            type === ENVELOPE_TYPES.GOAL
    }

    return false
}

// Legacy name-to-type mapping for migration
export const LEGACY_ENVELOPE_TYPE_MAP: Record<string, EnvelopeType> = {
    'Budowanie Przyszłości': ENVELOPE_TYPES.SAVINGS,
    'Fundusz Awaryjny': ENVELOPE_TYPES.EMERGENCY,
    'Wesele': ENVELOPE_TYPES.GOAL,
    'Wakacje': ENVELOPE_TYPES.GOAL,
    'Podróże': ENVELOPE_TYPES.GOAL,
    'Prezenty i Okazje': ENVELOPE_TYPES.GOAL,
    'Auto: Serwis i Ubezpieczenie': ENVELOPE_TYPES.GOAL,
    'Cele finansowe': ENVELOPE_TYPES.GOAL,
    'Wolne środki (roczne)': ENVELOPE_TYPES.GOAL,
}

// Get envelope type from legacy name (for backward compatibility)
export const getEnvelopeTypeFromName = (name: string): EnvelopeType => {
    return LEGACY_ENVELOPE_TYPE_MAP[name] || ENVELOPE_TYPES.BUDGET
}
