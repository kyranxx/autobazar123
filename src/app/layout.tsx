import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import CookieBanner from "@/components/CookieBanner";
import GoogleOneTap from "@/components/GoogleOneTap";
import { Outfit } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" }, // Porcelain
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" }, // Deep Slate
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://autobazar123.sk"),
  title: {
    default: "Autobazar123 | Predaj áut a ojazdených vozidiel na Slovensku",
    template: "%s | Autobazar123",
  },
  description:
    "Najväčší online autobazar na Slovensku. Kúpte alebo predajte auto rýchlo a bezpečne. Tisíce overených inzerátov, ojazdené aj nové vozidlá, autobazáre a súkromní predajcovia.",
  keywords: [
    "autobazar",
    "autobazar slovensko",
    "predaj áut",
    "kúpa auta",
    "ojazdené autá",
    "bazár áut",
    "autá na predaj",
    "predaj ojazdených áut",
    "autobazár online",
    "inzeráty áut",
    "autá slovensko",
    "kúpiť auto",
    "predať auto",
    "auto inzercia",
    "autobazar bratislava",
    "autobazar košice",
  ],
  authors: [{ name: "Autobazar123" }],
  creator: "Autobazar123",
  publisher: "Autobazar123",
  alternates: {
    canonical: "https://autobazar123.sk",
    languages: {
      "sk": "https://autobazar123.sk",
      "cs": "https://autobazar123.sk",
      "hu": "https://autobazar123.sk",
      "en": "https://autobazar123.sk",
    },
  },
  openGraph: {
    type: "website",
    locale: "sk_SK",
    alternateLocale: ["cs_CZ", "hu_HU", "en_US"],
    url: "https://autobazar123.sk",
    siteName: "Autobazar123",
    title: "Autobazar123 | Predaj áut a ojazdených vozidiel na Slovensku",
    description:
      "Najväčší online autobazar na Slovensku. Tisíce overených inzerátov, ojazdené aj nové vozidlá.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autobazar123 | Predaj áut na Slovensku",
    description:
      "Kúpte alebo predajte auto rýchlo a bezpečne. Tisíce overených inzerátov na Slovensku.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "automotive",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning className={outfit.variable}>
      <head>
        {/* Preload fonts handled by next/font/google */}
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://imagedelivery.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        <link rel="preconnect" href="https://*.algolia.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://*.algolia.net" />
      </head>
      <body className="font-sans antialiased min-h-screen" suppressHydrationWarning>
        <JsonLd />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-text-primary focus:text-white focus:text-sm focus:font-medium focus:rounded-md">
          Preskočiť na obsah
        </a>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <GoogleOneTap />
            <CookieBanner />
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                className: "font-sans",
              }}
            />
          </AuthProvider>
        </NextIntlClientProvider>
        {/* Microsoft Clarity Analytics - loaded after ALL resources for zero impact on Core Web Vitals */}
        <Script
          id="clarity-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID || 'YOUR_CLARITY_PROJECT_ID'}");
            `,
          }}
        />
        <WebVitalsReporter />
      </body>
      {/* Service Worker Registration */}
      <Script id="sw-register" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(err => {
                console.error('Service Worker registration failed:', err);
              });
            });
          }
        `}
      </Script>
    </html>
  );
}
