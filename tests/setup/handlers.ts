import { http, HttpResponse } from 'msw'

// Tutaj w przyszłości będziemy definiować mockowane endpointy API.
// Przykładowo, żeby zamockować zwrotkę dashboardu:
export const handlers = [
    http.get('/api/dashboard', () => {
        return HttpResponse.json({
            balance: 5000,
            monthlyEnvelopes: [],
            yearlyEnvelopes: []
        })
    })
]
