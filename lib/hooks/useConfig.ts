import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { AppConfig } from '../types'

interface ConfigResponse {
    config: AppConfig
}

export function useConfig() {
    const [config, setConfig] = useState<AppConfig | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadConfig = async () => {
            try {
                setLoading(true)
                const data = await api.get<ConfigResponse>('/api/config')
                setConfig(data?.config)
            } catch {
                // ignore
            } finally {
                setLoading(false)
            }
        }

        loadConfig()
    }, [])

    return { config, loading }
}
