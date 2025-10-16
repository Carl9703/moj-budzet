'use client'

import { EnvelopeCard } from '@/components/ui/EnvelopeCard'

interface Envelope {
    id: string
    name: string
    icon: string
    spent: number
    planned: number
    current: number
    activityCount?: number
    group?: string
}

interface Props {
    title: string
    icon: string
    color: string
    envelopes: Envelope[]
    type: 'monthly' | 'yearly'
}

export function EnvelopeGroup({ title, icon, color, envelopes, type }: Props) {
    if (envelopes.length === 0) return null

    return (
        <div className="space-y-4">
            {/* Group Header */}
            <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{icon}</span>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {envelopes.length} {envelopes.length === 1 ? 'koperta' : 'kopert'}
                    </p>
                </div>
            </div>

            {/* Envelopes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {envelopes.map((envelope, index) => (
                    <div 
                        key={`${envelope.id}-${envelope.current}`} 
                        className="animate-in fade-in-up duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <EnvelopeCard {...envelope} type={type} />
                    </div>
                ))}
            </div>
        </div>
    )
}
