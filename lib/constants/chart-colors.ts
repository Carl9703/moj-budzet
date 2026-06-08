/**
 * Spójny system kolorów dla wszystkich wykresów w zakładce Analizy.
 * Zamiast domyślnych kolorów Tailwind/Tremor używamy precyzyjnie dobranej palety.
 */

// Główne kolory semantyczne
export const INCOME_COLOR = {
  solid: '#34d399',
  from: '#34d399',
  to: '#059669',
  glow: 'rgba(52, 211, 153, 0.15)',
}

export const EXPENSE_COLOR = {
  solid: '#fb7185',
  from: '#fb7185',
  to: '#e11d48',
  glow: 'rgba(251, 113, 133, 0.15)',
}

export const SAVINGS_COLOR = {
  solid: '#fbbf24',
  from: '#fbbf24',
  to: '#d97706',
  glow: 'rgba(251, 191, 36, 0.15)',
}

export const SAVINGS_RATE_COLOR = {
  solid: '#a78bfa',
  from: '#a78bfa',
  to: '#7c3aed',
  glow: 'rgba(167, 139, 250, 0.15)',
}

/**
 * Stała mapa kolorów per grupa budżetowa.
 * Używana zarówno na dashboardzie (kropki) jak i w wykresach (DonutChart) —
 * dzięki temu kolory są zawsze spójne między widokami.
 */
export const GROUP_COLORS: Record<string, string> = {
  // klucze DB
  'needs':      '#34d399', // emerald — Potrzeby
  'wants':      '#f472b6', // pink — Styl Życia (alias)
  'lifestyle':  '#f472b6', // pink — Styl Życia
  'assets':     '#a78bfa', // violet — Cele i Majątek
  'goals':      '#fb923c', // orange — Cele Oszczędnościowe
  'emergency':  '#60a5fa', // blue — Fundusz Awaryjny
  'other':      '#71717a', // zinc — Inne
  // polskie nazwy (z GROUP_NAME_MAP)
  'Potrzeby':           '#34d399',
  'Styl Życia':         '#f472b6',
  'Cele i majątek':     '#a78bfa',
  'Cele Oszczędnościowe': '#fb923c',
  'Inne':               '#71717a',
}

/**
 * Skurowana paleta 12 kolorów dla wykresów kołowych / słupkowych kategorii.
 * Każdy kolor jest wyrazisty na ciemnym tle, ale harmonijnie współgra z resztą.
 */
export const CHART_PALETTE = [
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
  '#fb923c', // orange-400
  '#2dd4bf', // teal-400
  '#facc15', // yellow-400
  '#f87171', // red-400
  '#c084fc', // purple-400
  '#4ade80', // green-400
  '#38bdf8', // sky-400
  '#fda4af', // rose-300
]

export const CHART_PALETTE_GLOW = [
  'rgba(244, 114, 182, 0.2)',
  'rgba(167, 139, 250, 0.2)',
  'rgba(52, 211, 153, 0.2)',
  'rgba(96, 165, 250, 0.2)',
  'rgba(251, 146, 60, 0.2)',
  'rgba(45, 212, 191, 0.2)',
  'rgba(250, 204, 21, 0.2)',
  'rgba(248, 113, 113, 0.2)',
  'rgba(192, 132, 252, 0.2)',
  'rgba(74, 222, 128, 0.2)',
  'rgba(56, 189, 248, 0.2)',
  'rgba(253, 164, 175, 0.2)',
]

/** Mapowanie palet Tremor (dla DonutChart z @tremor/react) */
export const TREMOR_PALETTE = [
  'pink', 'violet', 'emerald', 'blue',
  'orange', 'teal', 'yellow', 'red',
  'purple', 'green', 'sky', 'rose',
] as const

/** Style tooltipa — wspólny obiekt do użycia w recharts Tooltip */
export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(9, 9, 11, 0.92)',
  borderColor: 'rgba(63, 63, 70, 0.6)',
  borderRadius: '14px',
  color: 'white',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  padding: '12px 16px',
  border: '1px solid rgba(63, 63, 70, 0.6)',
}

export const AXIS_STYLE = {
  stroke: '#52525b',
  fontSize: 11,
  fill: '#71717a',
}

export const GRID_STYLE = {
  strokeDasharray: '1 4',
  stroke: 'rgba(82, 82, 91, 0.4)',
  vertical: false,
}
