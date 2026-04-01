// Centralized API client with type safety

const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken')
    }
    return null
}

interface RequestConfig extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>
}

class ApiError extends Error {
    constructor(public status: number, public data: unknown) {
        super(`API Error: ${status}`)
        this.name = 'ApiError'
    }
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, ...init } = config

    let url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    if (params) {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) searchParams.append(key, String(value))
        })
        const queryString = searchParams.toString()
        if (queryString) url += `?${queryString}`
    }

    const token = getAuthToken()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    if (init.headers) {
        if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
                headers[key] = value
            })
        } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
                headers[key] = value
            })
        } else {
            Object.assign(headers, init.headers)
        }
    }

    const response = await fetch(url, {
        ...init,
        headers,
    })

    const data = await response.json()

    if (!response.ok) {
        throw new ApiError(response.status, data)
    }

    return data
}

export const api = {
    get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
        request<T>(endpoint, { method: 'GET', params }),

    post: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

    put: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

    patch: <T>(endpoint: string, body?: unknown) =>
        request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

    delete: <T>(endpoint: string) =>
        request<T>(endpoint, { method: 'DELETE' }),
}

export { ApiError }

// Backward-compatible authorizedFetch - wraps fetch with auth and 401 handling
// This allows gradual migration without breaking existing code
export async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken()
    const headers: Record<string, string> = {}

    // Copy existing headers
    if (options.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                headers[key] = value
            })
        } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([key, value]) => {
                headers[key] = value
            })
        } else {
            Object.assign(headers, options.headers)
        }
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    if (!headers['Content-Type'] && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
        headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
        ...options,
        headers,
    })

    // Handle 401 - redirect to login (but not if already on login page to prevent infinite loop)
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            const isOnAuthPage = window.location.pathname.startsWith('/auth/')
            if (!isOnAuthPage) {
                localStorage.removeItem('authToken')
                localStorage.removeItem('user')
                window.location.href = '/auth/signin'
            }
        }
    }

    return response
}
