# Slovak Diacritics Check

Use this checker to detect likely Slovak UI text missing diacritics.

## Command

```bash
npm run check:sk-diacritics
```

The command scans `src` by default and exits with code `1` when findings exist.

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
- Extend `scripts/slovak-diacritics-dictionary.json` when new Slovak wording appears.
