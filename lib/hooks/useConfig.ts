import { useState, useEffect } from 'react'
import { authorizedFetch } from '../utils/api'

export function useConfig() {
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await authorizedFetch('/api/config', { cache: 'no-store' })
                const data = await res.json()
                setConfig(data?.config)
            } catch {
                // ignore
            }
        }
        
        loadConfig()
    }, [])

    return config
}
