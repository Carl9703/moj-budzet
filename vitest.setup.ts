
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { server } from './tests/setup/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

afterAll(() => server.close())

// Cleanup after each test
afterEach(() => {
    server.resetHandlers()
    cleanup()
})

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock window.location
Object.defineProperty(global, 'window', {
    value: {
        ...global.window,
        location: {
            href: '',
            reload: vi.fn(),
        },
        dispatchEvent: vi.fn(),
    },
    writable: true,
})
