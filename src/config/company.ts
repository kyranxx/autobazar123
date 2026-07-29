export const COMPANY_INFO = {
  legalName: "Apollo Tech s. r. o.",
  infoEmail: "info@autoninja.sk",
  supportEmail: "support@autoninja.sk",
  privacyEmail: "gdpr@autoninja.sk",
  phoneDisplay: "+421 900 123 456",
  phoneHref: "+421900123456",
  streetAddress: "Karpatské námestie 10A",
  postalCode: "831 06",
  city: "Bratislava - mestská časť Rača",
  country: "Slovensko",
} as const;
export const COMPANY_POSTAL_ADDRESS_LINES = [
  COMPANY_INFO.streetAddress,
  `${COMPANY_INFO.postalCode} ${COMPANY_INFO.city}`,
  COMPANY_INFO.country,
] as const;

export const PUBLIC_CONTACT_BY_MARKET = Object.fromEntries(
  Object.entries(MARKET_CONFIGS).map(([marketCode, market]) => [
    marketCode,
    market.contact,
  ]),
) as Record<MarketCode, (typeof MARKET_CONFIGS)[MarketCode]["contact"]>;
import { MARKET_CONFIGS, type MarketCode } from "@/config/markets";
