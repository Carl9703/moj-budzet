import { useState, useEffect } from 'react'
import { authenticatedRequest } from '@/lib/utils/api'

export function useConfig() {
    const [config, setConfig] = useState<any>(null)

    useEffect(() => {
        const loadConfig = async () => {
            // Check if token exists before making request
            const token = localStorage.getItem('authToken')
            if (!token) {
                console.log('❌ No token found, skipping config fetch')
                return
            }
            
            try {
                console.log('🔧 Loading config...')
                const data = await authenticatedRequest<{config: any}>('/api/config')
                setConfig(data?.config)
            } catch (error) {
                console.error('❌ Config fetch error:', error)
                // ignore
            }
        }
        
        // Add delay to ensure token is saved after login
        const timer = setTimeout(loadConfig, 300)
        
        return () => clearTimeout(timer)
    }, [])

    return config
}
