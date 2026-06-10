import { describe, it, expect, beforeEach, vi } from 'vitest'
import { api, ApiError } from '@/lib/api/client'
import { server } from '@/tests/setup/server'
import { http, HttpResponse } from 'msw'

describe('API Client', () => {
    beforeEach(() => {
        // Reset or setup before tests if needed
    })

    describe('api.get', () => {
        it('should make GET request with content-type header', async () => {
            const mockData = { success: true }
            let requestHeaders = new Headers()
            
            server.use(
                http.get('http://localhost:3000/api/test', ({ request }) => {
                    requestHeaders = request.headers
                    return HttpResponse.json(mockData)
                })
            )

            const result = await api.get<{ success: boolean }>('/api/test')

            expect(result).toEqual(mockData)
            expect(requestHeaders.get('Content-Type')).toBe('application/json')
        })

        it('should handle query params', async () => {
            let requestUrl = ''
            server.use(
                http.get('http://localhost:3000/api/test', ({ request }) => {
                    requestUrl = request.url
                    return HttpResponse.json({})
                })
            )

            await api.get('/api/test', { page: 1, limit: 10 })

            expect(requestUrl).toContain('page=1')
            expect(requestUrl).toContain('limit=10')
        })
    })

    describe('api.post', () => {
        it('should make POST request with body', async () => {
            const mockData = { id: 1 }
            const body = { name: 'test' }
            let requestBody: any = null
            
            server.use(
                http.post('http://localhost:3000/api/test', async ({ request }) => {
                    requestBody = await request.json()
                    return HttpResponse.json(mockData)
                })
            )

            const result = await api.post<{ id: number }>('/api/test', body)

            expect(result).toEqual(mockData)
            expect(requestBody).toEqual(body)
        })
    })

    describe('Error handling', () => {
        it('should throw ApiError on non-ok response', async () => {
            server.use(
                http.get('http://localhost:3000/api/test', () => {
                    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
                })
            )

            await expect(api.get('/api/test')).rejects.toThrow(ApiError)
        })
    })
})
