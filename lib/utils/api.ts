export async function authorizedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  const headers = new Headers(options?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  if (!headers.has('Content-Type') && (options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/auth/signin'
    }
  }

  return response
}
