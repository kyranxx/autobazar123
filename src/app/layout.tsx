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

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }, // White
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
      sk: "https://autobazar123.sk",
      cs: "https://autobazar123.sk",
      hu: "https://autobazar123.sk",
      en: "https://autobazar123.sk",
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
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={outfit.variable}
    >
      <head>
        {/* CRITICAL: Clear bad theme data BEFORE anything renders */}
        <Script id="clear-theme-cache" strategy="beforeInteractive">
          {`
            // This runs FIRST, before React hydrates
            (function() {
              // 1. Clear localStorage immediately
              try {
                const badKeys = ['theme', 'mode', 'color-theme', 'next-themes-preference', 'color-scheme', 'chakra-ui-color-mode'];
                badKeys.forEach(key => {
                  if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log('[CACHE-FIX] Cleared stuck theme key:', key);
                  }
                });
              } catch (e) { 
                console.error('[CACHE-FIX] Error clearing localStorage:', e); 
              }
              
              // 2. Force white background immediately
              if (document.documentElement) {
                document.documentElement.style.backgroundColor = '#ffffff';
                document.documentElement.style.colorScheme = 'light';
                document.documentElement.classList.remove('dark');
              }
            })();
          `}
        </Script>

        {/* Critical: Charset and mobile optimization */}
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />

        {/* Preload fonts handled by next/font/google */}
        {/* Preconnect to critical third-party origins */}
        <link
          rel="preconnect"
          href="https://imagedelivery.net"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        <link
          rel="preconnect"
          href="https://*.algolia.net"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://*.algolia.net" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className="font-sans antialiased min-h-screen bg-white"
        style={{ backgroundColor: "#fff" }}
        suppressHydrationWarning
      >
        <JsonLd />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-text-primary focus:text-white focus:text-sm focus:font-medium focus:rounded-md"
        >
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
        <Script id="sw-register" strategy="afterInteractive">
          {`
          if (typeof window !== 'undefined') {
            // Force light mode and white background aggressively via JS
            const enforceWhite = () => {
              document.documentElement.style.backgroundColor = '#ffffff';
              document.body.style.backgroundColor = '#ffffff';
              document.documentElement.style.colorScheme = 'light';
              document.documentElement.classList.remove('dark');
              document.body.classList.remove('dark');
            };
            enforceWhite();
            
            // Re-apply if something tries to change it (e.g. rogue extensions)
            const observer = new MutationObserver(() => {
              if (document.documentElement.style.backgroundColor !== 'rgb(255, 255, 255)' && 
                  document.documentElement.style.backgroundColor !== '#ffffff' &&
                  document.documentElement.style.backgroundColor !== '') {
                 console.warn('[CACHE-FIX] Background was changed, re-enforcing white');
                 enforceWhite();
              }
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
            observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
          }

          if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Service Worker - unregister in dev to prevent caching issues
            if (${process.env.NODE_ENV === "development"}) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  console.log('[CACHE-FIX] Unregistering service worker in dev mode:', registration);
                  registration.unregister();
                }
              });
            } else {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => {
                  console.error('Service Worker registration failed:', err);
                });
              });
            }
          }
        `}
        </Script>
        <style
          dangerouslySetInnerHTML={{
            __html: `
        html, body, #__next {
          background-color: #ffffff !important;
          color: #1a1a1a !important;
          color-scheme: light !important;
        }
        :root {
          --color-background: #ffffff !important;
          --color-background-secondary: #ffffff !important;
        }
      `,
          }}
        />
      </body>
    </html>
  );
}
