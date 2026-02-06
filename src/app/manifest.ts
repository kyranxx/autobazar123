import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Autobazar123 – Predaj áut na Slovensku',
        short_name: 'Autobazar123',
        description: 'Najrýchlejší a najbezpečnejší spôsob, ako kúpiť alebo predať auto na Slovensku.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#2563eb',
        lang: 'sk',
        categories: ['auto', 'shopping'],
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
