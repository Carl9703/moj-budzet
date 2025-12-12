import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from '@/lib/api/client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
    beforeEach(() => {
        mockFetch.mockReset()
        vi.mocked(localStorage.getItem).mockReturnValue('test-token')
    })

    describe('api.get', () => {
        it('should make GET request with auth header', async () => {
            const mockData = { success: true }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await api.get<{ success: boolean }>('/api/test')

            expect(result).toEqual(mockData)
            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                }
            })
        })

        it('should handle query params', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            })

            await api.get('/api/test', { page: 1, limit: 10 })

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/test?page=1&limit=10',
                expect.any(Object)
            )
        })
    })

    describe('api.post', () => {
        it('should make POST request with body', async () => {
            const mockData = { id: 1 }
            const body = { name: 'test' }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await api.post<{ id: number }>('/api/test', body)

            expect(result).toEqual(mockData)
            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                }
            })
        })
    })

    describe('Error handling', () => {
        it('should throw ApiError on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({ error: 'Not found' })
            })

            await expect(api.get('/api/test')).rejects.toThrow(ApiError)
        })
    })
})
