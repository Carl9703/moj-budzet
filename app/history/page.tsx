'use client'

import { useState, useEffect } from 'react'
import { TransactionHistory } from '@/components/transactions/TransactionHistory'
import { TopNavigation } from '@/components/ui/TopNavigation'
import { authorizedFetch } from '@/lib/utils/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!isAuthenticated) return
    authorizedFetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error:', err)
        setLoading(false)
      })
  }, [isAuthenticated])

  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner size="large" text="Sprawdzanie autoryzacji..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

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