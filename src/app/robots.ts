import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/auth/',
                    '/moj-ucet/',
                    '/moje-inzeraty/',
                    '/nastavenia/',
                    '/spravy/',
                    '/ulozene/',
                    '/maintenance/',
                ],
            },
        ],
        sitemap: 'https://autobazar123.sk/sitemap.xml',
    }
}
