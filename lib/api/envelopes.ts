import { api } from './client'

export interface Envelope {
    id: string
    name: string
    icon: string | null
    plannedAmount: number
    currentAmount: number
    group?: string
    type?: 'monthly' | 'yearly'
    isArchived?: boolean
}

export interface EnvelopeGroup {
    id: string
    name: string
    envelopes: Envelope[]
}

export const envelopesApi = {
    getAll: () => api.get<{ success: boolean; envelopes: Envelope[] }>('/api/envelopes'),

    getById: (id: string) =>
        api.get<{ success: boolean; envelope: Envelope }>(`/api/envelopes/${id}`),

    create: (data: Partial<Envelope>) =>
        api.post<{ success: boolean; envelope: Envelope }>('/api/envelopes', data),

    update: (id: string, data: Partial<Envelope>) =>
        api.put<{ success: boolean; envelope: Envelope }>(`/api/envelopes/${id}`, data),

    delete: (id: string) =>
        api.delete<{ success: boolean }>(`/api/envelopes/${id}`),
}
