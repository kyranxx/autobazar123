import type { CSSProperties } from "react";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLocale, getMessages, getTimeZone, getTranslations } from "next-intl/server";
import { Outfit } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import WebVitalsReporter from "@/components/monitoring/WebVitalsReporter";
import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";
import { BRAND_NAME, BRAND_URL } from "@/config/brand";
import { BRAND_THEME } from "@/lib/theme/brand";
import AppProviders from "./providers";

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
    { media: "(prefers-color-scheme: light)", color: BRAND_THEME.primaryForeground },
    { media: "(prefers-color-scheme: dark)", color: BRAND_THEME.primary },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  title: {
    default: `${BRAND_NAME} | Predaj áut a ojazdených vozidiel na Slovensku`,
    template: `%s | ${BRAND_NAME}`,
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
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  alternates: {
    canonical: BRAND_URL,
    languages: {
      sk: BRAND_URL,
      cs: BRAND_URL,
      hu: BRAND_URL,
      en: BRAND_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "sk_SK",
    alternateLocale: ["cs_CZ", "hu_HU", "en_US"],
    url: BRAND_URL,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} | Predaj áut a ojazdených vozidiel na Slovensku`,
    description:
      "Najväčší online autobazar na Slovensku. Tisíce overených inzerátov, ojazdené aj nové vozidlá.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Predaj áut na Slovensku`,
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

function resolvePreconnectOrigins(): string[] {
  const origins = new Set<string>(["https://imagedelivery.net"]);

  const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID?.trim().toLowerCase();
  if (algoliaAppId && /^[a-z0-9]+$/.test(algoliaAppId)) {
    origins.add(`https://${algoliaAppId}-dsn.algolia.net`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      origins.add(new URL(supabaseUrl).origin);
    } catch {
      // Ignore malformed env in local/dev; app can still render safely.
    }
  }

  return [...origins];
}

interface RootDocumentProps {
  children: React.ReactNode;
  preconnectOrigins: string[];
  appThemeVars: CSSProperties;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preconnectOrigins = resolvePreconnectOrigins();
  const appThemeVars = {
    "--color-border-focus": BRAND_THEME.primary,
    "--color-primary": BRAND_THEME.primary,
    "--color-primary-hover": BRAND_THEME.primaryHover,
    "--color-primary-foreground": BRAND_THEME.primaryForeground,
    "--color-accent": BRAND_THEME.accent,
    "--color-accent-hover": BRAND_THEME.accentHover,
    "--color-accent-foreground": BRAND_THEME.accentForeground,
    "--color-accent-subtle": BRAND_THEME.accentSubtle,
    "--color-digital": BRAND_THEME.primary,
  } as CSSProperties;

  return (
    <Suspense>
      <RootDocument
        preconnectOrigins={preconnectOrigins}
        appThemeVars={appThemeVars}
      >
        {children}
      </RootDocument>
    </Suspense>
  );
}

async function RootDocument({
  children,
  preconnectOrigins,
  appThemeVars,
}: RootDocumentProps) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();
  const tLayout = await getTranslations("layout");
  const currentYear = new Date().getUTCFullYear();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={outfit.variable}
    >
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script id="dev-sanitize-injected-attrs" strategy="beforeInteractive">
            {`
(function () {
  // Some browser extensions / security software injects attributes like:
  // - bis_register=...
  // - bis_skin_checked="1"
  // - __processed_<uuid>__="true"
  // These mutate the server-rendered HTML before React hydrates, triggering noisy
  // hydration mismatch errors in development. Strip only these known injected
  // attributes before hydration so real app hydration issues remain visible.
  var REMOVE_EXACT = { bis_register: true, bis_skin_checked: true };
  var REMOVE_PREFIXES = ["bis_", "__processed_"];

  function shouldRemove(name) {
    if (REMOVE_EXACT[name]) return true;
    for (var i = 0; i < REMOVE_PREFIXES.length; i++) {
      if (name.indexOf(REMOVE_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  function cleanElement(el) {
    if (!el || !el.getAttributeNames) return;
    var names = el.getAttributeNames();
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (shouldRemove(n)) {
        try {
          el.removeAttribute(n);
        } catch (e) {
          // ignore
        }
      }
    }
  }

  function cleanTree(root) {
    try {
      if (!root) return;
      cleanElement(root);
      if (!root.querySelectorAll) return;
      var all = root.querySelectorAll("*");
      for (var i = 0; i < all.length; i++) cleanElement(all[i]);
    } catch (e) {
      // ignore
    }
  }

  cleanTree(document.documentElement);

  try {
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === "attributes" && m.attributeName) {
          if (shouldRemove(m.attributeName)) {
            try {
              m.target.removeAttribute(m.attributeName);
            } catch (e) {
              // ignore
            }
          }
          continue;
        }
        if (m.type === "childList" && m.addedNodes) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var node = m.addedNodes[j];
            if (node && node.nodeType === 1) cleanTree(node);
          }
        }
      }
    });
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    // Disconnect after initial app boot to avoid doing extra work during dev.
    setTimeout(function () {
      try {
        obs.disconnect();
      } catch (e) {
        // ignore
      }
    }, 5000);
  } catch (e) {
    // ignore
  }
})();`}
          </Script>
        )}

        {/* Preconnect to critical third-party origins */}
        {preconnectOrigins.map((origin) => (
          <link
            key={`preconnect-${origin}`}
            rel="preconnect"
            href={origin}
            crossOrigin="anonymous"
          />
        ))}
        {preconnectOrigins.map((origin) => (
          <link key={`dns-prefetch-${origin}`} rel="dns-prefetch" href={origin} />
        ))}
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-white">
        <JsonLd />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-text-primary focus:text-white focus:text-sm focus:font-medium focus:rounded-md"
        >
          {tLayout("skipToContent")}
        </a>
        <AppProviders locale={locale} messages={messages} timeZone={timeZone}>
          <WebVitalsReporter />
          <div style={appThemeVars} className="flex min-h-screen flex-col">
            <TopBanner />
            <Navbar />
            <div id="main-content" className="scroll-landmark flex-1">
              {children}
            </div>
            <Footer currentYear={currentYear} />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
