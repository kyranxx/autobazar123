import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("admin route shell", () => {
  it("keeps public website chrome out of the root layout internals", () => {
    const rootLayoutSource = readSource("src/app/layout.tsx");

    expect(rootLayoutSource).not.toContain('from "@/components/TopBanner"');
    expect(rootLayoutSource).not.toContain('from "@/components/Navbar"');
    expect(rootLayoutSource).not.toContain('from "@/components/Footer"');
    expect(rootLayoutSource).not.toContain('from "@/components/AppChrome"');
  });

  it("keeps public website chrome in the server site layout", () => {
    const siteLayoutSource = readSource("src/app/(site)/layout.tsx");
    const adminLayoutSource = readSource("src/app/admin/layout.tsx");
    const publicChromeSource = readSource("src/components/PublicChrome.tsx");

    expect(siteLayoutSource).toContain('from "@/components/PublicChrome"');
    expect(publicChromeSource).toContain('from "@/components/TopBanner"');
    expect(publicChromeSource).toContain('from "@/components/Navbar"');
    expect(publicChromeSource).toContain('from "@/components/Footer"');
    expect(publicChromeSource).toContain("currentYear");
    expect(publicChromeSource).not.toContain('"use client"');
    expect(publicChromeSource).not.toContain("usePathname");
    expect(adminLayoutSource).not.toContain('from "@/components/TopBanner"');
    expect(adminLayoutSource).not.toContain('from "@/components/Navbar"');
    expect(adminLayoutSource).not.toContain('from "@/components/Footer"');
    expect(existsSync("src/components/AppChrome.tsx")).toBe(false);
  });

  it("keeps top-level public routes inside public chrome", () => {
    const publicShellFiles = [
      "src/app/page.tsx",
      "src/app/auth/layout.tsx",
      "src/app/maintenance/layout.tsx",
      "src/app/moje-inzeraty/layout.tsx",
      "src/app/site-map/layout.tsx",
      "src/app/spravy/layout.tsx",
      "src/app/ulozene/layout.tsx",
      "src/app/zmluva/layout.tsx",
    ];

    for (const file of publicShellFiles) {
      expect(readSource(file), file).toContain('from "@/components/PublicChrome"');
    }
  });

  it("serves admin from its own route tree", () => {
    expect(existsSync("src/app/admin/page.tsx")).toBe(true);
    expect(existsSync("src/app/(site)/admin/page.tsx")).toBe(false);
  });

  it("uses real admin pages instead of query-tab navigation", () => {
    const expectedPages = [
      "today",
      "users",
      "ads",
      "money",
      "traffic",
      "emails",
      "technical",
      "settings",
    ];

    for (const page of expectedPages) {
      expect(existsSync(`src/app/admin/${page}/page.tsx`)).toBe(true);
    }

    const dashboardClientSource = readSource("src/app/admin/AdminDashboardClient.tsx");
    expect(dashboardClientSource).toContain("/admin/today");
    expect(dashboardClientSource).not.toContain("/admin?");
  });

  it("uses a simple owner-first today screen", () => {
    const dashboardClientSource = readSource("src/app/admin/AdminDashboardClient.tsx");
    const todaySource = readSource("src/app/admin/components/AdminToday.tsx");

    expect(dashboardClientSource).toContain("AdminToday");
    expect(todaySource).toContain("Čo treba riešiť dnes");
    expect(todaySource).toContain("Najdôležitejšie čísla");
    expect(todaySource).not.toContain("Zakladateľský dashboard");
  });

  it("makes the first admin screen bilingual for the owner/investor toggle", () => {
    const todaySource = readSource("src/app/admin/components/AdminToday.tsx");

    expect(todaySource).toContain("useLocale");
    expect(todaySource).toContain("ADMIN_TODAY_COPY");
    expect(todaySource).toContain("getAdminTodayLocale");
    expect(todaySource).toContain("What needs attention today");
    expect(todaySource).toContain("Tasks first, then numbers");
    expect(todaySource).toContain("Users, listings, and money");
    expect(todaySource).toContain("Check technical alerts");
    expect(todaySource).toContain("Admin");
  });

  it("keeps user blocking as a real reversible admin action", () => {
    const usersSource = readSource("src/app/admin/components/AdminUsers.tsx");

    expect(usersSource).toContain("unbanUser");
    expect(usersSource).toContain("Odblokovať");
    expect(usersSource).toContain("currentUser?.id !== userData.id");
  });

  it("keeps manual user create and delete wired to real admin actions", () => {
    const usersSource = readSource("src/app/admin/components/AdminUsers.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");

    expect(usersSource).toContain("createAdminUser");
    expect(usersSource).toContain("deleteAdminUser");
    expect(usersSource).toContain("Vytvoriť používateľa");
    expect(usersSource).toContain("Vymazať");
    expect(usersSource).toContain("nastavenie hesla");
    expect(actionsSource).toContain("auth.admin.createUser");
    expect(actionsSource).toContain("auth.admin.deleteUser");
  });

  it("keeps safe user impersonation explicit and audited", () => {
    const usersSource = readSource("src/app/admin/components/AdminUsers.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");

    expect(usersSource).toContain("createAdminUserImpersonationLink");
    expect(usersSource).toContain("Prihlásiť ako");
    expect(usersSource).toContain("Otvoriť odkaz");
    expect(actionsSource).toContain("createAdminUserImpersonationLink");
    expect(actionsSource).toContain('type: "magiclink"');
    expect(actionsSource).toContain("create_user_impersonation_link");
    expect(actionsSource).toContain("requireMfa: true");
  });

  it("keeps user open and edit wired to a real audited admin action", () => {
    const usersSource = readSource("src/app/admin/components/AdminUsers.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");

    expect(usersSource).toContain("updateAdminUser");
    expect(usersSource).toContain("Upraviť používateľa");
    expect(usersSource).toContain("Uložiť zmeny");
    expect(actionsSource).toContain("updateAdminUser");
    expect(actionsSource).toContain("auth.admin.updateUserById");
    expect(actionsSource).toContain("update_user");
    expect(actionsSource).toContain("requireMfa: true");
  });

  it("makes user admin bilingual for owner and investor review", () => {
    const usersSource = readSource("src/app/admin/components/AdminUsers.tsx");

    expect(usersSource).toContain("useLocale");
    expect(usersSource).toContain("ADMIN_USERS_COPY");
    expect(usersSource).toContain("getAdminUsersLocale");
    expect(usersSource).toContain("Users and dealers");
    expect(usersSource).toContain("Create user");
    expect(usersSource).toContain("Open as user");
    expect(usersSource).toContain("Private window recommended");
    expect(usersSource).toContain("Password setup email");
    expect(usersSource).toContain("Delete user");
  });

  it("uses an ads workbench instead of only a moderation queue", () => {
    const dashboardClientSource = readSource("src/app/admin/AdminDashboardClient.tsx");
    const adsSource = readSource("src/app/admin/components/AdminAds.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");

    expect(dashboardClientSource).toContain("AdminAds");
    expect(adsSource).toContain("Všetky inzeráty");
    expect(adsSource).toContain("getAdminListings");
    expect(adsSource).toContain("createAdminListingForUser");
    expect(adsSource).toContain("updateAdminListing");
    expect(adsSource).toContain("bulkUpdateAdminListings");
    expect(adsSource).toContain("Vytvoriť inzerát");
    expect(adsSource).toContain("Upraviť");
    expect(adsSource).toContain("Hromadná zmena");
    expect(actionsSource).toContain("createAdminListingForUser");
    expect(actionsSource).toContain("updateAdminListing");
    expect(actionsSource).toContain("bulkUpdateAdminListings");
  });

  it("makes the ads workbench bilingual for owner and investor review", () => {
    const adsSource = readSource("src/app/admin/components/AdminAds.tsx");

    expect(adsSource).toContain("useLocale");
    expect(adsSource).toContain("ADMIN_ADS_COPY");
    expect(adsSource).toContain("getAdminAdsLocale");
    expect(adsSource).toContain("Listings");
    expect(adsSource).toContain("All listings");
    expect(adsSource).toContain("Create listing");
    expect(adsSource).toContain("Bulk edit");
    expect(adsSource).toContain("Create draft");
    expect(adsSource).toContain("Edit listing");
    expect(adsSource).toContain("Open listing");
    expect(adsSource).toContain("Manual ad creation");
  });

  it("shows real billing transactions and avoids manual invoice creation", () => {
    const revenueSource = readSource("src/app/admin/components/AdminRevenue.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");

    expect(revenueSource).toContain("getBillingTransactions");
    expect(revenueSource).toContain("Faktúry a platby");
    expect(revenueSource).toContain("Refundy");
    expect(revenueSource).toContain("Refundy zatiaľ nerobíme z adminu");
    expect(revenueSource).toContain("otvor Stripe");
    expect(revenueSource).not.toContain("Vytvoriť faktúru");
    expect(revenueSource).not.toContain("Vytvoriť refund");
    expect(actionsSource).toContain('from("billing_transactions")');
  });

  it("makes revenue bilingual without adding manual invoice or refund creation", () => {
    const revenueSource = readSource("src/app/admin/components/AdminRevenue.tsx");

    expect(revenueSource).toContain("useLocale");
    expect(revenueSource).toContain("ADMIN_REVENUE_COPY");
    expect(revenueSource).toContain("getAdminRevenueLocale");
    expect(revenueSource).toContain("Invoices and payments");
    expect(revenueSource).toContain("Real payments saved after Stripe webhooks");
    expect(revenueSource).toContain("Refunds");
    expect(revenueSource).toContain("We do not create refunds from admin yet");
    expect(revenueSource).toContain("Open Stripe payments");
    expect(revenueSource).toContain("Payment questions");
    expect(revenueSource).not.toContain("Create invoice");
    expect(revenueSource).not.toContain("Create refund");
  });

  it("keeps email admin wording clear and tied to the real provider", () => {
    const emailsSource = readSource("src/app/admin/components/AdminEmails.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");
    const missingRecipientAccent = ["Prij", "emca"].join("");
    const missingPreviewAccent = ["ukaz", "ka"].join("");

    expect(emailsSource).toContain("Resend");
    expect(emailsSource).toContain("Náhľady e-mailov");
    expect(emailsSource).toContain("EmailSummaryCards");
    expect(emailsSource).toContain("Odoslané spolu");
    expect(emailsSource).toContain("Chybné");
    expect(emailsSource).toContain("EMAIL_TYPE_LABELS");
    expect(emailsSource).toContain("friendlyEmailType");
    expect(emailsSource).toContain("Názov e-mailu");
    expect(emailsSource).toContain("Resend e-maily odosiela");
    expect(emailsSource).toContain("Vzhľad meníme v šablónach aplikácie");
    expect(actionsSource).toContain("renderModerationDecisionEmail");
    expect(actionsSource).toContain("renderSavedSearchAlertEmail");
    expect(actionsSource).toContain("renderSavedAdAlertEmail");
    expect(emailsSource).not.toContain(missingRecipientAccent);
    expect(emailsSource).not.toContain(missingPreviewAccent);
  });

  it("makes the email admin page genuinely bilingual for the owner/investor toggle", () => {
    const emailsSource = readSource("src/app/admin/components/AdminEmails.tsx");

    expect(emailsSource).toContain("useLocale");
    expect(emailsSource).toContain("ADMIN_EMAIL_COPY");
    expect(emailsSource).toContain("getAdminEmailLocale");
    expect(emailsSource).toContain("EmailSummaryCards");
    expect(emailsSource).toContain("Sent emails");
    expect(emailsSource).toContain("Email name");
    expect(emailsSource).toContain("Resend sends the emails");
    expect(emailsSource).toContain("Actual customer emails stay Slovak");
  });

  it("keeps feature flags honest about what is connected in code", () => {
    const flagsSource = readSource("src/app/admin/components/AdminFeatureFlags.tsx");
    const skMessages = readSource("src/i18n/messages/sk.json");

    expect(flagsSource).toContain("CONNECTED_FEATURE_FLAGS");
    expect(flagsSource).toContain("isFlagConnected");
    expect(flagsSource).toContain("toggleDisabledReason");
    expect(flagsSource).not.toContain("createFeatureFlag");
    expect(flagsSource).not.toContain("setCreateModalOpen");
    expect(skMessages).toContain("Prepínače funkcií");
    expect(skMessages).toContain("Nie je napojené");
    expect(skMessages).not.toContain('"pageTitle": "Feature Flags"');
  });

  it("explains old feature flags in owner-friendly Slovak and investor English", () => {
    const flagsSource = readSource("src/app/admin/components/AdminFeatureFlags.tsx");

    expect(flagsSource).toContain("FEATURE_FLAG_LABELS");
    expect(flagsSource).toContain("getFlagTitle(flag, locale)");
    expect(flagsSource).toContain("getFlagDescription(flag, locale)");
    expect(flagsSource).toContain("ai_recommendations");
    expect(flagsSource).toContain("AI odporúčania");
    expect(flagsSource).toContain("AI recommendations");
    expect(flagsSource).toContain("Nové vyhľadávanie");
    expect(flagsSource).toContain("New search interface");
    expect(flagsSource).toContain("Uložené: zapnuté");
    expect(flagsSource).toContain("Stored: on");
    expect(flagsSource).toContain("Na webe nič nemení");
    expect(flagsSource).toContain("Does not change the website");
  });

  it("uses simple Slovak wording for technical checks", () => {
    const qualitySource = readSource("src/app/admin/components/AdminQualityGates.tsx");
    const technicalSource = readSource("src/app/admin/components/AdminTechnical.tsx");
    const logsSource = readSource("src/app/admin/components/AdminLogs.tsx");
    const performanceWorkflow = readSource(".github/workflows/performance-budget-gate.yml");

    expect(qualitySource).toContain("Kontroly webu");
    expect(qualitySource).toContain("Obnoviť stav");
    expect(qualitySource).toContain("Spustiť kontroly");
    expect(qualitySource).toContain("Čo sa kontroluje");
    expect(qualitySource).toContain("Prístupnosť a ovládanie");
    expect(qualitySource).toContain("Rýchlosť a rozbité stránky");
    expect(qualitySource).toContain("Beží každú noc");
    expect(qualitySource).toContain("Email upozornenie");
    expect(qualitySource).toContain("Detaily chyby otvoríš v GitHube");
    expect(qualitySource).not.toContain("accessibility-quality-gate.yml");
    expect(qualitySource).not.toContain("performance-budget-gate.yml");
    expect(qualitySource).toContain('method: "POST"');
    expect(qualitySource).not.toContain("Quality Gates");
    expect(performanceWorkflow).toContain('cron: "30 2 * * *"');
    expect(technicalSource).toContain("Technické zdravie");
    expect(technicalSource).toContain("Kontroly");
    expect(technicalSource).toContain("Prepínače");
    expect(technicalSource).toContain("Udalosti");
    expect(technicalSource).toContain("Prvá pomoc");
    expect(technicalSource).toContain("Funkcie zapínajte iba vtedy, keď sú napojené v kóde");
    expect(technicalSource).toContain("Logy slúžia najmä na hľadanie opakovaných problémov");
    expect(technicalSource).toContain("TabsTrigger");
    expect(technicalSource).not.toContain("<details");
    expect(technicalSource).not.toContain("<summary");
    expect(logsSource).toContain("Technické udalosti");
    expect(logsSource).toContain("Zmeny v adminovi");
    expect(logsSource).toContain("Náhradný postup");
    expect(logsSource).toContain("Nie každý fallback je problém");
    expect(logsSource).toContain("update_feature_flag");
    expect(logsSource).toContain("clear_admin_cache");
    expect(logsSource).toContain("sync_search_index");
    expect(logsSource).toContain("run_cron_job");
    expect(logsSource).toContain("Čas");
    expect(logsSource).not.toContain("Cas");
    expect(logsSource).not.toContain("Audit log");
    expect(logsSource).not.toContain("Systémové logy");
  });

  it("makes the technical admin area bilingual for the owner/investor toggle", () => {
    const technicalSource = readSource("src/app/admin/components/AdminTechnical.tsx");
    const logsSource = readSource("src/app/admin/components/AdminLogs.tsx");

    expect(technicalSource).toContain("useLocale");
    expect(technicalSource).toContain("ADMIN_TECHNICAL_COPY");
    expect(technicalSource).toContain("getAdminTechnicalLocale");
    expect(technicalSource).toContain("Technical health");
    expect(technicalSource).toContain("Website checks");
    expect(technicalSource).toContain("Feature switches");
    expect(technicalSource).toContain("Events");
    expect(logsSource).toContain("useLocale");
    expect(logsSource).toContain("ADMIN_LOGS_COPY");
    expect(logsSource).toContain("getAdminLogsLocale");
    expect(logsSource).toContain("Technical events");
    expect(logsSource).toContain("Admin changes");
    expect(logsSource).toContain("Safe fallback used");
    expect(logsSource).toContain("Not every fallback means an issue");
    expect(logsSource).toContain("Copy JSON");
  });

  it("makes quality checks bilingual for the owner/investor toggle", () => {
    const qualitySource = readSource("src/app/admin/components/AdminQualityGates.tsx");

    expect(qualitySource).toContain("useLocale");
    expect(qualitySource).toContain("ADMIN_QUALITY_GATES_COPY");
    expect(qualitySource).toContain("getAdminQualityGatesLocale");
    expect(qualitySource).toContain("Website checks");
    expect(qualitySource).toContain("Refresh status");
    expect(qualitySource).toContain("Run checks now");
    expect(qualitySource).toContain("What is checked");
    expect(qualitySource).toContain("Accessibility and controls");
    expect(qualitySource).toContain("Speed and broken pages");
    expect(qualitySource).toContain("Runs every night");
    expect(qualitySource).toContain("Email alerts");
    expect(qualitySource).toContain("Open failed run");
    expect(qualitySource).toContain("Open run details");
  });

  it("keeps settings system actions honest and owner-friendly", () => {
    const settingsSource = readSource("src/app/admin/components/AdminSettings.tsx");
    const actionsSource = readSource("src/app/admin/actions.ts");

    expect(settingsSource).toContain("Crony bežia automaticky");
    expect(settingsSource).toContain("Spustiť ručne");
    expect(settingsSource).toContain("Obnoviť cache stránok");
    expect(settingsSource).toContain("Reindexovať Algoliu");
    expect(settingsSource).toContain("clearAdminCache");
    expect(settingsSource).toContain("syncAdminSearchIndex");
    expect(settingsSource).toContain("runAdminCronJob");
    expect(settingsSource).not.toContain("Pridať nastavenie");
    expect(settingsSource).not.toContain("toast.success(\"Cache vymazaná\")");
    expect(settingsSource).not.toContain("toast.success(\"Cron joby spustené\")");
    expect(actionsSource).toContain("clear_admin_cache");
    expect(actionsSource).toContain("sync_search_index");
    expect(actionsSource).toContain("run_cron_job");
  });

  it("keeps settings pricing copy owner-friendly and bilingual", () => {
    const settingsSource = readSource("src/app/admin/components/AdminSettings.tsx");

    expect(settingsSource).toContain("useLocale");
    expect(settingsSource).toContain("ADMIN_SETTINGS_COPY");
    expect(settingsSource).toContain("getAdminSettingsLocale");
    expect(settingsSource).toContain("Launch - otvorenie trhu");
    expect(settingsSource).toContain("Growth - rast trhu");
    expect(settingsSource).toContain("Market launch");
    expect(settingsSource).toContain("Cena Basic");
    expect(settingsSource).toContain("Basic price");
    expect(settingsSource).toContain("Cena v EUR");
    expect(settingsSource).toContain("Price in EUR");
    expect(settingsSource).not.toContain("Basic (centy)");
    expect(settingsSource).not.toContain("<option value=\"launch\">launch</option>");
  });

  it("uses inline dealer rejection notes instead of browser prompts", () => {
    const settingsSource = readSource("src/app/admin/components/AdminSettings.tsx");

    expect(settingsSource).toContain("rejectionNoteById");
    expect(settingsSource).toContain("Poznámka pre dealera");
    expect(settingsSource).toContain("Dealer note");
    expect(settingsSource).toContain("Zamietnuť s poznámkou");
    expect(settingsSource).not.toContain("window.prompt");
  });

  it("uses analytics as a simple traffic and SEO doorway instead of raw tracking jargon", () => {
    const analyticsSource = readSource("src/app/admin/components/AdminAnalytics.tsx");

    expect(analyticsSource).toContain("Návštevnosť a SEO");
    expect(analyticsSource).toContain("Na čo je táto stránka");
    expect(analyticsSource).toContain("Otvoriť GA4");
    expect(analyticsSource).toContain("Otvoriť Search Console");
    expect(analyticsSource).toContain("Čo ľudia robili na webe");
    expect(analyticsSource).toContain("Čo hľadali na úvodnej stránke");
    expect(analyticsSource).toContain("Tieto čísla nenahrádzajú GA4");
    expect(analyticsSource).not.toContain("Rozpad udalostí");
    expect(analyticsSource).not.toContain("Posledné záznamy trackingu");
    expect(analyticsSource).not.toContain("Live-ish");
  });

  it("makes analytics bilingual for the owner/investor toggle", () => {
    const analyticsSource = readSource("src/app/admin/components/AdminAnalytics.tsx");

    expect(analyticsSource).toContain("useLocale");
    expect(analyticsSource).toContain("ADMIN_ANALYTICS_COPY");
    expect(analyticsSource).toContain("getAdminAnalyticsLocale");
    expect(analyticsSource).toContain("Traffic and SEO");
    expect(analyticsSource).toContain("Why this page exists");
    expect(analyticsSource).toContain("Open GA4");
    expect(analyticsSource).toContain("Open Search Console");
    expect(analyticsSource).toContain("What people searched on the homepage");
    expect(analyticsSource).toContain("What people did on the website");
    expect(analyticsSource).toContain("These numbers do not replace GA4");
  });
});
