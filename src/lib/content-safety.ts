const RISK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(whatsapp|telegram|signal)\b/i,
    reason: "Avoid moving buyers to unverified external chat channels.",
  },
  {
    pattern: /\b(advance payment|deposit first|send money first)\b/i,
    reason: "Requests for payment before inspection reduce buyer trust.",
  },
  {
    pattern: /\b(click here|bit\.ly|tinyurl|shorturl)\b/i,
    reason: "Shortened or generic links can look suspicious.",
  },
];

export function detectPotentialContentIssues(content: string): string[] {
  if (!content.trim()) return [];

  return RISK_PATTERNS.filter((entry) => entry.pattern.test(content)).map(
    (entry) => entry.reason,
  );
}
