"use client";

import { useLocale } from "next-intl";
import { AdminFeatureFlags } from "./AdminFeatureFlags";
import { AdminLogs } from "./AdminLogs";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/shadcn/tabs";

type AdminTechnicalLocale = "sk" | "en";

type AdminTechnicalCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  flagsTitle: string;
  flagsText: string;
  eventsTitle: string;
  eventsText: string;
};

const ADMIN_TECHNICAL_COPY: Record<AdminTechnicalLocale, AdminTechnicalCopy> = {
  sk: {
    eyebrow: "Technické",
    title: "Technické zdravie",
    subtitle: "Prepínače funkcií a systémové udalosti na jednom mieste.",
    flagsTitle: "Prepínače",
    flagsText: "Funkcie zapínajte iba vtedy, keď sú napojené v kóde.",
    eventsTitle: "Udalosti",
    eventsText: "Logy slúžia najmä na hľadanie opakovaných problémov.",
  },
  en: {
    eyebrow: "Technical",
    title: "Technical health",
    subtitle: "Feature switches and system events in one place.",
    flagsTitle: "Feature switches",
    flagsText: "Only turn features on when they are connected in code.",
    eventsTitle: "Events",
    eventsText: "Logs are mainly for finding repeated problems.",
  },
};

function getAdminTechnicalLocale(locale: string): AdminTechnicalLocale {
  return locale === "en" ? "en" : "sk";
}

function TechnicalHelpCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background-secondary p-4">
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-sm text-text-secondary">{text}</p>
    </div>
  );
}

export function AdminTechnical() {
  const copy = ADMIN_TECHNICAL_COPY[getAdminTechnicalLocale(useLocale())];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-text-primary">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          {copy.subtitle}
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <TechnicalHelpCard
          title={copy.flagsTitle}
          text={copy.flagsText}
        />
        <TechnicalHelpCard
          title={copy.eventsTitle}
          text={copy.eventsText}
        />
      </div>

      <Tabs defaultValue="flags" className="space-y-5">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          <TabsTrigger
            value="flags"
            className="h-10 rounded-lg border border-border-subtle bg-surface px-4 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            {copy.flagsTitle}
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="h-10 rounded-lg border border-border-subtle bg-surface px-4 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            {copy.eventsTitle}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flags">
          <AdminFeatureFlags />
        </TabsContent>
        <TabsContent value="events">
          <AdminLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
