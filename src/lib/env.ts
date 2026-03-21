export function getTrimmedEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\n+$/g, "")
    .trim();

  return normalized.length > 0 ? normalized : null;
}

export function hasTrimmedEnv(name: string): boolean {
  return getTrimmedEnv(name) !== null;
}
