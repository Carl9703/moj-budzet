'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterFormData } from '@/lib/schemas'
import { api } from '@/lib/api'
import { Input, Text } from '@/components/ui/primitives'
import { Button } from '@/components/ui/buttons/Button'

export default function SignUpPage() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Rozszerzamy typ danych formularza o confirmPassword tylko dla walidacji w komponencie
  // Schema w Zod waliduje podstawowe pola, ale porównanie haseł zrobimy tutaj lub w resolverze (lepiej w resolverze, ale dla uproszczenia tutaj manually check if needed, though Zod .refine is better)
  // W schemas/index.ts registerSchema nie ma confirmPassword, dodajmy to manualnie do walidacji

  const onSubmit = async (data: RegisterFormData & { confirmPassword?: string }) => {
    // Basic confirmation check (should be in schema ideally but keeping it simple for now as requested schema didn't have it)
    const formData = new FormData(document.querySelector('form') as HTMLFormElement)
    const confirmPass = formData.get('confirmPassword') as string

    if (data.password !== confirmPass) {
      setGlobalError('Hasła nie są identyczne')
      return
    }

    setIsLoading(true)
    setGlobalError('')
    setSuccess('')

    try {
      await api.post('/api/auth/signup', {
        email: data.email,
        password: data.password,
        name: data.name
      })

      setSuccess('Konto zostało utworzone! Przekierowuję na stronę logowania...')
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    } catch (err) {
      const error = err as { data?: { error?: string } }
      setGlobalError(error.data?.error || 'Wystąpił błąd podczas rejestracji')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-5">
      <div className="bg-slate-800 p-10 rounded-xl shadow-lg w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <Text variant="h1" className="mb-2">💰 Budżet Domowy</Text>
          <Text variant="body" color="secondary">Stwórz nowe konto</Text>
        </div>

        {globalError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-5 text-rose-400 text-sm">
            {globalError}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-5 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Imię"
            placeholder="Twoje imię"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Email"
            placeholder="twoj@email.com"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Hasło"
            placeholder="••••••••"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />

          <Input
            label="Potwierdź hasło"
            placeholder="••••••••"
            type="password"
            name="confirmPassword" // Not in schema, handled manually/via form data for now
            id="confirmPassword"
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            variant="success"
          >
            Stwórz konto
          </Button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-700">
          <Text variant="caption" color="secondary">
            Masz już konto?{' '}
            <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Zaloguj się
            </Link>
          </Text>
        </div>
      </div>
    </div>
  )
}
