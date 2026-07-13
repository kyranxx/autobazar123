import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { INTERNAL_MARKET_HEADER } from "@/config/markets";
import { resolveRequestLocaleSettings } from "./request-locale";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const headersList = await headers();
  const { locale, timeZone } = resolveRequestLocaleSettings({
    localeCookie,
    acceptLanguage: headersList.get("accept-language"),
    host: headersList.get("x-forwarded-host") || headersList.get("host"),
    marketCode: headersList.get(INTERNAL_MARKET_HEADER),
  });

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone,
  };
});
