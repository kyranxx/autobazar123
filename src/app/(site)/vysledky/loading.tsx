export default function Loading() {
  return (
    <main className="market-page min-h-screen pb-16 pt-5 sm:pt-6">
      <div className="container-main">
        <div className="mb-4 h-20 animate-pulse rounded-lg border border-border-subtle bg-background-secondary/60 lg:mb-5" />
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="hidden h-[560px] animate-pulse rounded-lg border border-border-subtle bg-background-secondary/60 lg:block" />
          <div>
            <div className="mb-3 h-14 animate-pulse rounded-lg border border-border-subtle bg-background-secondary/60" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
