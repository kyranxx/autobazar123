import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import CookieBanner from "@/components/CookieBanner";
import GoogleOneTap from "@/components/GoogleOneTap";
import { Outfit } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import Script from "next/script";
import { BRAND_NAME, BRAND_URL } from "@/config/brand";

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
        <link
          rel="preconnect"
          href="https://imagedelivery.net"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://imagedelivery.net" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className="font-sans antialiased min-h-screen bg-white"
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
            <div id="main-content" className="scroll-landmark">
              {children}
            </div>
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
      </body>
    </html>
  );
}
