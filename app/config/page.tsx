'use client'

import { useEffect, useState } from 'react'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { EnvelopeGroupConfig } from '@/components/config/EnvelopeGroupConfig'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

interface MonthlyEnvelopeRow {
  id: string
  name: string
  icon: string | null
  plannedAmount: number
  currentAmount: number
  group?: string
}

export default function ConfigPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [defaultSalary, setDefaultSalary] = useState<string>('0')
  const [defaultToJoint, setDefaultToJoint] = useState<string>('0')
  const [defaultToSavings, setDefaultToSavings] = useState<string>('0')
  const [defaultToVacation, setDefaultToVacation] = useState<string>('0')
  const [defaultToInvestment, setDefaultToInvestment] = useState<string>('0')
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
          setDefaultToJoint(String(cfg.defaultToJoint ?? 0))
          setDefaultToSavings(String(cfg.defaultToSavings ?? 0))
          setDefaultToVacation(String(cfg.defaultToVacation ?? 0))
          setDefaultToInvestment(String(cfg.defaultToInvestment ?? 0))
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

  const totalTransfers = Number(defaultToJoint||0) + Number(defaultToSavings||0) + Number(defaultToVacation||0) + Number(defaultToInvestment||0)
  const warnings: string[] = []
  const salaryNum = Number(defaultSalary||0)
  if (salaryNum > 0 && totalTransfers > salaryNum) warnings.push('Suma przelewów przekracza domyślną wypłatę')

  const handleEnvelopeChange = (envelopeId: string, plannedAmount: number) => {
    setEnvelopes(prev => prev.map(e => 
      e.id === envelopeId ? { ...e, plannedAmount } : e
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        defaultSalary: Number(defaultSalary||0),
        defaultToJoint: Number(defaultToJoint||0),
        defaultToSavings: Number(defaultToSavings||0),
        defaultToVacation: Number(defaultToVacation||0),
        defaultToInvestment: Number(defaultToInvestment||0),
        monthlyEnvelopes: envelopes.map(e => ({ id: e.id, plannedAmount: Number(e.plannedAmount||0) })),
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
      <TopNavigation />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        <h1 className="section-header" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>⚙️ Konfigurator budżetu</h1>

      <div className="bg-theme-secondary card rounded-lg p-4" style={{ marginBottom: '16px', border: '1px solid var(--border-primary)' }}>
        <h2 className="section-header" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Wypłata (pensja) i stałe przelewy</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="text-theme-primary">💼 Domyślna wypłata</span>
            <input type="number" value={defaultSalary} onChange={e=>setDefaultSalary(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="text-theme-primary">📈 IKE (Budowanie Przyszłości)</span>
            <input type="number" value={defaultToInvestment} onChange={e=>setDefaultToInvestment(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="text-theme-primary">🏠 Wspólne opłaty (Mieszkanie)</span>
            <input type="number" value={defaultToJoint} onChange={e=>setDefaultToJoint(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="text-theme-primary">🛒 Wspólne zakupy (Żywność)</span>
            <input type="number" value={defaultToVacation} onChange={e=>setDefaultToVacation(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span className="text-theme-primary">🚨 Fundusz Awaryjny</span>
            <input type="number" value={defaultToSavings} onChange={e=>setDefaultToSavings(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid var(--border-primary)', borderRadius: 6, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </label>
        </div>
        {warnings.length > 0 && (
          <div style={{ marginTop: 12, padding: 8, backgroundColor: 'var(--bg-warning)', border: '1px solid var(--accent-warning)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}>
            {warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
          </div>
        )}
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
      </div>
    </div>
  )
}


