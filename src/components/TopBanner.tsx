import Link from "next/link";

export default function TopBanner() {
  return (
    <div className="print:hidden w-full bg-primary text-white">
      <div className="container-main flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-semibold tracking-wide">
          <span className="rounded-full bg-white/15 px-2 py-1">Overené inzeráty</span>
          <span className="rounded-full bg-white/15 px-2 py-1">Bezpečný predaj</span>
          <span className="rounded-full bg-white/15 px-2 py-1">Podpora 7/7</span>
        </div>
        <div className="flex items-center gap-4 font-semibold">
          <Link href="/kontakt" className="transition-colors hover:text-white/85">
            Kontakt
          </Link>
          <Link href="/kredity" className="transition-colors hover:text-white/85">
            Kredity
          </Link>
        </div>
      </div>
    </div>
  );
}
