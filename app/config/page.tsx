'use client'

import { useEffect, useState, useMemo } from 'react'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/feedback/Toast'
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
  
  // State
  const [defaultSalary, setDefaultSalary] = useState<number>(0)
  const [bonusDistribution, setBonusDistribution] = useState<Array<{ envelopeId: string; envelopeName: string; percentage: number }>>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [yearlyEnvelopes, setYearlyEnvelopes] = useState<Envelope[]>([])
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

  // Group envelopes by group - combine financial and target into "assets"
  const groupedEnvelopes = useMemo(() => {
    const groups: { [key: string]: Envelope[] } = {}
    envelopes.forEach(e => {
      // Combine 'financial' and 'target' into 'assets'
      let group = e.group || 'other'
      if (group === 'financial' || group === 'target') {
        group = 'assets'
      }
      if (!groups[group]) groups[group] = []
      groups[group].push(e)
    })
    return groups
  }, [envelopes])

  const groupedYearlyEnvelopes = useMemo(() => {
    const groups: { [key: string]: Envelope[] } = {}
    yearlyEnvelopes.forEach(e => {
      // Combine 'financial' and 'target' into 'assets'
      let group = e.group || 'other'
      if (group === 'financial' || group === 'target') {
        group = 'assets'
      }
      if (!groups[group]) groups[group] = []
      groups[group].push(e)
    })
    return groups
  }, [yearlyEnvelopes])

  // Calculate totals - wyklucz koperty z grupy "assets" (financial + target), bo to są transfery/oszczędności, nie wydatki
  const totalBudgeted = useMemo(() => {
    return [...envelopes, ...yearlyEnvelopes]
      .filter(e => {
        // Wyklucz koperty z grupy "assets" (financial + target)
        const group = e.group || 'other'
        return group !== 'financial' && group !== 'target'
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
          // Załaduj konfigurację premii
          if (cfg.bonusDistribution) {
            setBonusDistribution(JSON.parse(cfg.bonusDistribution))
          } else {
            // Domyślna konfiguracja - znajdź koperty roczne
            const allEnvelopes = [...(data?.monthlyEnvelopes || []), ...(data?.yearlyEnvelopes || [])]
            const defaultEnvelopes = [
              allEnvelopes.find(e => e.name === 'Prezenty i Okazje'),
              allEnvelopes.find(e => e.name === 'Auto: Serwis i Ubezpieczenie'),
              allEnvelopes.find(e => e.name?.toLowerCase().includes('wolne środki'))
            ].filter(Boolean)
            
            if (defaultEnvelopes.length > 0) {
              const percentages = [40, 40, 20]
              setBonusDistribution(defaultEnvelopes.map((e, i) => ({
                envelopeId: e.id,
                envelopeName: e.name,
                percentage: percentages[i] || 0
              })))
            }
          }
        }
        setEnvelopes((data?.monthlyEnvelopes || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          plannedAmount: e.plannedAmount,
          currentAmount: e.currentAmount,
          group: e.group,
          type: 'monthly' as const
        })))
        setYearlyEnvelopes((data?.yearlyEnvelopes || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          plannedAmount: e.plannedAmount,
          currentAmount: e.currentAmount,
          group: e.group,
          type: 'yearly' as const
        })))
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

  const handleSave = async () => {
    setSaving(true)
    try {
      // Zapisz koperty (nazwy, ikony, limity)
      for (const env of [...envelopes, ...yearlyEnvelopes]) {
        try {
          const response = await authorizedFetch(`/api/envelopes/${env.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: env.name,
              icon: env.icon,
              plannedAmount: Number(env.plannedAmount || 0)
            })
          })
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Błąd zapisu koperty ${env.name}`)
          }
        } catch (error) {
          console.error(`Error saving envelope ${env.name}:`, error)
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
        console.error('Error saving config:', errorData)
        showToast(errorData.error || 'Błąd zapisu konfiguracji', 'error')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      showToast(error instanceof Error ? error.message : 'Błąd zapisu konfiguracji', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getGroupName = (group: string) => {
    const names: { [key: string]: string } = {
      'needs': 'Potrzeby',
      'lifestyle': 'Styl życia',
      'assets': 'Cele i majątek',
      'financial': 'Cele finansowe',
      'target': 'Fundusze celowe'
    }
    return names[group] || group
  }

  const getGroupIcon = (group: string) => {
    const icons: { [key: string]: string } = {
      'needs': '🏡',
      'lifestyle': '🎉',
      'assets': '💰',
      'financial': '🎯',
      'target': '🎯'
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
        {activeTab === 'envelopes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ENVELOPES WITH CATEGORIES */}
            {[...envelopes.map(e => ({ ...e, envelopeType: 'monthly' as const })), ...yearlyEnvelopes.map(e => ({ ...e, envelopeType: 'yearly' as const }))].map((env) => {
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
                          setYearlyEnvelopes(prev => prev.map(envelope => 
                            envelope.id === env.id ? { ...envelope, name: newName } : envelope
                          ))
                        } else {
                          setEnvelopes(prev => prev.map(envelope => 
                            envelope.id === env.id ? { ...envelope, name: newName } : envelope
                          ))
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
                      <button
                        onClick={async () => {
                          if (confirm(`Czy na pewno chcesz usunąć kopertę "${env.name}"?`)) {
                            try {
                              const response = await authorizedFetch(`/api/envelopes/${env.id}`, {
                                method: 'DELETE'
                              })
                              if (response.ok) {
                                if (env.envelopeType === 'yearly') {
                                  setYearlyEnvelopes(prev => prev.filter(e => e.id !== env.id))
                                } else {
                                  setEnvelopes(prev => prev.filter(e => e.id !== env.id))
                                }
                                showToast('Koperta została usunięta', 'success')
                              } else {
                                throw new Error('Błąd usuwania koperty')
                              }
                            } catch (error) {
                              showToast('Błąd usuwania koperty', 'error')
                            }
                          }
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
                    </div>
                  </div>
                  
                  {/* CATEGORIES FOR THIS ENVELOPE */}
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
                                if (confirm(`Czy na pewno chcesz usunąć kategorię "${category.name}"?`)) {
                                  setCategories(prev => prev.filter(c => c.id !== category.id))
                                  showToast('Kategoria została usunięta', 'success')
                                }
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
                </div>
              )
            })}
            
            {/* Add new envelope button */}
            <div style={{
              backgroundColor: '#0f172a', // slate-900
              border: '1px solid #334155', // slate-700
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <button
                onClick={async () => {
                  try {
                    const response = await authorizedFetch('/api/envelopes', {
                      method: 'POST',
                      body: JSON.stringify({
                        name: 'Nowa koperta',
                        icon: '📦',
                        plannedAmount: 0,
                        type: 'monthly',
                        group: 'needs'
                      })
                    })
                    if (response.ok) {
                      const data = await response.json()
                      const newEnvelope: Envelope = {
                        id: data.envelope.id,
                        name: data.envelope.name,
                        icon: data.envelope.icon,
                        plannedAmount: data.envelope.plannedAmount,
                        currentAmount: 0,
                        group: data.envelope.group,
                        type: 'monthly'
                      }
                      setEnvelopes(prev => [...prev, newEnvelope])
                      showToast('Koperta została dodana', 'success')
                    } else {
                      throw new Error('Błąd dodawania koperty')
                    }
                  } catch (error) {
                    showToast('Błąd dodawania koperty', 'error')
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4f46e5', // indigo-600
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
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
                + Dodaj nową kopertę
              </button>
            </div>
          </div>
        )}

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
    </div>
  )
}
