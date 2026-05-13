export const COMPANY_INFO = {
  legalName: "Apollo Tech s. r. o.",
  infoEmail: "info@autobazar123.sk",
  supportEmail: "support@autobazar123.sk",
  privacyEmail: "gdpr@autobazar123.sk",
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
