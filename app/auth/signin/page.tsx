// app/auth/signin/page.tsx - Prosta strona logowania
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  console.log('🚀 SignInPage component loaded')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('📝 handleSubmit called')
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Zapisz token w localStorage (prosta implementacja)
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/')
      } else {
        setError(data.error || 'Nieprawidłowy email lub hasło')
      }
    } catch (error) {
      setError('Wystąpił błąd podczas logowania')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    console.log('🚀 handleDemoLogin called')
    setEmail('demo@example.com')
    setPassword('demo123')
    
    // Wyślij request bezpośrednio
    setIsLoading(true)
    setError('')

    try {
      console.log('🌐 Making fetch request to /api/auth/signin')
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'demo@example.com',
          password: 'demo123',
        }),
      })
      console.log('📡 Fetch response received:', response.status)

      const data = await response.json()
      console.log('📦 API Response:', data)

      if (response.ok) {
        console.log('✅ Demo login successful, saving token')
        console.log('🔑 Token:', data.token)
        console.log('👤 User:', data.user)
        
        try {
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          console.log('💾 Token saved to localStorage')
          
          // Test if token was saved
          const savedToken = localStorage.getItem('authToken')
          console.log('🔍 Saved token check:', savedToken ? 'OK' : 'FAILED')
        } catch (error) {
          console.error('❌ localStorage error:', error)
        }
        
        console.log('🔄 Redirecting to dashboard...')
        router.push('/')
      } else {
        console.error('❌ Demo login failed:', data.error)
        setError(data.error || 'Nieprawidłowy email lub hasło')
      }
    } catch (error) {
      console.error('❌ Demo login error:', error)
      setError('Wystąpił błąd podczas logowania: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>
            💰 Budżet Domowy
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Zaloguj się do swojego konta
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#991b1b',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="twoj@email.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
            Nie masz konta?{' '}
            <Link 
              href="/auth/signup"
              style={{ 
                color: '#3b82f6', 
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Zarejestruj się
            </Link>
          </p>
          
          <div style={{ margin: '16px 0' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>lub</span>
          </div>
          
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#10b981',
              border: '1px solid #10b981',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🚀 Wypróbuj demo
          </button>
        </div>
      </div>
    </div>
  )
}
