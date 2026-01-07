import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Autobazar123 | Prémiový predaj áut na Slovensku",
    template: "%s | Autobazar123",
  },
  description:
    "Najrýchlejší a najbezpečnejší spôsob, ako kúpiť alebo predať auto na Slovensku. Prémiová platforma s overenými predajcami.",
  keywords: [
    "autobazar",
    "predaj áut",
    "kúpa auta",
    "Slovensko",
    "ojazdené autá",
    "bazár áut",
  ],
  authors: [{ name: "Autobazar123" }],
  openGraph: {
    type: "website",
    locale: "sk_SK",
    siteName: "Autobazar123",
    title: "Autobazar123 | Prémiový predaj áut na Slovensku",
    description:
      "Najrýchlejší a najbezpečnejší spôsob, ako kúpiť alebo predať auto na Slovensku.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autobazar123 | Prémiový predaj áut na Slovensku",
    description:
      "Najrýchlejší a najbezpečnejší spôsob, ako kúpiť alebo predať auto na Slovensku.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
