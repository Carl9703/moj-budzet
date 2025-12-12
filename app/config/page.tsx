'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authorizedFetch } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/feedback/Toast'
import { RecurringPayments } from '@/components/features/config/RecurringPayments'
import { GeneralSettings } from '@/components/features/config/GeneralSettings'
import { EnvelopeManager } from '@/components/features/config/EnvelopeManager'
import { Category, useCategories } from '@/lib/contexts/CategoryContext'
import { Settings, Package, Zap, Save, RefreshCw } from 'lucide-react'

import { Envelope, BonusDistributionRule } from '@/lib/types/config'

type TabType = 'general' | 'envelopes' | 'categories' | 'recurring'

export default function ConfigPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('envelopes') // Default to envelopes as it's the main focus now

  const { categories, refreshCategories } = useCategories()
  // State
  const [defaultSalary, setDefaultSalary] = useState<number>(0)
  const [bonusDistribution, setBonusDistribution] = useState<BonusDistributionRule[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])

  useEffect(() => {
    if (!isAuthenticated) return
    let mounted = true
    const load = async () => {
      try {
        const res = await authorizedFetch('/api/config', { cache: 'no-store' })
        const data = await res.json()
        if (!mounted) return

        const cfg = data?.config
        if (cfg) {
          setDefaultSalary(cfg.defaultSalary ?? 0)
          if (cfg.bonusDistribution) {
            try {
              const parsed = JSON.parse(cfg.bonusDistribution)
              setBonusDistribution(Array.isArray(parsed) ? parsed : [])
            } catch {
              setBonusDistribution([])
            }
          }
        }

        // Load active envelopes
        const activeMonthly = (data?.monthlyEnvelopes || []).map((e: any) => ({ ...e, type: 'monthly' }))
        const activeYearly = (data?.yearlyEnvelopes || []).map((e: any) => ({ ...e, type: 'yearly' }))

        // Also fetch archived envelopes to have complete state
        try {
          const archivedRes = await authorizedFetch('/api/config?archived=true', { cache: 'no-store' })
          const archivedData = await archivedRes.json()
          const archivedMonthly = (archivedData?.monthlyEnvelopes || []).filter((e: any) => e.isArchived).map((e: any) => ({ ...e, type: 'monthly' }))
          const archivedYearly = (archivedData?.yearlyEnvelopes || []).filter((e: any) => e.isArchived).map((e: any) => ({ ...e, type: 'yearly' }))

          // Combine all
          setEnvelopes([...activeMonthly, ...activeYearly, ...archivedMonthly, ...archivedYearly])
        } catch {
          setEnvelopes([...activeMonthly, ...activeYearly])
        }

      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [isAuthenticated])

  // --- Handlers passed to EnvelopeManager ---

  const handleSaveEnvelope = async (id: string, updates: Partial<Envelope>) => {
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    try {
      const response = await authorizedFetch(`/api/envelopes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: updates.name,
          icon: updates.icon,
          plannedAmount: Number(updates.plannedAmount || 0),
          group: updates.group || 'needs',
          isAccumulating: updates.isAccumulating,
          type: updates.type // Ensure type updates are sent
        })
      })
      if (!response.ok) throw new Error('Błąd zapisu')

      // Update local state for type change reflection immediately
      if (updates.type) {
        await refreshCategories() // Refresh in case categories need to re-align
      }

      showToast('Koperta zaktualizowana', 'success')
      refreshCategories()
    } catch (e) {
      showToast('Błąd zapisu koperty', 'error')
    }
  }

  const handleDeleteEnvelope = async (id: string) => {
    try {
      const response = await authorizedFetch(`/api/envelopes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setEnvelopes(prev => prev.filter(e => e.id !== id))
        showToast('Koperta usunięta', 'success')
      } else {
        showToast('Błąd usuwania', 'error')
      }
    } catch (e) {
      showToast('Błąd usuwania', 'error')
    }
  }

  const handleAddEnvelope = async (data: any) => {
    try {
      const response = await authorizedFetch('/api/envelopes', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      if (response.ok) {
        const resData = await response.json()
        const created = resData.envelope || resData.monthlyEnvelope || resData.yearlyEnvelope
        if (created) {
          setEnvelopes(prev => [...prev, { ...created, type: data.type }])
          showToast('Koperta dodana', 'success')
        }
      } else {
        showToast('Błąd dodawania', 'error')
      }
    } catch (e) {
      showToast('Błąd dodawania', 'error')
    }
  }

  // Categories Handlers (API based)
  const handleAddCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const response = await authorizedFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })
      if (response.ok) {
        await refreshCategories()
        showToast('Kategoria dodana', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Błąd dodawania kategorii', 'error')
      }
    } catch {
      showToast('Błąd dodawania kategorii', 'error')
    }
  }

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const response = await authorizedFetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (response.ok) {
        await refreshCategories()
        showToast('Kategoria zaktualizowana', 'success')
      } else {
        showToast('Błąd aktualizacji', 'error')
      }
    } catch {
      showToast('Błąd aktualizacji', 'error')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await authorizedFetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await refreshCategories()
        showToast('Kategoria usunięta', 'success')
      } else {
        showToast('Błąd usuwania', 'error')
      }
    } catch {
      showToast('Błąd usuwania', 'error')
    }
  }

  // Batch Save for General Settings
  const handleSaveGeneral = async () => {
    setSaving(true)
    try {
      const payload: any = {
        defaultSalary: Number(defaultSalary || 0),
        // We only need to send envelope limits if we want to batch update them here too, 
        // but EnvelopeManager handles individual updates. 
        // However, standard API might expect the full list to "sync" monthly/yearly budgets.
        // For safety, let's include them.
        monthlyEnvelopes: envelopes.filter(e => e.type === 'monthly').map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount || 0) })),
        yearlyEnvelopes: envelopes.filter(e => e.type === 'yearly').map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount || 0) })),
        bonusDistribution: bonusDistribution.length > 0 ? JSON.stringify(bonusDistribution) : null
      }

      const res = await authorizedFetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showToast('Konfiguracja zapisana', 'success')
      } else {
        showToast('Błąd zapisu', 'error')
      }
    } catch (error) {
      showToast('Błąd zapisu', 'error')
    } finally {
      setSaving(false)
    }
  }


  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-slate-800 rounded-xl" />
          <div className="h-4 w-32 bg-slate-800 rounded" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-[1200px] mx-auto py-8 px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-8 p-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Konfiguracja</h1>
              <p className="text-sm text-slate-400">Dostosuj swój budżet</p>
            </div>
          </div>
          {/* Show "Save General" button only on relevant tabs or always? 
                Since Envelopes are now saved individually, this button mostly saves Salary/Bonus. 
                It's less critical for Envelopes now. */}
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-70 cursor-wait' : ''}`}
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('envelopes')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'envelopes'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
              : 'glass-card text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            Koperty
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'recurring'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
              : 'glass-card text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            Płatności Cykliczne
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${activeTab === 'general'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/20'
              : 'glass-card text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            Ogólne
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'envelopes' && (
            <motion.div
              key="envelopes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <EnvelopeManager
                envelopes={envelopes}
                categories={categories}
                onSaveEnvelope={handleSaveEnvelope}
                onDeleteEnvelope={handleDeleteEnvelope}
                onAddEnvelope={handleAddEnvelope}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </motion.div>
          )}

          {activeTab === 'recurring' && (
            <div>
              <RecurringPayments
                envelopes={envelopes
                  .filter(e => !e.isArchived)
                  .map(e => ({
                    ...e,
                    icon: e.icon || '📦', // Provide fallback for null icon
                    type: e.type,
                    isAccumulating: e.isAccumulating
                  }))}
              />
            </div>
          )}

          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <GeneralSettings
                defaultSalary={defaultSalary}
                setDefaultSalary={setDefaultSalary}
                bonusDistribution={bonusDistribution}
                setBonusDistribution={setBonusDistribution}
                envelopes={envelopes}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
