'use client'
import { useState } from 'react'

interface ViewModeToggleProps {
  currentMode: 'expenses' | 'income'
  onModeChange: (mode: 'expenses' | 'income') => void
  loading?: boolean
}

export function ViewModeToggle({ currentMode, onModeChange, loading = false }: ViewModeToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleModeChange = (mode: 'expenses' | 'income') => {
    if (mode === currentMode || loading) return
    setIsAnimating(true)
    setTimeout(() => {
      onModeChange(mode)
      setIsAnimating(false)
    }, 200)
  }

  return (
    <div className="mb-8">
      {/* Toggle Container */}
      <div className="relative mx-auto max-w-2xl">
        <div
          className="relative p-1.5 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Background Glow */}
          <div className={`absolute top-0 bottom-0 w-1/2 transition-all duration-500 ease-out rounded-xl opacity-20 pointer-events-none ${currentMode === 'expenses'
              ? 'left-0 bg-blue-500 blur-2xl'
              : 'left-1/2 bg-emerald-500 blur-2xl'
            }`} />

          {/* Slider Indicator */}
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800/80 rounded-xl shadow-lg border border-white/10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${isAnimating ? 'scale-95' : 'scale-100'
              }`}
            style={{
              left: currentMode === 'expenses' ? '6px' : 'calc(50% + 0px)', // adjusted for correct sliding
              transform: currentMode === 'expenses' ? 'translateX(0)' : 'translateX(0)'
              // Simple left positioning is safer than transform for this specific 2-item toggle layout
            }}
          />

          {/* Buttons Row */}
          <div className="relative flex z-10">
            <button
              onClick={() => handleModeChange('expenses')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl transition-all duration-300 group ${currentMode === 'expenses' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl transition-transform duration-300 ${currentMode === 'expenses' ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 grayscale opacity-70'
                  }`}>💰</span>
                <div className="text-left">
                  <div className="font-bold text-sm md:text-base leading-tight">Wydatki</div>
                  <div className="text-[10px] md:text-xs opacity-70">Analiza kosztów</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange('income')}
              disabled={loading}
              className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl transition-all duration-300 group ${currentMode === 'income' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl transition-transform duration-300 ${currentMode === 'income' ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 grayscale opacity-70'
                  }`}>📈</span>
                <div className="text-left">
                  <div className="font-bold text-sm md:text-base leading-tight">Przychody</div>
                  <div className="text-[10px] md:text-xs opacity-70">Analiza dochodów</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute -top-2 -right-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
