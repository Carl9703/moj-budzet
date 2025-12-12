
import { useRouter } from 'next/navigation'
import { Trash2, LogOut, Plus, Settings, RefreshCw } from 'lucide-react'
import { authorizedFetch } from '@/lib/api/client'
import { BonusDistributionRule, Envelope } from '@/lib/types/config'

interface GeneralSettingsProps {
    defaultSalary: number
    setDefaultSalary: (val: number) => void
    bonusDistribution: BonusDistributionRule[]
    setBonusDistribution: (val: BonusDistributionRule[]) => void
    envelopes: Envelope[]
}

export function GeneralSettings({
    defaultSalary,
    setDefaultSalary,
    bonusDistribution,
    setBonusDistribution,
    envelopes
}: GeneralSettingsProps) {
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        router.push('/auth/signin')
    }

    const addDistributionRule = () => {
        setBonusDistribution([...bonusDistribution, { envelopeId: '', envelopeName: '', percentage: 0 }])
    }

    const removeDistributionRule = (index: number) => {
        setBonusDistribution(bonusDistribution.filter((_, i) => i !== index))
    }

    const updateDistributionRule = (index: number, key: keyof typeof bonusDistribution[0], value: any) => {
        const selectedEnv = key === 'envelopeId' ? envelopes.find(e => e.id === value) : null

        setBonusDistribution(bonusDistribution.map((d, i) => {
            if (i !== index) return d
            if (key === 'envelopeId') {
                return { ...d, envelopeId: value, envelopeName: selectedEnv?.name || '' }
            }
            return { ...d, [key]: value }
        }))
    }

    const totalPercentage = bonusDistribution.reduce((sum, d) => sum + d.percentage, 0)

    const handleFixCategories = async () => {
        try {
            const res = await authorizedFetch('/api/categories?reseed=true')
            if (res.ok) {
                window.location.reload()
            }
        } catch (error) {
            console.error('Failed to fix categories', error)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                    <Settings size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Ustawienia Ogólne</h2>
                    <p className="text-sm text-slate-400">Konfiguracja przychodów i premii</p>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors flex items-center gap-2 text-sm border border-transparent hover:border-rose-500/30"
                    >
                        <LogOut size={16} /> Wyloguj
                    </button>
                </div>
            </div>

            {/* Default Salary */}
            <div className="glass-card p-6 max-w-lg">
                <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
                    Domyślny Przychód Miesięczny
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={defaultSalary}
                        onChange={(e) => setDefaultSalary(Number(e.target.value))}
                        className="input-glass w-full text-2xl font-bold !text-emerald-400 !border-slate-700 focus:!border-emerald-500/50 py-4 pl-4 !pr-16 text-right"
                        placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">PLN</span>
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    <span className="text-indigo-400">ℹ️</span>
                    Ta kwota będzie używana jako domyślna podstawa przy planowaniu nowego miesiąca.
                </p>
            </div>

            {/* Bonus Distribution */}
            <div className="glass-card p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        🎁 Podział Premii
                    </h3>
                    <button
                        onClick={addDistributionRule}
                        className="btn-glass text-xs py-2 px-3 flex items-center gap-2"
                    >
                        <Plus size={14} /> Dodaj regułę
                    </button>
                </div>

                <div className="space-y-3">
                    {bonusDistribution.map((dist, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <select
                                value={dist.envelopeId}
                                onChange={(e) => updateDistributionRule(index, 'envelopeId', e.target.value)}
                                className="flex-1 input-glass py-2 appearance-none"
                            >
                                <option value="">Wybierz kopertę</option>
                                {envelopes.filter(e => e.isAccumulating).map(env => (
                                    <option key={env.id} value={env.id}>{env.icon || '📦'} {env.name}</option>
                                ))}
                            </select>

                            <div className="w-24 relative">
                                <input
                                    type="number"
                                    value={dist.percentage === 0 ? '' : dist.percentage}
                                    onChange={(e) => updateDistributionRule(index, 'percentage', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="input-glass text-right font-bold py-2 !pr-10 w-full"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">%</span>
                            </div>

                            <button
                                onClick={() => removeDistributionRule(index)}
                                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    {bonusDistribution.length === 0 && (
                        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
                            Brak reguł podziału premii
                        </div>
                    )}
                </div>

                <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-sm text-indigo-300">
                    <div className="flex justify-between items-center mb-1">
                        <span>Suma przydziału:</span>
                        <span className={`font-bold ${totalPercentage > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {totalPercentage}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${totalPercentage > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Debug / Fix Actions */}
            <div className="pt-8 border-t border-slate-800/50">
                <button
                    onClick={handleFixCategories}
                    className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                    <Settings size={12} /> Napraw brakujące kategorie (Reseed)
                </button>
            </div>
        </div>
    )
}
