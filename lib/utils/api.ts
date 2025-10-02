// API utility functions with JWT authentication

export function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken')
    
    if (!token) {
        throw new Error('No authentication token found')
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
        const headers = getAuthHeaders()
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        })

        // Handle authentication errors
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken')
            window.location.href = '/auth/signin'
            throw new Error('Authentication required')
        }

        return response
    } catch (error) {
        // Handle network errors or missing token
        if (error instanceof Error && error.message === 'No authentication token found') {
            window.location.href = '/auth/signin'
        }
        throw error
    }
}

export async function authenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await authenticatedFetch(url, options)
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    return response.json()
}
