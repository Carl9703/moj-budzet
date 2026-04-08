'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface AnnualReportHeaderProps {
    selectedYear: number
    availableYears: number[]
    onYearChange: (year: number) => void
}

export function AnnualReportHeader({ selectedYear, availableYears, onYearChange }: AnnualReportHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent mb-2">
                        Raporty Roczne
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-base">
                        Kompleksowa analiza finansów za rok {selectedYear}
                    </p>
                </div>

                {/* Year Selector */}
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        className="appearance-none bg-zinc-800/60 backdrop-blur-xl border border-zinc-700 rounded-xl px-6 py-3 pr-12 text-zinc-100 font-semibold text-lg cursor-pointer hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
                </div>
            </div>
        </motion.div>
    )
}
