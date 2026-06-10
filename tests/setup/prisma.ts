import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { DeepMockProxy } from 'vitest-mock-extended'
import { prisma } from '@/lib/utils/prisma'
import { beforeEach, vi } from 'vitest'

// Używamy globalnego obiektu do przechowywania zmockowanej instancji
// (wymagane w środowisku Next.js przy wielu plikach)

vi.mock('@/lib/utils/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}))

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
    // Przed każdym testem resetujemy wywołania mocka, żeby testy były izolowane
    mockReset(prismaMock)
})
