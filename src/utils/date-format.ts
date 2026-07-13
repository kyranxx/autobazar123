const SK_DATE_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  timeZone: "Europe/Bratislava",
});

const SK_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Bratislava",
});

function getLocalizedDateFormatter(locale: string, includeTime: boolean): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    ...(includeTime ? { dateStyle: "medium" as const, timeStyle: "short" as const } : {}),
    timeZone: locale.toLowerCase().startsWith("ro") ? "Europe/Bucharest" : "Europe/Bratislava",
  });
}

export function formatSkDate(value: string | number | Date): string {
  return SK_DATE_FORMATTER.format(new Date(value));
}

export function formatSkDateTime(value: string | number | Date): string {
  return SK_DATE_TIME_FORMATTER.format(new Date(value));
}

export function formatLocalizedDateTime(
  value: string | number | Date,
  locale = "sk-SK",
): string {
  if (locale === "sk-SK") {
    return formatSkDateTime(value);
  }

  return getLocalizedDateFormatter(locale, true).format(new Date(value));
}

export function formatSkYear(value: string | number | Date): string {
  return String(new Date(value).getFullYear());
}
