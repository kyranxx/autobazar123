export default function Loading() {
  return (
    <main className="market-results-page min-h-screen bg-background-muted pb-12 lg:pb-16">
      <div className="container-main !px-1.5 pt-2 sm:!px-6 sm:pt-4 lg:!px-8">
        <div className="mb-3 h-14 animate-pulse rounded-xl border border-border-subtle bg-background-secondary/60 lg:mb-4" />
        <div className="grid gap-4 lg:grid-cols-[292px_minmax(0,1fr)]">
          <div className="hidden h-[560px] animate-pulse rounded-xl border border-border-subtle bg-background-secondary/60 lg:block" />
          <div>
            <div className="mb-3 h-12 animate-pulse rounded-lg border border-border-subtle bg-background-secondary/60" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-xl border border-border-subtle bg-background-secondary/60"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
