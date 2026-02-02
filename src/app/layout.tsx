import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import CookieBanner from "@/components/CookieBanner";
import GoogleOneTap from "@/components/GoogleOneTap";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Preload Inter font - locally hosted */}
        <link
          rel="preload"
          href="/fonts/Inter-Variable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://imagedelivery.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        <link rel="preconnect" href="https://*.algolia.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://*.algolia.net" />
      </head>
      <body className="font-sans antialiased min-h-screen" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
