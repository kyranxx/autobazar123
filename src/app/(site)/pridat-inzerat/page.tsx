import type { Metadata } from "next";
import Link from "next/link";
import RedirectToAccount from "./RedirectToAccount";

export const metadata: Metadata = {
  title: "Pridať inzerát | Autobazar123",
  description:
    "Pridanie inzerátu prebieha v používateľskom účte na karte Pridať inzerát.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AddAdPage() {
  return (
    <>
      <RedirectToAccount />
      <main className="min-h-screen bg-background px-4 pb-16 pt-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border-subtle bg-background-secondary p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-text-primary">Pridať inzerát</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Presúvame vás do účtu, kde môžete dokončiť pridanie inzerátu.
          </p>
          <Link
            href="/moj-ucet?tab=create"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Pokračovať do účtu
          </Link>
        </div>
      </main>
    </>
  );
}
