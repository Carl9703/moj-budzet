'use client'

import { useState, useEffect } from 'react'
import { TransactionHistory } from '@/components/transactions/TransactionHistory'
import { TopNavigation } from '@/components/ui/TopNavigation'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  date: string
  envelope?: {
    name: string
    icon: string
  }
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="text-theme-secondary" style={{ fontSize: '24px' }}>📜 Ładowanie historii...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-theme-primary">
      <TopNavigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        <h1 className="section-header" style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '24px' }}>
          📜 Historia transakcji
        </h1>
        
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  )
}