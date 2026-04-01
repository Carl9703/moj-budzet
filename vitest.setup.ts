
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
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
