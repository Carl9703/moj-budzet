// lib/utils/api.ts - Authorized fetch utility
/**
 * Wykonuje fetch z automatycznym dodaniem tokenu JWT z localStorage
 */
export async function authorizedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Pobierz token z localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  // Dodaj nagłówek Authorization
  const headers = new Headers(options?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  // Domyślnie dodaj Content-Type dla JSON
  if (!headers.has('Content-Type') && (options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH')) {
    headers.set('Content-Type', 'application/json')
  }

  // Wykonaj fetch z zaktualizowanymi nagłówkami
  const response = await fetch(url, {
    ...options,
    headers
  })

  // Jeśli 401 (Unauthorized), przekieruj do logowania
  if (response.status === 401) {
    // Wyczyść token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      // Przekieruj do strony logowania
      window.location.href = '/auth/signin'
    }
  }

  return response
}

