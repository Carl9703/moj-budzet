// Envelope type constants - used for business logic instead of hardcoded names
export const ENVELOPE_TYPES = {
    SAVINGS: 'savings',    // For accumulating money (e.g., "Budowanie Przyszłości")
    BUDGET: 'budget',      // Regular monthly spending envelopes
    EMERGENCY: 'emergency', // Emergency fund (e.g., "Fundusz Awaryjny") 
    GOAL: 'goal'           // Specific savings goals (e.g., "Wesele", "Wakacje")
} as const

export type EnvelopeType = typeof ENVELOPE_TYPES[keyof typeof ENVELOPE_TYPES]

// Helper to check envelope types
export const isSavingsEnvelope = (envelopeType: string | null | undefined): boolean => {
    return envelopeType === ENVELOPE_TYPES.SAVINGS
}

export const isEmergencyEnvelope = (envelopeType: string | null | undefined): boolean => {
    return envelopeType === ENVELOPE_TYPES.EMERGENCY
}

export const isGoalEnvelope = (envelopeType: string | null | undefined): boolean => {
    return envelopeType === ENVELOPE_TYPES.GOAL
}

export const isBudgetEnvelope = (envelopeType: string | null | undefined): boolean => {
    return envelopeType === ENVELOPE_TYPES.BUDGET || !envelopeType
}

// Protected envelopes that shouldn't be reset on month close
export const isProtectedEnvelope = (envelopeType: string | null | undefined): boolean => {
    return envelopeType === ENVELOPE_TYPES.SAVINGS ||
        envelopeType === ENVELOPE_TYPES.EMERGENCY ||
        envelopeType === ENVELOPE_TYPES.GOAL
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
