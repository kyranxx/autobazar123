import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import CookieBanner from "@/components/CookieBanner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
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
        {/* Microsoft Clarity Analytics - loaded after hydration for better performance */}
        <Script
          id="clarity-analytics"
          strategy="afterInteractive"
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
