'use client'

import { useEffect } from 'react'

export function PwaRegistrar() {
    useEffect(() => {
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration)
                })
                .catch((error) => {
                    console.log('SW registration failed: ', error)
                })
        }
    }, [])

    return null
}
