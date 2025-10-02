import { useState, useEffect } from 'react'
import { authenticatedRequest } from '@/lib/utils/api'

export function useConfig() {
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await authenticatedRequest<{config: any}>('/api/config')
                setConfig(data?.config)
            } catch {
                // ignore
            }
        }
        
        loadConfig()
    }, [])

    return config
}
