/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Tremor colors safelist - rozszerzona paleta
    {
      pattern: /^(bg|border|hover:bg|hover:border|hover:text|fill|ring|stroke|text|ui-selected:bg|ui-selected:border|ui-selected:text)-(blue|red|green|yellow|purple|pink|cyan|lime|orange|indigo|emerald|teal|sky|violet|fuchsia|rose|amber|slate|gray|zinc|neutral|stone)$/,
    },
    // Wszystkie kolory z ANALYTICS_COLORS
    'bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-emerald-500',
    'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-lime-500', 'bg-orange-500', 'bg-violet-500',
    'text-blue-500', 'text-teal-500', 'text-amber-500', 'text-rose-500', 'text-indigo-500', 'text-emerald-500',
    'text-purple-500', 'text-pink-500', 'text-cyan-500', 'text-lime-500', 'text-orange-500', 'text-violet-500',
    // Dodatkowe warianty kolorów dla Tremor
    'bg-blue-400', 'bg-blue-600', 'bg-teal-400', 'bg-teal-600', 'bg-amber-400', 'bg-amber-600',
    'bg-rose-400', 'bg-rose-600', 'bg-indigo-400', 'bg-indigo-600', 'bg-emerald-400', 'bg-emerald-600',
    'bg-purple-400', 'bg-purple-600', 'bg-pink-400', 'bg-pink-600', 'bg-cyan-400', 'bg-cyan-600',
    'bg-lime-400', 'bg-lime-600', 'bg-orange-400', 'bg-orange-600', 'bg-violet-400', 'bg-violet-600',
  ],
}