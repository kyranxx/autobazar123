"use client";

import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import CookieBanner from "@/components/CookieBanner";
import GoogleOneTap from "@/components/GoogleOneTap";

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
