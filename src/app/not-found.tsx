import Link from "next/link";
import { BRAND_NAME } from "@/config/brand";

const QUICK_LINKS = [
  { href: "/vysledky", label: "Browse cars" },
  { href: "/predajcovia", label: "Browse dealers" },
  { href: "/pridat-inzerat", label: "Add listing" },
  { href: "/kontakt", label: "Contact us" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="card p-8 sm:p-10">
          <p className="eyebrow mb-3">404</p>
          <h1 className="text-3xl font-display font-semibold text-text-primary">
            This page does not exist
          </h1>
          <p className="mt-3 text-text-secondary">
            The link may be old, or the page may have moved. You can continue from
            one of these useful routes in {BRAND_NAME}.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="card-interactive rounded-lg border border-border p-4 text-text-primary motion-interruptible"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/" className="btn-primary motion-interruptible">
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
