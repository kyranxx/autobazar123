# Dealer Import Pack

Purpose: make first dealer onboarding fast without trusting automatic publishing.

Use this flow:

1. Send the dealer `autobazar123-import-template.csv` when they ask for a format.
2. Accept what they already have: CSV, JSON, XML, Excel export copied to CSV, or a website stock link.
3. Run the local converter on their file.
4. Review the clean output and missing-field report.
5. Upload/publish only listings the dealer confirms are real and available.

Important:

- This pack is private prep. It does not contact dealers.
- The converter does not write to Supabase.
- The converter does not publish ads.
- Photo URLs are accepted as source URLs for intake. Before publishing through the current app flow, photos still need to be uploaded through the real image upload path.
- Brand/model text may need manual matching to the current Autobazar123 taxonomy.

Files:

- `autobazar123-import-template.csv`: empty template for dealers.
- `autobazar123-import-example.csv`: filled CSV example.
- `autobazar123-import-example.json`: filled JSON example.
- `autobazar123-import-example.xml`: filled XML example.
- `dealer-intake-tracker.csv`: simple CRM/status tracker.
- `first-proof-page-checklist.md`: what the first real dealer page must prove.

Converter command:

```powershell
node tools/dealer-import-converter.mjs --input docs/dealer-import/autobazar123-import-example.csv --output .tmp/dealer-import/clean.csv --report .tmp/dealer-import/report.json
```

Output statuses:

- `ready`: enough data for manual review/import prep.
- `needs_review`: missing required data or unrecognized values.
