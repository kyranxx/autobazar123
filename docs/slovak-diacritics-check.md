# Slovak Diacritics Check

Use this checker to detect likely Slovak UI text missing diacritics.

## Check Command

```bash
npm run check:sk-diacritics
```

The command scans `src` by default and exits with code `1` when findings exist.

## Safe Autofix

```bash
npm run check:sk-diacritics:write
```

This rewrites matched text in place, then re-checks and fails only on unresolved findings.

## Custom Scope

```bash
node scripts/slovak-diacritics-check.mjs --path src --path docs
```

## Custom Dictionary

```bash
node scripts/slovak-diacritics-check.mjs --dictionary scripts/slovak-diacritics-dictionary.json
```

Dictionary format:

```json
{
  "sprava": "správa",
  "nacitat": "načítať"
}
```

## Notes

- For `.ts/.tsx/.js/.jsx`, the checker scans string literals only, so code identifiers are ignored.
- Route and URL slug fragments like `/moj-ucet` are ignored to reduce false positives.
- Extend `scripts/slovak-diacritics-dictionary.json` when new Slovak wording appears.
