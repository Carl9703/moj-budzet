'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/layout/Modal'
import { useToast } from '@/components/ui/feedback/Toast'
import { handleMoneyInput } from '@/lib/utils/input'

interface Props {
    onClose: () => void
    onSave: (data: BonusData) => void
    onSwitchToIncome?: () => void
}

interface BonusData {
    amount: number
    toGifts: number
    toInsurance: number
    toHolidays: number
    toFreedom: number
}

export function BonusModal({ onClose, onSave, onSwitchToIncome }: Props) {
    const { showToast } = useToast()
    const [amount, setAmount] = useState('1300')
    const [percentages, setPercentages] = useState({
        gifts: 40,
        insurance: 40,
        freedom: 20
    })

    const calculateAmount = (percentage: number) => {
        return Math.round((Number(amount) * percentage) / 100)
    }

    const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0)
    const isValid = totalPercentage === 100

    const handlePercentageChange = (key: string, value: string) => {
        const numValue = parseInt(value) || 0
        if (numValue >= 0 && numValue <= 100) {
            setPercentages(prev => ({
                ...prev,
                [key]: numValue
            }))
        }
    }

    const handleSubmit = () => {
        if (!isValid) {
            showToast('Suma procentów musi wynosić 100%!', 'warning')
            return
        }

        onSave({
            amount: Number(amount),
            toGifts: calculateAmount(percentages.gifts),
            toInsurance: calculateAmount(percentages.insurance),
            toHolidays: 0,
            toFreedom: calculateAmount(percentages.freedom)
        })
        onClose()
    }

    const categories = [
        { key: 'gifts', icon: '🎁', label: 'Prezenty i Okazje' },
        { key: 'insurance', icon: '🚗', label: 'Auto: Serwis i Ubezpieczenie' },
        { key: 'freedom', icon: '💰', label: 'Wolne środki (roczne)' }
    ]

    return (
        <Modal title="💰 WPŁYNĘŁA PREMIA" onClose={onClose}>
            <div className="max-h-[95vh] overflow-y-auto pr-2">
                {/* Przycisk powrotu */}
                {onSwitchToIncome && (
                    <button type="button"
                        onClick={onSwitchToIncome}
                        className="mb-4 py-2 px-3 border border-zinc-700 rounded-xl bg-zinc-800 text-zinc-300 cursor-pointer text-sm hover:bg-zinc-700 transition-colors"
                    >
                        ← Powrót do wyboru typu przychodu
                    </button>
                )}

                <div className="bg-emerald-950/50 p-4 rounded-xl mb-5 border border-emerald-800">
                    <label className="block mb-2 font-medium text-emerald-300">
                        Kwota premii kwartalnej
                    </label>
                    <input
                        type="number"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => handleMoneyInput(e.target.value, setAmount)}
                        className="w-full p-3 text-2xl font-bold border-2 border-emerald-600 rounded-xl text-center bg-zinc-900 text-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                </div>

                <div className="mb-5">
                    <h3 className="font-semibold mb-4 text-zinc-200">PODZIAŁ PROCENTOWY:</h3>

                    <div className="grid grid-cols-1 gap-2">
                        {categories.map(cat => (
                            <div
                                key={cat.key}
                                className="flex items-center gap-2 p-2 px-3 bg-zinc-800 rounded-xl text-sm"
                            >
                                <span className="text-base">{cat.icon}</span>
                                <span className="font-medium flex-1 text-zinc-300">{cat.label}</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={percentages[cat.key as keyof typeof percentages]}
                                        onChange={(e) => handlePercentageChange(cat.key, e.target.value)}
                                        className="w-10 p-1 text-center text-xs border border-zinc-600 rounded bg-zinc-900 text-zinc-200"
                                    />
                                    <span className="text-xs text-zinc-500">%</span>
                                </div>
                                <span className="text-right font-semibold text-emerald-500 text-xs min-w-[50px]">
                                    {calculateAmount(percentages[cat.key as keyof typeof percentages])} zł
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className={`mt-3 p-2 rounded-xl text-center ${isValid ? 'bg-emerald-900/50' : 'bg-rose-900/50'
                        }`}>
                        <span className={`font-semibold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Suma: {totalPercentage}%
                            {!isValid && ' (musi być 100%)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* PRZYCISKI - sticky na dole */}
            <div className="sticky bottom-0 bg-zinc-900 pt-4 mt-6 border-t border-zinc-800 flex gap-2 justify-end">
                <button type="button"
                    onClick={onClose}
                    className="py-3 px-6 border border-zinc-700 rounded-xl bg-zinc-800 text-zinc-300 cursor-pointer text-sm font-semibold hover:bg-zinc-700 transition-colors"
                >
                    Anuluj
                </button>
                <button type="button"
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all ${isValid
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                        }`}
                >
                    ✓ ZATWIERDŹ PODZIAŁ
                </button>
            </div>
        </Modal>
    )
}