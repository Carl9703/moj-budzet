/**
 * System-wide constants for descriptions and magic strings
 */

export const SYSTEM_DESCRIPTIONS = {
    MONTH_CLOSE: '🔒 Zamknięcie miesiąca',
    BALANCE_TRANSFER: 'przeniesienie bilansu',
    TRANSFER_PREFIX: 'Transfer:',
    BONUS_TRANSFER_INDICATOR: '→'
} as const

export const YEARLY_ENVELOPE_NAMES = [
    'Wesele',
    'Wakacje',
    'Prezenty i Okazje',
    'Auto: Serwis i Ubezpieczenie',
    'Fundusz Awaryjny',
    'Budowanie Przyszłości',
    'Wolne środki (roczne)',
    'Inwestycje',
    'Konto wspólne'
]

export const POLISH_MONTHS = [
    'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
    'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
]

export const LEGACY_NAME_MAPPINGS: Record<string, string> = {
    'Podróże': 'Wakacje'
}

export const SYSTEM_GROUPS = {
    NEEDS: {
        id: 'needs',
        name: 'Potrzeby',
        icon: '🏡',
        color: 'var(--color-needs)'
    },
    LIFESTYLE: {
        id: 'lifestyle',
        name: 'Styl Życia',
        icon: '🎉',
        color: 'var(--color-lifestyle)'
    },
    ASSETS: {
        id: 'assets',
        name: 'Cele i majątek',
        icon: '💰',
        color: 'var(--color-assets)'
    },
    OTHER: {
        id: 'other',
        name: 'Inne',
        icon: '📦',
        color: 'var(--color-other)'
    }
} as const

export const GROUP_NAME_MAP: Record<string, string> = {
    'needs': SYSTEM_GROUPS.NEEDS.name,
    'lifestyle': SYSTEM_GROUPS.LIFESTYLE.name,
    'assets': SYSTEM_GROUPS.ASSETS.name,
    'Potrzeby': SYSTEM_GROUPS.NEEDS.name,
    'Styl Życia': SYSTEM_GROUPS.LIFESTYLE.name,
    'Cele i majątek': SYSTEM_GROUPS.ASSETS.name,
    'Inne': SYSTEM_GROUPS.OTHER.name
}

export const GROUP_ICON_MAP: Record<string, string> = {
    'needs': SYSTEM_GROUPS.NEEDS.icon,
    'lifestyle': SYSTEM_GROUPS.LIFESTYLE.icon,
    'assets': SYSTEM_GROUPS.ASSETS.icon,
    'Potrzeby': SYSTEM_GROUPS.NEEDS.icon,
    'Styl Życia': SYSTEM_GROUPS.LIFESTYLE.icon,
    'Cele i majątek': SYSTEM_GROUPS.ASSETS.icon,
    'Inne': SYSTEM_GROUPS.OTHER.icon
}

// Fixed start date for app usage - required for correct balance due to legacy data issues
export const DEFAULT_APP_START_DATE = '2025-09-01'
