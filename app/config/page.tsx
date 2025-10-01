'use client'

import { useEffect, useState } from 'react'
import { TopNavigation } from '@/components/ui/TopNavigation'

interface MonthlyEnvelopeRow {
  id: string
  name: string
  icon: string | null
  plannedAmount: number
  currentAmount: number
}

export default function ConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [defaultSalary, setDefaultSalary] = useState<string>('0')
  const [defaultToJoint, setDefaultToJoint] = useState<string>('0')
  const [defaultToSavings, setDefaultToSavings] = useState<string>('0')
  const [defaultToVacation, setDefaultToVacation] = useState<string>('0')
  const [defaultToInvestment, setDefaultToInvestment] = useState<string>('0')
  const [envelopes, setEnvelopes] = useState<MonthlyEnvelopeRow[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' })
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
        })))
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const totalTransfers = Number(defaultToJoint||0) + Number(defaultToSavings||0) + Number(defaultToVacation||0) + Number(defaultToInvestment||0)
  const warnings: string[] = []
  const salaryNum = Number(defaultSalary||0)
  if (salaryNum > 0 && totalTransfers > salaryNum) warnings.push('Suma przelewów przekracza domyślną wypłatę')

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
      const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        alert('Zapisano konfigurację')
      } else {
        alert('Błąd zapisu konfiguracji')
      }
    } catch {
      alert('Błąd zapisu konfiguracji')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        Ładowanie konfiguracji...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>⚙️ Konfigurator budżetu</h1>

      <div className="bg-white rounded-lg shadow p-4" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Wypłata (pensja) i stałe przelewy</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span>💼 Domyślna wypłata</span>
            <input type="number" value={defaultSalary} onChange={e=>setDefaultSalary(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span>👫 Konto wspólne</span>
            <input type="number" value={defaultToJoint} onChange={e=>setDefaultToJoint(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span>💍 Wesele (cel)</span>
            <input type="number" value={defaultToSavings} onChange={e=>setDefaultToSavings(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span>✈️ Wakacje (koperta)</span>
            <input type="number" value={defaultToVacation} onChange={e=>setDefaultToVacation(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span>📈 Inwestycje</span>
            <input type="number" value={defaultToInvestment} onChange={e=>setDefaultToInvestment(e.target.value)} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
          </label>
        </div>
        {warnings.length > 0 && (
          <div style={{ marginTop: 12, padding: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, color: '#9a3412', fontSize: 12 }}>
            {warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Domyślne kwoty kopert miesięcznych</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {envelopes.map((e, idx) => (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{e.icon || '📦'}</span>
                <span style={{ fontWeight: 500 }}>{e.name}</span>
              </div>
              <input type="number" value={e.plannedAmount} onChange={(ev)=>{
                const v = Number((ev.target as HTMLInputElement).value || 0)
                setEnvelopes(prev => prev.map((row,i)=> i===idx ? { ...row, plannedAmount: v } : row))
              }} style={{ width: 120, textAlign: 'right', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={()=>{ window.location.href='/' }} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, background: 'white', cursor: 'pointer' }}>Anuluj</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Zapisywanie...' : 'Zapisz konfigurację'}</button>
        </div>
      </div>
    </div>
  )
}


