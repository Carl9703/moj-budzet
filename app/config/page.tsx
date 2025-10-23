'use client'

import { useEffect, useState } from 'react'
import { EnvelopeGroupConfig } from '@/components/features/config/EnvelopeGroupConfig'
import { RecurringPayments } from '@/components/features/config/RecurringPayments'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/feedback/Toast'
import { Settings, Zap } from 'lucide-react'

interface MonthlyEnvelopeRow {
  id: string
  name: string
  icon: string | null
  plannedAmount: number
  currentAmount: number
  group?: string
}

type TabType = 'settings' | 'automations'

export default function ConfigPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('settings')
  
  // Settings tab state
  const [defaultSalary, setDefaultSalary] = useState<string>('0')
  const [envelopes, setEnvelopes] = useState<MonthlyEnvelopeRow[]>([])
  const [yearlyEnvelopes, setYearlyEnvelopes] = useState<MonthlyEnvelopeRow[]>([])

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
          setDefaultSalary(String(cfg.defaultSalary ?? 0))
        }
        setEnvelopes((data?.monthlyEnvelopes || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          plannedAmount: e.plannedAmount,
          currentAmount: e.currentAmount,
          group: e.group
        })))
        setYearlyEnvelopes((data?.yearlyEnvelopes || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          plannedAmount: e.plannedAmount,
          currentAmount: e.currentAmount,
          group: e.group
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Ładowanie...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  
  // Usunięto logikę totalTransfers - nie ma już stałych przelewów

  const handleEnvelopeChange = (envelopeId: string, plannedAmount: number) => {
    // Sprawdź czy to koperta miesięczna czy roczna
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
      const payload = {
        defaultSalary: Number(defaultSalary||0),
        monthlyEnvelopes: envelopes.map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount||0) })),
        yearlyEnvelopes: yearlyEnvelopes.map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount||0) })),
      }
      const res = await authorizedFetch('/api/config', { method: 'PUT', body: JSON.stringify(payload) })
      if (res.ok) {
        showToast('Zapisano konfigurację pomyślnie!', 'success')
      } else {
        showToast('Błąd zapisu konfiguracji', 'error')
      }
    } catch {
      showToast('Błąd zapisu konfiguracji', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div className="text-theme-secondary" style={{ fontSize: '24px' }}>⚙️ Ładowanie konfiguracji...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        <h1 className="section-header" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>⚙️ Konfigurator budżetu</h1>

        {/* Zakładki */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'settings' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'settings' ? 'white' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={16} />
            Ustawienia
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTab === 'automations' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'automations' ? 'white' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap size={16} />
            Automatyzacje
          </button>
        </div>

        {/* Zawartość zakładek */}
        {activeTab === 'settings' && (
          <>
            <div className="bg-theme-secondary card rounded-lg p-4" style={{ marginBottom: '16px', border: '1px solid var(--border-primary)' }}>
              <h2 className="section-header" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Wypłata (pensja)</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="text-theme-primary">💼 Domyślna wypłata</span>
                <input type="number" inputMode="numeric" value={defaultSalary} onChange={e=>setDefaultSalary(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </label>
            </div>

            {/* GRUPA 1: POTRZEBY */}
            <EnvelopeGroupConfig
              title="🏡 Potrzeby"
              icon="🏡"
              color="rgba(34, 197, 94, 0.1)"
              envelopes={envelopes.filter(e => e.group === 'needs')}
              onEnvelopeChange={handleEnvelopeChange}
            />
            
            {/* GRUPA 2: STYL ŻYCIA */}
            <EnvelopeGroupConfig
              title="🎉 Styl życia"
              icon="🎉"
              color="rgba(168, 85, 247, 0.1)"
              envelopes={envelopes.filter(e => e.group === 'lifestyle')}
              onEnvelopeChange={handleEnvelopeChange}
            />
            
            {/* GRUPA 3: CELE FINANSOWE */}
            <EnvelopeGroupConfig
              title="🎯 Cele finansowe"
              icon="🎯"
              color="rgba(59, 130, 246, 0.1)"
              envelopes={envelopes.filter(e => e.group === 'financial')}
              onEnvelopeChange={handleEnvelopeChange}
            />

            {/* FUNDUSZE CELOWE */}
            <EnvelopeGroupConfig
              title="🎯 Fundusze celowe"
              icon="🎯"
              color="rgba(245, 158, 11, 0.1)"
              envelopes={yearlyEnvelopes.filter(e => e.group === 'target')}
              onEnvelopeChange={handleEnvelopeChange}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={()=>{ window.location.href='/' }} className="nav-button" style={{ padding: '8px 16px', border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}>Anuluj</button>
              <button onClick={handleSave} disabled={saving} className="nav-button" style={{ padding: '8px 16px', border: 'none', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Zapisywanie...' : 'Zapisz konfigurację'}</button>
            </div>
          </>
        )}

        {activeTab === 'automations' && (
          <RecurringPayments 
            envelopes={[
              ...envelopes.map(e => ({ id: e.id, name: e.name, icon: e.icon || '📦', type: 'monthly' })),
              ...yearlyEnvelopes.map(e => ({ id: e.id, name: e.name, icon: e.icon || '📦', type: 'yearly' }))
            ]}
          />
        )}
      </div>
    </div>
  )
}