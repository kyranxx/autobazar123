const SK_DATE_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  timeZone: "Europe/Bratislava",
});

const SK_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Bratislava",
});

export function formatSkDate(value: string | number | Date): string {
  return SK_DATE_FORMATTER.format(new Date(value));
}

export function formatSkDateTime(value: string | number | Date): string {
  return SK_DATE_TIME_FORMATTER.format(new Date(value));
}

export function formatSkYear(value: string | number | Date): string {
  return String(new Date(value).getFullYear());
}
