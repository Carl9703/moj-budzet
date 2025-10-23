import { useState, useEffect } from 'react'
import { authorizedFetch } from '../utils/api'

export function useConfig() {
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadConfig = async () => {
            try {
                setLoading(true)
                const res = await authorizedFetch('/api/config', { cache: 'no-store' })
                const data = await res.json()
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
