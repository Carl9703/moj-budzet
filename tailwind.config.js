/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  // WAŻNA ZMIANA: Dodajemy ścieżkę do Tremora i upraszczamy resztę
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}", // <-- Kluczowa linia
  ],
  // NOWA SEKCJA: 'safelist' to nasza polisa ubezpieczeniowa
  // Gwarantuje, że kolory Tremora ZAWSZE znajdą się w finalnym CSS.
  // Gwarantuje, że kolory Tremora ZAWSZE znajdą się w finalnym CSS.
  safelist: [],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Tutaj zostawiamy bez zmian Twoje kolory z Shadcn
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Dodajemy pełną paletę kolorów Tremora, aby była dostępna
        tremor: {
          brand: {
            faint: "#fffbeb", // amber-50
            muted: "#fde68a", // amber-200
            subtle: "#fbbf24", // amber-400
            DEFAULT: "#f59e0b", // amber-500
            emphasis: "#d97706", // amber-600
            inverted: "#09090b", // zinc-950
          },
          background: {
            muted: "#09090b", // zinc-950
            subtle: "#18181b", // zinc-900
            DEFAULT: "#18181b", // zinc-900
            emphasis: "#27272a", // zinc-800
          },
          border: {
            DEFAULT: "#27272a", // zinc-800
          },
          ring: {
            DEFAULT: "#27272a", // zinc-800
          },
          content: {
            subtle: "#71717a", // zinc-500
            DEFAULT: "#a1a1aa", // zinc-400
            emphasis: "#e4e4e7", // zinc-200
            strong: "#fafafa", // zinc-50
            inverted: "#09090b", // zinc-950
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
       boxShadow: {
        // Dodajemy cienie Tremora
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      fontSize: {
        "tremor-label": ["0.75rem"],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  plugins: [],
};