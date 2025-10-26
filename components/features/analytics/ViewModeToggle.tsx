'use client'
import { useState, useEffect } from 'react'

interface ViewModeToggleProps {
  currentMode: 'expenses' | 'income'
  onModeChange: (mode: 'expenses' | 'income') => void
  loading?: boolean
}

export function ViewModeToggle({ currentMode, onModeChange, loading = false }: ViewModeToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [hoveredMode, setHoveredMode] = useState<'expenses' | 'income' | null>(null)

  const handleModeChange = (mode: 'expenses' | 'income') => {
    if (mode === currentMode || loading) return
    
    setIsAnimating(true)
    setTimeout(() => {
      onModeChange(mode)
      setIsAnimating(false)
    }, 200)
  }

  // Efekt pulsowania dla aktywnego trybu
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !isAnimating) {
        // Subtelny efekt pulsowania dla aktywnego trybu
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [loading, isAnimating])

  return (
    <div className="mb-8">
      {/* Nagłówek sekcji z animacją */}
      <div className="mb-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <span className="mr-3 text-3xl animate-bounce">📊</span>
          Analiza Finansowa
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Wybierz typ analizy, którą chcesz przeglądać
        </p>
      </div>

      {/* Profesjonalny przełącznik z zaawansowanymi animacjami */}
      <div className="relative">
        {/* Tło przełącznika z gradientem */}
        <div className="relative bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-1.5 shadow-lg border border-gray-200 dark:border-gray-600">
          {/* Aktywny wskaźnik z animacją */}
          <div 
            className={`absolute top-1.5 bottom-1.5 w-1/2 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-xl transition-all duration-300 ease-out ${
              isAnimating ? 'scale-95 shadow-2xl' : 'scale-100'
            } ${currentMode === 'expenses' ? 'animate-pulse-slow' : ''}`}
            style={{
              left: currentMode === 'expenses' ? '6px' : 'calc(50% + 6px)',
              transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
              boxShadow: currentMode === 'expenses' 
                ? '0 8px 25px rgba(59, 130, 246, 0.15)' 
                : '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
          />
          
          {/* Przyciski z zaawansowanymi efektami */}
          <div className="relative flex">
            <button
              onClick={() => handleModeChange('expenses')}
              onMouseEnter={() => setHoveredMode('expenses')}
              onMouseLeave={() => setHoveredMode(null)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center py-5 px-8 rounded-xl font-semibold text-sm transition-all duration-300 ${
                currentMode === 'expenses'
                  ? 'text-blue-600 dark:text-blue-400 relative z-10 transform scale-105'
                  : hoveredMode === 'expenses'
                    ? 'text-gray-800 dark:text-gray-200 transform scale-102'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`text-2xl transition-all duration-300 ${
                  currentMode === 'expenses' 
                    ? 'scale-125 animate-bounce' 
                    : hoveredMode === 'expenses'
                      ? 'scale-110'
                      : 'scale-100'
                }`}>
                  💰
                </div>
                <div className="text-left">
                  <div className="font-bold text-base text-gray-900 dark:text-white">Wydatki</div>
                  <div className="text-xs opacity-75 font-medium text-gray-600 dark:text-gray-400">Analiza kosztów i wydatków</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange('income')}
              onMouseEnter={() => setHoveredMode('income')}
              onMouseLeave={() => setHoveredMode(null)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center py-5 px-8 rounded-xl font-semibold text-sm transition-all duration-300 ${
                currentMode === 'income'
                  ? 'text-blue-600 dark:text-blue-400 relative z-10 transform scale-105'
                  : hoveredMode === 'income'
                    ? 'text-gray-800 dark:text-gray-200 transform scale-102'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`text-2xl transition-all duration-300 ${
                  currentMode === 'income' 
                    ? 'scale-125 animate-bounce' 
                    : hoveredMode === 'income'
                      ? 'scale-110'
                      : 'scale-100'
                }`}>
                  📈
                </div>
                <div className="text-left">
                  <div className="font-bold text-base text-gray-900 dark:text-white">Przychody</div>
                  <div className="text-xs opacity-75 font-medium text-gray-600 dark:text-gray-400">Analiza dochodów i przychodów</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Wskaźnik ładowania z animacją */}
        {loading && (
          <div className="absolute -top-3 -right-3">
            <div className="relative">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-3 border-blue-200 border-t-transparent rounded-full animate-ping"></div>
            </div>
          </div>
        )}

        {/* Wskaźnik aktywności */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            currentMode === 'expenses' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-green-500 dark:bg-green-400'
          } ${isAnimating ? 'scale-150' : 'scale-100'}`}></div>
        </div>
      </div>

      {/* Dodatkowe informacje z animacją */}
      <div className="mt-6 flex items-center justify-center space-x-8 text-xs text-gray-500 dark:text-gray-400 animate-fade-in-delayed">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
          <span className="font-medium">Aktywny tryb</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <span className="font-medium">Tryb nieaktywny</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
          <span className="font-medium">Gotowy do użycia</span>
        </div>
      </div>
    </div>
  )
}
