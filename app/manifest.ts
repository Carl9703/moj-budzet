import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Mój Budżet',
        short_name: 'Budżet',
        description: 'Twoja aplikacja do zarządzania budżetem',
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b', // zinc-950, standard dark theme bg
        theme_color: '#09090b',
        icons: [
            {
                src: '/favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
    }
}
