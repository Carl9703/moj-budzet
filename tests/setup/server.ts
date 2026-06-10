import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Tworzymy serwer mockujący, który przechwytuje zapytania Node'owe
export const server = setupServer(...handlers)
