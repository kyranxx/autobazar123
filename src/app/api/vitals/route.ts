/**
 * Web Vitals Collection Endpoint
 * Receives and logs Core Web Vitals metrics from clients
 */

export async function POST(request: Request) {
  try {
    const vital = await request.json();

    // Log metric
    const metric = {
      timestamp: new Date().toISOString(),
      ...vital,
    };

    // In development, log to console (disabled to keep terminal clean)
    // Uncomment to debug Web Vitals:
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('[Web Vital]', {
    //     name: metric.name,
    //     value: metric.value.toFixed(2),
    //     rating: metric.rating,
    //     timestamp: metric.timestamp,
    //   });
    // }

    // TODO: Send to monitoring service
    // - Vercel Analytics (automatic)
    // - Sentry (for error context)
    // - Custom analytics dashboard
    // - DataDog / New Relic

    return Response.json(
      { success: true, metric },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing vital:', error);
    return Response.json(
      { error: 'Failed to process vital' },
      { status: 400 }
    );
  }
}
