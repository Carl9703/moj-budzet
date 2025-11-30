'use client'

import { useEffect, useState, useMemo } from 'react'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/feedback/Toast'
import { ConfirmationModal } from '@/components/ui/feedback/ConfirmationModal'
import { RecurringPayments } from '@/components/features/config/RecurringPayments'
import { EXPENSE_CATEGORIES, Category } from '@/lib/constants/categories'

interface Envelope {
  id: string
  name: string
  icon: string | null
  plannedAmount: number
  currentAmount: number
  group?: string
  type: 'monthly' | 'yearly'
}

type TabType = 'general' | 'envelopes' | 'categories' | 'automation'

export default function ConfigPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  
  // Modals for confirmations
  const [deleteEnvelopeModal, setDeleteEnvelopeModal] = useState<{ isOpen: boolean; envelopeId: string | null; envelopeName: string; envelopeType: 'monthly' | 'yearly' | null }>({
    isOpen: false,
    envelopeId: null,
    envelopeName: '',
    envelopeType: null
  })
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{ isOpen: boolean; categoryId: string | null; categoryName: string }>({
    isOpen: false,
    categoryId: null,
    categoryName: ''
  })
  const [addEnvelopeModal, setAddEnvelopeModal] = useState<{ isOpen: boolean; groupName: string | null }>({
    isOpen: false,
    groupName: null
  })
  const [newEnvelopeData, setNewEnvelopeData] = useState<{
    name: string
    icon: string
    type: 'monthly' | 'yearly'
    group: string
    plannedAmount: number
  }>({
    name: '',
    icon: '📦',
    type: 'monthly',
    group: 'needs',
    plannedAmount: 0
  })
  const [addEnvelopeLoading, setAddEnvelopeLoading] = useState(false)
  const [deleteEnvelopeLoading, setDeleteEnvelopeLoading] = useState(false)
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false)
  
  // State
  const [defaultSalary, setDefaultSalary] = useState<number>(0)
  const [bonusDistribution, setBonusDistribution] = useState<Array<{ envelopeId: string; envelopeName: string; percentage: number }>>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [yearlyEnvelopes, setYearlyEnvelopes] = useState<Envelope[]>([])
  const [archivedEnvelopes, setArchivedEnvelopes] = useState<Envelope[]>([])
  const [archivedYearlyEnvelopes, setArchivedYearlyEnvelopes] = useState<Envelope[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expenseCategories')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return EXPENSE_CATEGORIES
        }
      }
    }
    return EXPENSE_CATEGORIES
  })

  // Combine monthly and yearly envelopes by group for display (active)
  const allGroupedEnvelopes = useMemo(() => {
    const combined: { [key: string]: Array<Envelope & { envelopeType: 'monthly' | 'yearly' }> } = {}
    
    // Add monthly envelopes
    envelopes.forEach(e => {
      const group = e.group || 'needs'
      if (!combined[group]) combined[group] = []
      combined[group].push({ ...e, envelopeType: 'monthly' as const })
    })
    
    // Add yearly envelopes
    yearlyEnvelopes.forEach(e => {
      const group = e.group || 'needs'
      if (!combined[group]) combined[group] = []
      combined[group].push({ ...e, envelopeType: 'yearly' as const })
    })
    
    // Sort envelopes in each group: monthly first, then yearly, then by name
    Object.keys(combined).forEach(group => {
      combined[group].sort((a, b) => {
        if (a.envelopeType !== b.envelopeType) {
          return a.envelopeType === 'monthly' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    })
    
    return combined
  }, [envelopes, yearlyEnvelopes])

  // Combine archived monthly and yearly envelopes by group for display
  const allGroupedArchivedEnvelopes = useMemo(() => {
    const combined: { [key: string]: Array<Envelope & { envelopeType: 'monthly' | 'yearly' }> } = {}
    
    // Add monthly envelopes
    archivedEnvelopes.forEach(e => {
      const group = e.group || 'needs'
      if (!combined[group]) combined[group] = []
      combined[group].push({ ...e, envelopeType: 'monthly' as const })
    })
    
    // Add yearly envelopes
    archivedYearlyEnvelopes.forEach(e => {
      const group = e.group || 'needs'
      if (!combined[group]) combined[group] = []
      combined[group].push({ ...e, envelopeType: 'yearly' as const })
    })
    
    // Sort envelopes in each group: monthly first, then yearly, then by name
    Object.keys(combined).forEach(group => {
      combined[group].sort((a, b) => {
        if (a.envelopeType !== b.envelopeType) {
          return a.envelopeType === 'monthly' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    })
    
    return combined
  }, [archivedEnvelopes, archivedYearlyEnvelopes])

  // Calculate totals - wyklucz koperty z grupy "assets", bo to są transfery/oszczędności, nie wydatki
  const totalBudgeted = useMemo(() => {
    return [...envelopes, ...yearlyEnvelopes]
      .filter(e => {
        // Wyklucz koperty z grupy "assets"
        const group = e.group || 'needs'
        return group !== 'assets'
      })
      .reduce((sum, e) => sum + e.plannedAmount, 0)
  }, [envelopes, yearlyEnvelopes])

  const remainingToBudget = defaultSalary - totalBudgeted

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
          // Załaduj konfigurację premii - jeśli jest null/undefined, ustaw pustą tablicę
          if (cfg.bonusDistribution) {
            try {
              const parsed = JSON.parse(cfg.bonusDistribution)
              setBonusDistribution(Array.isArray(parsed) ? parsed : [])
            } catch {
              setBonusDistribution([])
            }
          } else {
            // Jeśli bonusDistribution jest null/undefined, ustaw pustą tablicę (nie tworzymy domyślnych wartości)
            setBonusDistribution([])
          }
        }
        // Filtruj tylko aktywne koperty (isArchived === false lub undefined)
        setEnvelopes((data?.monthlyEnvelopes || []).filter((e: any) => !e.isArchived).map((e: any) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          plannedAmount: e.plannedAmount,
          currentAmount: e.currentAmount,
          group: e.group,
          type: 'monthly' as const
        })))
        setYearlyEnvelopes((data?.yearlyEnvelopes || []).filter((e: any) => !e.isArchived).map((e: any) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          plannedAmount: e.plannedAmount,
          currentAmount: e.currentAmount,
          group: e.group,
          type: 'yearly' as const
        })))
        
        // Pobierz zarchiwizowane koperty
        try {
          const archivedRes = await authorizedFetch('/api/config?archived=true', { cache: 'no-store' })
          const archivedData = await archivedRes.json()
          if (!mounted) return
          
          // Filtruj tylko zarchiwizowane koperty (isArchived === true)
          setArchivedEnvelopes((archivedData?.monthlyEnvelopes || []).filter((e: any) => e.isArchived === true).map((e: any) => ({
            id: e.id,
            name: e.name,
            icon: e.icon,
            plannedAmount: e.plannedAmount,
            currentAmount: e.currentAmount,
            group: e.group,
            type: 'monthly' as const
          })))
          setArchivedYearlyEnvelopes((archivedData?.yearlyEnvelopes || []).filter((e: any) => e.isArchived === true).map((e: any) => ({
            id: e.id,
            name: e.name,
            icon: e.icon,
            plannedAmount: e.plannedAmount,
            currentAmount: e.currentAmount,
            group: e.group,
            type: 'yearly' as const
          })))
        } catch {
          // ignore errors for archived envelopes
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
  
  if (isCheckingAuth || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#020617' }}>
        <div style={{ fontSize: '24px', color: '#94a3b8' }}>⚙️ Ładowanie konfiguracji...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleEnvelopeChange = (envelopeId: string, plannedAmount: number) => {
    const isYearly = yearlyEnvelopes.some(e => e.id === envelopeId)
    
    if (isYearly) {
      setYearlyEnvelopes(prev => prev.map(e => 
        e.id === envelopeId ? { ...e, plannedAmount } : e
      ))
    } else {
      setEnvelopes(prev => prev.map(e => 
        e.id === envelopeId ? { ...e, plannedAmount } : e
      ))
    }
  }

  const handleDeleteEnvelope = async () => {
    if (!deleteEnvelopeModal.envelopeId || !deleteEnvelopeModal.envelopeType) return
    
    setDeleteEnvelopeLoading(true)
    try {
      const response = await authorizedFetch(`/api/envelopes/${deleteEnvelopeModal.envelopeId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        if (deleteEnvelopeModal.envelopeType === 'yearly') {
          setYearlyEnvelopes(prev => prev.filter(e => e.id !== deleteEnvelopeModal.envelopeId))
        } else {
          setEnvelopes(prev => prev.filter(e => e.id !== deleteEnvelopeModal.envelopeId))
        }
        const message = result.message || 'Koperta została usunięta'
        showToast(message, 'success')
        setDeleteEnvelopeModal({ isOpen: false, envelopeId: null, envelopeName: '', envelopeType: null })
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Błąd usuwania koperty'
        showToast(errorMessage, 'error')
      }
    } catch (error) {
      showToast('Błąd usuwania koperty', 'error')
    } finally {
      setDeleteEnvelopeLoading(false)
    }
  }

  const handleDeleteCategory = () => {
    if (!deleteCategoryModal.categoryId) return
    
    setDeleteCategoryLoading(true)
    try {
      setCategories(prev => prev.filter(c => c.id !== deleteCategoryModal.categoryId))
      showToast('Kategoria została usunięta', 'success')
      setDeleteCategoryModal({ isOpen: false, categoryId: null, categoryName: '' })
    } catch (error) {
      showToast('Błąd usuwania kategorii', 'error')
    } finally {
      setDeleteCategoryLoading(false)
    }
  }

  const handleAddEnvelope = async () => {
    if (!newEnvelopeData.name.trim()) {
      showToast('Nazwa koperty jest wymagana', 'error')
      return
    }

    setAddEnvelopeLoading(true)
    try {
      const response = await authorizedFetch('/api/envelopes', {
        method: 'POST',
        body: JSON.stringify({
          name: newEnvelopeData.name.trim(),
          icon: newEnvelopeData.icon || '📦',
          plannedAmount: Number(newEnvelopeData.plannedAmount) || 0,
          type: newEnvelopeData.type,
          group: newEnvelopeData.group
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Sprawdź, czy koperta jest zarchiwizowana
        if (data.envelope?.isArchived === true) {
          throw new Error('Koperta została utworzona jako zarchiwizowana')
        }
        
        // Odśwież dane z API
        try {
          const configRes = await authorizedFetch('/api/config', { cache: 'no-store' })
          const configData = await configRes.json()
          
          // Filtruj tylko aktywne koperty
          const activeMonthly = (configData?.monthlyEnvelopes || []).filter((e: any) => !e.isArchived)
          const activeYearly = (configData?.yearlyEnvelopes || []).filter((e: any) => !e.isArchived)
          
          setEnvelopes(activeMonthly.map((e: any) => ({
            id: e.id,
            name: e.name,
            icon: e.icon,
            plannedAmount: e.plannedAmount,
            currentAmount: e.currentAmount,
            group: e.group,
            type: 'monthly' as const
          })))
          
          setYearlyEnvelopes(activeYearly.map((e: any) => ({
            id: e.id,
            name: e.name,
            icon: e.icon,
            plannedAmount: e.plannedAmount,
            currentAmount: e.currentAmount,
            group: e.group,
            type: 'yearly' as const
          })))
        } catch (refreshError) {
          // Ignore refresh errors
        }
        
        // Resetuj formularz i zamknij modal
        setNewEnvelopeData({
          name: '',
          icon: '📦',
          type: 'monthly',
          group: addEnvelopeModal.groupName || 'needs',
          plannedAmount: 0
        })
        setAddEnvelopeModal({ isOpen: false, groupName: null })
        showToast('Koperta została dodana', 'success')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Błąd dodawania koperty')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Błąd dodawania koperty', 'error')
    } finally {
      setAddEnvelopeLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Zapisz koperty (nazwy, ikony, limity, grupy)
      for (const env of [...envelopes, ...yearlyEnvelopes]) {
        try {
          const response = await authorizedFetch(`/api/envelopes/${env.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: env.name,
              icon: env.icon,
              plannedAmount: Number(env.plannedAmount || 0),
              group: env.group || 'needs'
            })
          })
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Błąd zapisu koperty ${env.name}`)
          }
        } catch (error) {
          throw error
        }
      }

      // Zapisz konfigurację główną
      const payload: any = {
        defaultSalary: Number(defaultSalary || 0),
        monthlyEnvelopes: envelopes.map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount || 0) })),
        yearlyEnvelopes: yearlyEnvelopes.map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount || 0) })),
      }
      
      // Dodaj bonusDistribution tylko jeśli jest zdefiniowane
      if (bonusDistribution && bonusDistribution.length > 0) {
        payload.bonusDistribution = JSON.stringify(bonusDistribution)
      } else {
        payload.bonusDistribution = null
      }
      const res = await authorizedFetch('/api/config', { 
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload) 
      })
      
      if (res.ok) {
        const result = await res.json().catch(() => ({}))
        // Zapisz kategorie do localStorage (tymczasowo, do czasu implementacji w bazie)
        if (typeof window !== 'undefined') {
          localStorage.setItem('expenseCategories', JSON.stringify(categories))
          // Wywołaj custom event, aby inne komponenty mogły się odświeżyć
          window.dispatchEvent(new Event('categoriesUpdated'))
        }
        showToast('Zapisano konfigurację pomyślnie!', 'success')
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Nieznany błąd' }))
        showToast(errorData.error || 'Błąd zapisu konfiguracji', 'error')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Błąd zapisu konfiguracji', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getGroupName = (group: string) => {
    const names: { [key: string]: string } = {
      'needs': 'Potrzeby',
      'lifestyle': 'Styl życia',
      'assets': 'Cele i majątek'
    }
    return names[group] || group
  }

  const getGroupIcon = (group: string) => {
    const icons: { [key: string]: string } = {
      'needs': '🏡',
      'lifestyle': '🎉',
      'assets': '💰'
    }
    return icons[group] || '📦'
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#020617', // slate-950
      paddingBottom: '120px' // Space for footer
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        
        {/* Header - Quantum Budget Style */}
        <div style={{
          backgroundColor: '#1e293b', // slate-800
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #334155', // slate-700
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          position: 'sticky',
          top: '0',
          zIndex: 10
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px 0' }}>
              Konfiguracja Budżetu
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Dostosuj parametry systemu
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4f46e5', // indigo-600
              color: '#f1f5f9', // white
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)',
              opacity: saving ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#6366f1' // indigo-500
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
          >
            {saving ? '💾 Zapisywanie...' : '💾 Zapisz Zmiany'}
          </button>
        </div>
        
        {/* Tabs - Quantum Budget Style */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #334155', // slate-700
          marginBottom: '24px',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'general' ? '#f1f5f9' : '#94a3b8', // white : slate-400
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid #4f46e5' : '2px solid transparent', // indigo-600
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            1. Główne
          </button>
          <button 
            onClick={() => setActiveTab('envelopes')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'envelopes' ? '#f1f5f9' : '#94a3b8',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'envelopes' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            2. Koperty i Kategorie
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'automation' ? '#f1f5f9' : '#94a3b8',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'automation' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            3. Automatyzacja
          </button>
        </div>

        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Default Salary */}
            <div style={{
              backgroundColor: '#0f172a', // slate-900
              border: '1px solid #1e293b', // slate-800
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '500px'
            }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                color: '#94a3b8', // slate-400
                marginBottom: '8px' 
              }}>
                Domyślny Przychód Miesięczny (PLN)
              </label>
              <input 
                type="number" 
                value={defaultSalary}
                onChange={e => setDefaultSalary(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b', // slate-800
                  border: '1px solid #334155', // slate-700
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#34d399', // emerald-400
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#34d399' // emerald-400
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#334155' // slate-700
                }}
              />
              <p style={{
                fontSize: '12px',
                color: '#64748b', // slate-500
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>
                Ta kwota będzie używana jako domyślna podstawa przy planowaniu nowego miesiąca.
              </p>
            </div>

            {/* Bonus Distribution */}
            <div style={{
              backgroundColor: '#0f172a', // slate-900
              border: '1px solid #1e293b', // slate-800
              padding: '24px',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#f1f5f9', // white
                marginBottom: '16px'
              }}>
                🎁 Podział Premii
              </h3>
              <p style={{
                fontSize: '12px',
                color: '#64748b', // slate-500
                marginBottom: '16px'
              }}>
                Skonfiguruj domyślny podział procentowy premii między koperty. Suma musi wynosić 100%.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {bonusDistribution.map((dist, index) => {
                  const allEnvelopes = [...envelopes, ...yearlyEnvelopes]
                  const envelope = allEnvelopes.find(e => e.id === dist.envelopeId)
                  
                  return (
                    <div key={dist.envelopeId || index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor: '#1e293b', // slate-800
                      borderRadius: '8px',
                      border: '1px solid #334155' // slate-700
                    }}>
                      <select
                        value={dist.envelopeId}
                        onChange={(e) => {
                          const selectedEnv = allEnvelopes.find(env => env.id === e.target.value)
                          setBonusDistribution(prev => prev.map((d, i) => 
                            i === index ? { ...d, envelopeId: e.target.value, envelopeName: selectedEnv?.name || '' } : d
                          ))
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#0f172a', // slate-900
                          border: '1px solid #334155', // slate-700
                          borderRadius: '6px',
                          padding: '8px',
                          color: '#f1f5f9', // white
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      >
                        <option value="">Wybierz kopertę</option>
                        {allEnvelopes.map(env => (
                          <option key={env.id} value={env.id}>{env.icon || '📦'} {env.name}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '120px' }}>
                        <input
                          type="number"
                          value={dist.percentage}
                          onChange={(e) => {
                            setBonusDistribution(prev => prev.map((d, i) => 
                              i === index ? { ...d, percentage: Number(e.target.value) || 0 } : d
                            ))
                          }}
                          style={{
                            width: '80px',
                            backgroundColor: '#0f172a', // slate-900
                            border: '1px solid #334155', // slate-700
                            borderRadius: '6px',
                            padding: '8px',
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#f1f5f9', // white
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#94a3b8' }}>%</span>
                      </div>
                      <button
                        onClick={() => {
                          setBonusDistribution(prev => prev.filter((_, i) => i !== index))
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc2626', // red-600
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )
                })}
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: (() => {
                  const total = bonusDistribution.reduce((sum, d) => sum + d.percentage, 0)
                  return total === 100 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' // emerald/red
                })(),
                borderRadius: '8px',
                border: '1px solid',
                borderColor: (() => {
                  const total = bonusDistribution.reduce((sum, d) => sum + d.percentage, 0)
                  return total === 100 ? '#22c55e' : '#ef4444' // emerald/red
                })(),
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: (() => {
                    const total = bonusDistribution.reduce((sum, d) => sum + d.percentage, 0)
                    return total === 100 ? '#22c55e' : '#ef4444' // emerald/red
                  })()
                }}>
                  Suma: {bonusDistribution.reduce((sum, d) => sum + d.percentage, 0)}%
                  {bonusDistribution.reduce((sum, d) => sum + d.percentage, 0) !== 100 && ' (musi być 100%)'}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setBonusDistribution(prev => [...prev, { envelopeId: '', envelopeName: '', percentage: 0 }])
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4f46e5', // indigo-600
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + Dodaj kopertę
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ENVELOPES AND CATEGORIES */}
        {activeTab === 'envelopes' && (() => {
          // Define group order
          const groupOrder = ['needs', 'lifestyle', 'assets']
          
          // Wybierz aktywne lub zarchiwizowane koperty
          const displayGroupedEnvelopes = showArchived ? allGroupedArchivedEnvelopes : allGroupedEnvelopes
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Toggle between active and archived envelopes */}
              <div style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px 0' }}>
                    {showArchived ? '📦 Zarchiwizowane koperty' : '✅ Aktywne koperty'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                    {showArchived 
                      ? `${archivedEnvelopes.length + archivedYearlyEnvelopes.length} zarchiwizowanych kopert`
                      : `${envelopes.length + yearlyEnvelopes.length} aktywnych kopert`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: showArchived ? '#4f46e5' : '#1e293b',
                    color: '#f1f5f9',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = showArchived ? '#6366f1' : '#334155'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = showArchived ? '#4f46e5' : '#1e293b'
                  }}
                >
                  {showArchived ? '← Pokaż aktywne' : 'Pokaż zarchiwizowane →'}
                </button>
              </div>
              
              {/* ENVELOPES GROUPED BY GROUP */}
              {groupOrder
                .filter(groupName => displayGroupedEnvelopes[groupName] && displayGroupedEnvelopes[groupName].length > 0)
                .concat(Object.keys(displayGroupedEnvelopes).filter(g => !groupOrder.includes(g)))
                .map((groupName) => {
                  const groupEnvelopes = displayGroupedEnvelopes[groupName]
                  
                  return (
                    <div key={groupName} style={{
                      backgroundColor: '#0f172a', // slate-900
                      border: '1px solid #334155', // slate-700
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      {/* GROUP HEADER */}
                      <div style={{
                        backgroundColor: '#1e293b', // slate-800
                        padding: '16px 20px',
                        borderBottom: '1px solid #334155', // slate-700
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '20px' }}>{getGroupIcon(groupName)}</span>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#f1f5f9',
                          margin: 0,
                          flex: 1
                        }}>
                          {getGroupName(groupName)}
                        </h3>
                        <span style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          padding: '4px 8px',
                          backgroundColor: '#0f172a',
                          borderRadius: '4px'
                        }}>
                          {groupEnvelopes.length} {groupEnvelopes.length === 1 ? 'koperta' : 'kopert'}
                        </span>
                        {!showArchived && (
                          <button
                            onClick={() => {
                              setNewEnvelopeData({
                                name: '',
                                icon: '📦',
                                type: 'monthly',
                                group: groupName,
                                plannedAmount: 0
                              })
                              setAddEnvelopeModal({ isOpen: true, groupName })
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#4f46e5', // indigo-600
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#6366f1' // indigo-500
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                            }}
                          >
                            + Dodaj kopertę do {getGroupName(groupName)}
                          </button>
                        )}
                      </div>
                      
                      {/* ENVELOPES IN THIS GROUP */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {groupEnvelopes.map((env) => {
                          const envelopeCategories = categories.filter(c => c.defaultEnvelope === env.name)
              
              return (
                <div key={env.id} style={{
                  backgroundColor: '#0f172a', // slate-900
                  border: '1px solid #334155', // slate-700
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  {/* ENVELOPE HEADER */}
                  <div style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
                    padding: '16px',
                    borderBottom: '1px solid #334155', // slate-700
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <input
                      type="text"
                      value={env.icon || '📦'}
                      onChange={(e) => {
                        if (env.envelopeType === 'yearly') {
                          setYearlyEnvelopes(prev => prev.map(envelope => 
                            envelope.id === env.id ? { ...envelope, icon: e.target.value } : envelope
                          ))
                        } else {
                          setEnvelopes(prev => prev.map(envelope => 
                            envelope.id === env.id ? { ...envelope, icon: e.target.value } : envelope
                          ))
                        }
                      }}
                      style={{
                        width: '40px',
                        backgroundColor: '#1e293b', // slate-800
                        border: '1px solid #334155', // slate-700
                        borderRadius: '6px',
                        padding: '6px',
                        textAlign: 'center',
                        fontSize: '18px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#4f46e5' // indigo-600
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#334155' // slate-700
                      }}
                    />
                    <input 
                      value={env.name}
                      onChange={(e) => {
                        const newName = e.target.value
                        const oldName = env.name
                        
                        // Aktualizuj nazwę koperty
                        if (env.envelopeType === 'yearly') {
                          if (showArchived) {
                            setArchivedYearlyEnvelopes(prev => prev.map(envelope => 
                              envelope.id === env.id ? { ...envelope, name: newName } : envelope
                            ))
                          } else {
                            setYearlyEnvelopes(prev => prev.map(envelope => 
                              envelope.id === env.id ? { ...envelope, name: newName } : envelope
                            ))
                          }
                        } else {
                          if (showArchived) {
                            setArchivedEnvelopes(prev => prev.map(envelope => 
                              envelope.id === env.id ? { ...envelope, name: newName } : envelope
                            ))
                          } else {
                            setEnvelopes(prev => prev.map(envelope => 
                              envelope.id === env.id ? { ...envelope, name: newName } : envelope
                            ))
                          }
                        }
                        
                        // Aktualizuj defaultEnvelope we wszystkich kategoriach przypisanych do tej koperty
                        setCategories(prev => prev.map(category => 
                          category.defaultEnvelope === oldName ? { ...category, defaultEnvelope: newName } : category
                        ))
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid transparent',
                        outline: 'none',
                        color: '#f1f5f9', // slate-100
                        fontSize: '16px',
                        fontWeight: '600',
                        padding: '4px 0'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderBottomColor = '#4f46e5' // indigo-600
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderBottomColor = 'transparent'
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Limit:</span>
                        <input 
                          type="number"
                          value={env.plannedAmount}
                          onChange={(e) => handleEnvelopeChange(env.id, Number(e.target.value))}
                          style={{
                            width: '100px',
                            backgroundColor: '#1e293b', // slate-800
                            border: '1px solid #334155', // slate-700
                            borderRadius: '6px',
                            padding: '6px',
                            textAlign: 'right',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#f1f5f9', // white
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#4f46e5' // indigo-600
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#334155' // slate-700
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>PLN</span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        color: '#64748b', // slate-500
                        padding: '4px 8px',
                        backgroundColor: '#1e293b', // slate-800
                        borderRadius: '4px'
                      }}>
                        {env.envelopeType === 'yearly' ? 'Roczne' : 'Miesięczna'}
                      </span>
                      <select
                        value={env.group || 'needs'}
                        onChange={(e) => {
                          if (showArchived) {
                            // Dla zarchiwizowanych kopert nie można zmieniać grupy
                            return
                          }
                          const newGroup = e.target.value
                          if (env.envelopeType === 'yearly') {
                            setYearlyEnvelopes(prev => prev.map(envelope => 
                              envelope.id === env.id ? { ...envelope, group: newGroup } : envelope
                            ))
                          } else {
                            setEnvelopes(prev => prev.map(envelope => 
                              envelope.id === env.id ? { ...envelope, group: newGroup } : envelope
                            ))
                          }
                        }}
                        disabled={showArchived}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#1e293b', // slate-800
                          border: '1px solid #334155', // slate-700
                          borderRadius: '4px',
                          color: '#f1f5f9', // white
                          fontSize: '11px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#4f46e5' // indigo-600
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#334155' // slate-700
                        }}
                      >
                        <option value="needs">Potrzeby</option>
                        <option value="lifestyle">Styl życia</option>
                        <option value="assets">Cele i majątek</option>
                      </select>
                      {showArchived ? (
                        <button
                          onClick={async () => {
                            try {
                              const response = await authorizedFetch(`/api/envelopes/${env.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({
                                  isArchived: false
                                })
                              })
                              if (response.ok) {
                                if (env.envelopeType === 'yearly') {
                                  setArchivedYearlyEnvelopes(prev => prev.filter(e => e.id !== env.id))
                                  // Dodaj z powrotem do aktywnych
                                  const restored = archivedYearlyEnvelopes.find(e => e.id === env.id)
                                  if (restored) {
                                    setYearlyEnvelopes(prev => [...prev, restored])
                                  }
                                } else {
                                  setArchivedEnvelopes(prev => prev.filter(e => e.id !== env.id))
                                  // Dodaj z powrotem do aktywnych
                                  const restored = archivedEnvelopes.find(e => e.id === env.id)
                                  if (restored) {
                                    setEnvelopes(prev => [...prev, restored])
                                  }
                                }
                                showToast('Koperta została przywrócona', 'success')
                              } else {
                                throw new Error('Błąd przywracania koperty')
                              }
                            } catch (error) {
                              showToast('Błąd przywracania koperty', 'error')
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#22c55e', // green-500
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#16a34a' // green-600
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#22c55e' // green-500
                          }}
                          title="Przywróć kopertę"
                        >
                          ♻️
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDeleteEnvelopeModal({
                              isOpen: true,
                              envelopeId: env.id,
                              envelopeName: env.name,
                              envelopeType: env.envelopeType
                            })
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc2626', // red-600
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#b91c1c' // red-700
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626' // red-600
                          }}
                          title="Usuń kopertę"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* CATEGORIES FOR THIS ENVELOPE - tylko dla aktywnych kopert */}
                  {!showArchived && (
                    <div style={{ padding: '16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#94a3b8', // slate-400
                          margin: 0
                        }}>
                          Kategorie ({envelopeCategories.length})
                        </h3>
                        <button
                          onClick={() => {
                            const newCategory: Category = {
                              id: `category-${Date.now()}`,
                              name: 'Nowa kategoria',
                              icon: '📦',
                              defaultEnvelope: env.name,
                              type: env.envelopeType
                            }
                            setCategories(prev => [...prev, newCategory])
                            showToast('Nowa kategoria została dodana', 'success')
                          }}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#4f46e5', // indigo-600
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#6366f1' // indigo-500
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                        }}
                      >
                        + Dodaj kategorię
                      </button>
                    </div>
                    
                    {envelopeCategories.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {envelopeCategories.map((category) => (
                          <div 
                            key={category.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '40px 1fr 100px 40px',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px',
                              backgroundColor: '#1e293b', // slate-800
                              border: '1px solid #334155', // slate-700
                              borderRadius: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)' // slate-800/50
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#1e293b' // slate-800
                            }}
                          >
                            <input
                              type="text"
                              value={category.icon}
                              onChange={(e) => {
                                setCategories(prev => prev.map(c => 
                                  c.id === category.id ? { ...c, icon: e.target.value } : c
                                ))
                              }}
                              style={{
                                width: '40px',
                                backgroundColor: '#0f172a', // slate-900
                                border: '1px solid #334155', // slate-700
                                borderRadius: '6px',
                                padding: '6px',
                                textAlign: 'center',
                                fontSize: '16px',
                                outline: 'none'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#4f46e5' // indigo-600
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#334155' // slate-700
                              }}
                            />
                            <input
                              value={category.name}
                              onChange={(e) => {
                                setCategories(prev => prev.map(c => 
                                  c.id === category.id ? { ...c, name: e.target.value } : c
                                ))
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid transparent',
                                outline: 'none',
                                color: '#f1f5f9', // slate-100
                                fontSize: '14px',
                                fontWeight: '500',
                                padding: '4px 0'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderBottomColor = '#4f46e5' // indigo-600
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderBottomColor = 'transparent'
                              }}
                            />
                            <select
                              value={category.type}
                              onChange={(e) => {
                                setCategories(prev => prev.map(c => 
                                  c.id === category.id ? { ...c, type: e.target.value as 'monthly' | 'yearly' } : c
                                ))
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#0f172a', // slate-900
                                border: '1px solid #334155', // slate-700
                                borderRadius: '6px',
                                color: '#f1f5f9', // slate-100
                                fontSize: '12px',
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#4f46e5' // indigo-600
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#334155' // slate-700
                              }}
                            >
                              <option value="monthly">Miesięczna</option>
                              <option value="yearly">Roczna</option>
                            </select>
                            <button
                              onClick={() => {
                                setDeleteCategoryModal({
                                  isOpen: true,
                                  categoryId: category.id,
                                  categoryName: category.name
                                })
                              }}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc2626', // red-600
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#b91c1c' // red-700
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc2626' // red-600
                              }}
                              title="Usuń kategorię"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#64748b', 
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        Brak kategorii dla tej koperty
                      </p>
                    )}
                    </div>
                  )}
                </div>
                        )
                      })}
                      
                      {/* Add new envelope button for this group */}
                      {!showArchived && (
                        <button
                          onClick={() => {
                            setNewEnvelopeData({
                              name: '',
                              icon: '📦',
                              type: 'monthly',
                              group: groupName,
                              plannedAmount: 0
                            })
                            setAddEnvelopeModal({ isOpen: true, groupName })
                          }}
                          style={{
                            padding: '10px 16px',
                            backgroundColor: '#4f46e5', // indigo-600
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginTop: '8px',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#6366f1' // indigo-500
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#4f46e5' // indigo-600
                          }}
                        >
                          + Dodaj kopertę do {getGroupName(groupName)}
                        </button>
                      )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )
        })()}

        {/* TAB 3: AUTOMATION */}
        {activeTab === 'automation' && (
          <RecurringPayments 
            envelopes={[
              ...envelopes.map(e => ({ id: e.id, name: e.name, icon: e.icon || '📦', type: 'monthly' })),
              ...yearlyEnvelopes.map(e => ({ id: e.id, name: e.name, icon: e.icon || '📦', type: 'yearly' }))
            ]}
          />
        )}
      </div>

      {/* Footer - Live Budget Balance - Quantum Budget Style */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '256px', // Account for sidebar
        right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900/95
        borderTop: '1px solid rgba(79, 70, 229, 0.3)', // indigo-500/50
        padding: '16px',
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{
                fontSize: '10px',
                color: '#64748b', // slate-500
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                Planowany Przychód
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#34d399' // emerald-400
              }}>
                {defaultSalary.toFixed(2)} PLN
              </div>
            </div>
            <div style={{ color: '#475569', fontSize: '20px' }}>-</div>
            <div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                Suma Kopert
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#f1f5f9' // white
              }}>
                {totalBudgeted.toFixed(2)} PLN
              </div>
            </div>
            <div style={{ color: '#475569', fontSize: '20px' }}>=</div>
            <div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                Bilans (Zero-Based)
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: remainingToBudget === 0 ? '#34d399' : (remainingToBudget > 0 ? '#818cf8' : '#fb7185') // green : indigo-400 : rose-400
              }}>
                {remainingToBudget.toFixed(2)} PLN
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'right'
          }}>
            Zmiany kwot aktualizują się na żywo.
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={deleteEnvelopeModal.isOpen}
        onClose={() => setDeleteEnvelopeModal({ isOpen: false, envelopeId: null, envelopeName: '', envelopeType: null })}
        onConfirm={handleDeleteEnvelope}
        title="Usuń kopertę"
        message={`Czy na pewno chcesz usunąć kopertę "${deleteEnvelopeModal.envelopeName}"?${deleteEnvelopeModal.envelopeId ? ' Jeśli koperta ma transakcje, zostanie zarchiwizowana zamiast usunięta.' : ''}`}
        confirmText="Usuń"
        cancelText="Anuluj"
        type="danger"
        loading={deleteEnvelopeLoading}
      />

      <ConfirmationModal
        isOpen={deleteCategoryModal.isOpen}
        onClose={() => setDeleteCategoryModal({ isOpen: false, categoryId: null, categoryName: '' })}
        onConfirm={handleDeleteCategory}
        title="Usuń kategorię"
        message={`Czy na pewno chcesz usunąć kategorię "${deleteCategoryModal.categoryName}"? Ta operacja jest nieodwracalna.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        type="danger"
        loading={deleteCategoryLoading}
      />

      {/* Add Envelope Modal */}
      {addEnvelopeModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '500px',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #334155'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#f1f5f9',
                margin: 0
              }}>
                Dodaj nową kopertę
              </h2>
              <button
                onClick={() => {
                  setAddEnvelopeModal({ isOpen: false, groupName: null })
                  setNewEnvelopeData({
                    name: '',
                    icon: '📦',
                    type: 'monthly',
                    group: 'needs',
                    plannedAmount: 0
                  })
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  transition: 'all 0.2s ease',
                  fontSize: '20px',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e293b'
                  e.currentTarget.style.color = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Nazwa */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#f1f5f9',
                  marginBottom: '8px'
                }}>
                  Nazwa koperty *
                </label>
                <input
                  type="text"
                  value={newEnvelopeData.name}
                  onChange={(e) => setNewEnvelopeData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Np. Zakupy spożywcze"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                  autoFocus
                />
              </div>

              {/* Ikona i Typ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    marginBottom: '8px'
                  }}>
                    Ikona
                  </label>
                  <input
                    type="text"
                    value={newEnvelopeData.icon}
                    onChange={(e) => setNewEnvelopeData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📦"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '16px',
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    marginBottom: '8px'
                  }}>
                    Typ
                  </label>
                  <select
                    value={newEnvelopeData.type}
                    onChange={(e) => setNewEnvelopeData(prev => ({ ...prev, type: e.target.value as 'monthly' | 'yearly' }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                  >
                    <option value="monthly">Miesięczna</option>
                    <option value="yearly">Roczna</option>
                  </select>
                </div>
              </div>

              {/* Grupa i Planowana kwota */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    marginBottom: '8px'
                  }}>
                    Grupa
                  </label>
                  <select
                    value={newEnvelopeData.group}
                    onChange={(e) => setNewEnvelopeData(prev => ({ ...prev, group: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                  >
                    <option value="needs">Potrzeby</option>
                    <option value="lifestyle">Styl życia</option>
                    <option value="assets">Cele i majątek</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    marginBottom: '8px'
                  }}>
                    Planowana kwota
                  </label>
                  <input
                    type="number"
                    value={newEnvelopeData.plannedAmount || ''}
                    onChange={(e) => setNewEnvelopeData(prev => ({ ...prev, plannedAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '16px 24px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #334155'
            }}>
              <button
                onClick={() => {
                  setAddEnvelopeModal({ isOpen: false, groupName: null })
                  setNewEnvelopeData({
                    name: '',
                    icon: '📦',
                    type: 'monthly',
                    group: 'needs',
                    plannedAmount: 0
                  })
                }}
                disabled={addEnvelopeLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  cursor: addEnvelopeLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: addEnvelopeLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!addEnvelopeLoading) {
                    e.currentTarget.style.backgroundColor = '#334155'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addEnvelopeLoading) {
                    e.currentTarget.style.backgroundColor = '#1e293b'
                  }
                }}
              >
                Anuluj
              </button>
              <button
                onClick={handleAddEnvelope}
                disabled={addEnvelopeLoading || !newEnvelopeData.name.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: addEnvelopeLoading || !newEnvelopeData.name.trim() ? '#475569' : '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: addEnvelopeLoading || !newEnvelopeData.name.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: addEnvelopeLoading || !newEnvelopeData.name.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!addEnvelopeLoading && newEnvelopeData.name.trim()) {
                    e.currentTarget.style.backgroundColor = '#6366f1'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addEnvelopeLoading && newEnvelopeData.name.trim()) {
                    e.currentTarget.style.backgroundColor = '#4f46e5'
                  }
                }}
              >
                {addEnvelopeLoading && (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                Dodaj kopertę
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes modalSlideIn {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
