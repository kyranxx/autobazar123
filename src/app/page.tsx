import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">Autobazar<span className="text-accent">123</span></span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden cursor-pointer text-sm font-medium text-secondary hover:text-primary md:block">SK | EN | HU</span>
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-background hover:opacity-90">
              Pridať inzerát
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-6xl">
              Nájdite svoje ďalšie <br />
              <span className="text-accent">vysnívané auto</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-secondary">
              Najrýchlejší a najbezpečnejší spôsob, ako kúpiť alebo predať auto na Slovensku. <br />
              Pridajte sa k tisícom spokojných používateľov.
            </p>
          </div>

          {/* Airbnb-style Search Bar */}
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-xl md:flex-row md:items-center md:rounded-full">
              <div className="flex-1 px-6 py-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Značka & Model</label>
                <input 
                  type="text" 
                  placeholder="Napr. Škoda Octavia" 
                  className="w-full bg-transparent text-sm font-medium placeholder:text-secondary focus:outline-none"
                />
              </div>
              <div className="h-8 w-[1px] bg-border hidden md:block" />
              <div className="flex-1 px-6 py-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Lokalita</label>
                <input 
                  type="text" 
                  placeholder="Celé Slovensko" 
                  className="w-full bg-transparent text-sm font-medium placeholder:text-secondary focus:outline-none"
                />
              </div>
              <div className="h-8 w-[1px] bg-border hidden md:block" />
              <div className="flex-1 px-6 py-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Cena do</label>
                <input 
                  type="text" 
                  placeholder="Flexible" 
                  className="w-full bg-transparent text-sm font-medium placeholder:text-secondary focus:outline-none"
                />
              </div>
              <button className="mt-2 rounded-full bg-accent px-8 py-4 text-white hover:opacity-90 md:mt-0">
                Hľadať
              </button>
            </div>
          </div>
        </section>

        {/* Featured Section Placeholder */}
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Odporúčané ponuky</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-lg">
                <div className="aspect-[16/9] bg-border animate-pulse" />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Premium Car {i}</h3>
                    <span className="text-accent font-semibold">24 900 €</span>
                  </div>
                  <p className="mt-1 text-sm text-secondary">Bratislava • 2023 • 15 000 km</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
