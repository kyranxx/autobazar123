"use client";

import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import CookieBanner from "@/components/CookieBanner";
import GoogleOneTap from "@/components/GoogleOneTap";
import WebVitalsReporter from "@/components/monitoring/WebVitalsReporter";
import { AuthProvider } from "@/context/AuthContext";
import { IconWeightProvider } from "@/context/IconWeightContext";
import IconWeightSwitcher from "@/components/ui/IconWeightSwitcher";

const showIconWeightSwitcher =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_SHOW_ICON_WEIGHT_SWITCHER === "true";

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
  const pathname = usePathname();
  const showDevIconControls = showIconWeightSwitcher && pathname !== "/";

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
    >
      <IconWeightProvider>
        <AuthProvider>
          {children}
          {showDevIconControls ? <IconWeightSwitcher /> : null}
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
      </IconWeightProvider>
    </NextIntlClientProvider>
  );
}
