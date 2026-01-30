/**
 * Cloudflare Worker for Autobazar123 Cron Jobs
 * 
 * This worker triggers cron jobs on the Vercel deployment.
 * Free tier: 100,000 requests/day, unlimited cron triggers
 */

export interface Env {
    CRON_SECRET: string;
    SITE_URL: string;
}

// Cron endpoints to call
const CRON_ENDPOINTS = [
    '/api/cron/expire-ads',
    '/api/cron/cleanup-sold', 
    '/api/cron/expire-premiums',
];

export default {
    async scheduled(
        controller: ScheduledController,
        env: Env,
        ctx: ExecutionContext
    ): Promise<void> {
        console.log(`Cron job triggered at ${new Date().toISOString()}`);
        
        // Run all cron jobs in parallel
        const results = await Promise.allSettled(
            CRON_ENDPOINTS.map(endpoint => callCronEndpoint(endpoint, env))
        );
        
        // Log results
        results.forEach((result, index) => {
            const endpoint = CRON_ENDPOINTS[index];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${endpoint}: ${result.value}`);
            } else {
                console.error(`❌ ${endpoint}: ${result.reason}`);
            }
        });
    },

    // Optional: Manual trigger via HTTP request for testing
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        // Only allow POST requests with valid secret
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const url = new URL(request.url);
        const secret = url.searchParams.get('secret');
        
        if (secret !== env.CRON_SECRET) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Run all cron jobs
        const results = await Promise.allSettled(
            CRON_ENDPOINTS.map(endpoint => callCronEndpoint(endpoint, env))
        );

        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            results: results.map((result, index) => ({
                endpoint: CRON_ENDPOINTS[index],
                status: result.status,
                value: result.status === 'fulfilled' ? result.value : undefined,
                error: result.status === 'rejected' ? String(result.reason) : undefined,
            })),
        };

        return new Response(JSON.stringify(response, null, 2), {
            headers: { 'Content-Type': 'application/json' },
        });
    },
};

async function callCronEndpoint(endpoint: string, env: Env): Promise<string> {
    const url = `${env.SITE_URL}${endpoint}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-cron-secret': env.CRON_SECRET,
            'User-Agent': 'Cloudflare-Worker-Cron/1.0',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return JSON.stringify(data);
}
