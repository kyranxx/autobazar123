"use client";

import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

const CookieBanner = dynamic(() => import("@/components/CookieBanner"), {
  ssr: false,
});
const GoogleOneTap = dynamic(() => import("@/components/GoogleOneTap"), {
  ssr: false,
});
const WebVitalsReporter = dynamic(
  () => import("@/components/monitoring/WebVitalsReporter"),
  { ssr: false },
);

interface AppProvidersProps {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  timeZone: string;
}

export default function AppProviders({
  children,
  locale,
  messages,
  timeZone,
}: AppProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
    >
      <AuthProvider>
        {children}
        <WebVitalsReporter />
        <GoogleOneTap />
        <CookieBanner />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          expand
          visibleToasts={5}
          toastOptions={{
            duration: 4000,
            className: "font-sans sonner-toast-card",
          }}
        />
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
