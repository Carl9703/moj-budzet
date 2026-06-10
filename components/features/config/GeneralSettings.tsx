import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trash2, LogOut, Plus, Settings, RefreshCw, Save } from 'lucide-react'
import { authorizedFetch } from '@/lib/api/client'
import { BonusDistributionRule, Envelope } from '@/lib/types/config'
import { useToast } from '@/components/ui/feedback/Toast'
import { blockInvalidDecimals } from '@/lib/utils/input'

interface GeneralSettingsProps {
    defaultSalary: number
    setDefaultSalary: (val: number) => void
    bonusDistribution: BonusDistributionRule[]
    setBonusDistribution: (val: BonusDistributionRule[]) => void
    envelopes: Envelope[]
    apiToken?: string | null
    setApiToken?: (val: string | null) => void
}

export function GeneralSettings({
    defaultSalary,
    setDefaultSalary,
    bonusDistribution,
    setBonusDistribution,
    envelopes,
    apiToken,
    setApiToken
}: GeneralSettingsProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [saving, setSaving] = useState(false)

    // Local draft state - this is what the user edits
    const [draftSalary, setDraftSalary] = useState(defaultSalary)
    const [draftDistribution, setDraftDistribution] = useState(bonusDistribution)
    const [hasChanges, setHasChanges] = useState(false)

    // Sync draft with props when props change externally
    useEffect(() => {
        setDraftSalary(defaultSalary)
    }, [defaultSalary])

    useEffect(() => {
        setDraftDistribution(bonusDistribution)
    }, [bonusDistribution])

    // Track changes
    useEffect(() => {
        const salaryChanged = draftSalary !== defaultSalary
        const distributionChanged = JSON.stringify(draftDistribution) !== JSON.stringify(bonusDistribution)
        setHasChanges(salaryChanged || distributionChanged)
    }, [draftSalary, draftDistribution, defaultSalary, bonusDistribution])

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' })
        } catch (e) {
            console.error(e)
        }
        localStorage.removeItem('user')
        router.push('/auth/signin')
    }

    const addDistributionRule = () => {
        setDraftDistribution([...draftDistribution, { envelopeId: '', envelopeName: '', percentage: 0 }])
    }

    const removeDistributionRule = (index: number) => {
        setDraftDistribution(draftDistribution.filter((_, i) => i !== index))
    }

    const updateDistributionRule = (index: number, key: keyof typeof draftDistribution[0], value: any) => {
        const selectedEnv = key === 'envelopeId' ? envelopes.find(e => e.id === value) : null

        setDraftDistribution(draftDistribution.map((d, i) => {
            if (i !== index) return d
            if (key === 'envelopeId') {
                return { ...d, envelopeId: value, envelopeName: selectedEnv?.name || '' }
            }
            return { ...d, [key]: value }
        }))
    }

    const totalPercentage = draftDistribution.reduce((sum, d) => sum + d.percentage, 0)

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

    const handleSave = async () => {
        setSaving(true)
        try {
            // Update parent state
            setDefaultSalary(draftSalary)
            setBonusDistribution(draftDistribution)

            // Also save to API directly
            const payload = {
                defaultSalary: Number(draftSalary || 0),
                bonusDistribution: draftDistribution.length > 0 ? JSON.stringify(draftDistribution) : null
            }

            const res = await authorizedFetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                showToast('Ustawienia zapisane', 'success')
                setHasChanges(false)
            } else {
                showToast('Błąd zapisu', 'error')
            }
        } catch (error) {
            showToast('Błąd zapisu', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDiscard = () => {
        setDraftSalary(defaultSalary)
        setDraftDistribution(bonusDistribution)
        setHasChanges(false)
    }

    const handleGenerateToken = async () => {
        setSaving(true)
        try {
            const res = await authorizedFetch('/api/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generateApiToken: true })
            })
            if (res.ok) {
                const data = await res.json()
                if (setApiToken && data.config?.apiToken) {
                    setApiToken(data.config.apiToken)
                }
                showToast('Nowy token wygenerowany', 'success')
            } else {
                showToast('Błąd generowania', 'error')
            }
        } catch {
            showToast('Błąd generowania', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
                    <Settings size={28} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-xl font-bold text-white tracking-tight">Ustawienia Ogólne</h2>
                    <p className="text-xs text-zinc-500 font-medium">Konfiguracja przychodów i domyślnego podziału środków</p>
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="px-5 py-3 rounded-2xl bg-zinc-800 text-zinc-400 border border-white/5 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 active:scale-95 flex items-center gap-3"
                    >
                        <LogOut size={16} /> Wyloguj
                    </button>
                </div>
            </div>

            {/* Default Salary */}
            <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl max-w-xl shadow-xl">
                <label className="block text-xs font-black text-zinc-500 mb-4 uppercase tracking-[0.2em] ml-1">
                    Domyślny Przychód Miesięczny
                </label>
                <div className="relative group">
                    <input
                        type="number"
                        value={draftSalary}
                        onChange={(e) => setDraftSalary(Number(e.target.value))}
                        onInput={blockInvalidDecimals}
                        className="w-full text-4xl font-black text-emerald-400 bg-zinc-950/50 border border-white/5 rounded-2xl py-6 px-6 focus:border-emerald-500/50 transition-all outline-none tabular-nums shadow-inner"
                        placeholder="0.00"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-sm tracking-widest pointer-events-none group-focus-within:text-emerald-500/50 transition-colors">PLN</span>
                </div>
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <span className="text-amber-400 text-sm">ℹ️</span>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-300/60 leading-relaxed">
                        Ta kwota będzie używana jako domyślna podstawa przy planowaniu nowego miesiąca.
                    </p>
                </div>
            </div>

            {/* Bonus Distribution */}
            <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl shadow-xl space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎁</span>
                        <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest text-[14px]">
                            Podział Premii
                        </h3>
                    </div>
                    <button
                        onClick={addDistributionRule}
                        className="px-4 py-2.5 rounded-xl bg-zinc-800 text-amber-400 border border-white/5 text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={14} /> Dodaj regułę
                    </button>
                </div>

                <div className="space-y-3">
                    {draftDistribution.map((dist, index) => (
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
                                    onInput={blockInvalidDecimals}
                                    placeholder="0"
                                    className="input-glass text-right font-bold py-2 !pr-10 w-full"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">%</span>
                            </div>

                            <button
                                onClick={() => removeDistributionRule(index)}
                                className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    {draftDistribution.length === 0 && (
                        <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-700/50 rounded-xl">
                            Brak reguł podziału premii
                        </div>
                    )}
                </div>

                <div className="px-6 py-5 rounded-3xl bg-zinc-950/50 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Suma przydziału:</span>
                        <span className={`text-sm font-black tabular-nums transition-colors ${totalPercentage > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {totalPercentage}%
                        </span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(totalPercentage, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full transition-all duration-500 ${totalPercentage > 100 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                        />
                    </div>
                    {totalPercentage > 100 && (
                        <p className="mt-2 text-[8px] font-black uppercase text-rose-500/70 tracking-widest text-center">Suma procentów przekracza 100%!</p>
                    )}
                </div>
            </div>

            {/* API Integration */}
            <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl max-w-xl shadow-xl space-y-6">
                <div>
                    <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest text-[14px]">
                        📱 Integracja Mobile (Google Wallet)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2 font-medium">
                        Token autoryzacji dla aplikacji mobilnej na Androida.
                    </p>
                </div>

                {apiToken ? (
                    <div className="space-y-4">
                        <div className="px-4 py-3 bg-zinc-950 border border-white/5 rounded-xl font-mono text-xs text-amber-400 break-all select-all">
                            {apiToken}
                        </div>
                        <button
                            onClick={handleGenerateToken}
                            disabled={saving}
                            className="text-xs text-zinc-500 hover:text-white transition-colors"
                        >
                            Wygeneruj nowy token
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleGenerateToken}
                        disabled={saving}
                        className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm transition-all hover:bg-amber-500 active:scale-95 shadow-lg shadow-amber-500/20"
                    >
                        Wygeneruj Token API
                    </button>
                )}
            </div>

            {/* Save / Discard Buttons */}
            {hasChanges && (
                <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-amber-500/10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center animate-pulse">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-400 tracking-tight">Masz niezapisane zmiany</p>
                            <p className="text-xs font-black uppercase tracking-widest text-amber-500/60 mt-0.5">Zapisz lub odrzuć wprowadzone modyfikacje</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={handleDiscard}
                            className="flex-1 sm:flex-none px-6 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                        >
                            Odrzuć zmiany
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex-1 sm:flex-none px-8 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${saving ? 'opacity-70 cursor-wait' : 'hover:scale-105 hover:bg-emerald-500'}`}
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            {saving ? 'Zapisuję...' : 'Zapisz zmiany'}
                        </button>
                    </div>
                </div>
            )}

            {/* Debug / Fix Actions */}
            <div className="pt-8 border-t border-zinc-800/50">
                <button
                    onClick={handleFixCategories}
                    className="text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-2"
                >
                    <Settings size={12} /> Napraw brakujące kategorie (Reseed)
                </button>
            </div>
        </div>
    )
}
