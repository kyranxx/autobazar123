export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="card p-8 sm:p-10">
          <p className="eyebrow mb-3">Loading</p>
          <h1 className="text-2xl font-display font-semibold text-text-primary">
            Preparing page content
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            We are loading the latest cars, filters, and account state.
          </p>

          <div
            className="mt-6 h-2 w-full overflow-hidden rounded-full bg-background-muted"
            role="progressbar"
            aria-label="Page loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext="Loading content"
          >
            <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </main>
  );
}
