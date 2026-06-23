# Ad Supply Launch Plan

Last updated: 2026-06-23

Use this only for private dealer prep until the user explicitly approves outreach copy/sending.

## Brands / Models Decision

Decision:
- Do not buy JATO for launch.
- Use the current Autobazar123 brands/models taxonomy as the launch source of truth.
- Accept dealer/seller-provided brand/model values during intake, then manually normalize anything missing before publishing/importing.

Why this is the cheapest acceptable plan:
- The current environment already has 20 brands and 207 models.
- Launch risk is low inventory, not deep trim/spec coverage.
- Manual normalization is cheaper and safer than paying for a premium catalog before dealer demand is proven.
- Rare missing models can be added case-by-case from dealer-provided evidence.

External data posture:
- NHTSA vPIC is official and free, but it is U.S. manufacturer/VIN data, so use it only as a sanity check, not as the Slovak/EU canonical taxonomy.
- CarAPI is cheap compared with enterprise catalogs, but its own FAQ says vehicle data is for cars sold in the United States, so it is not the launch canonical source.
- Auto-Data.net has stronger European coverage claims, but pricing is quote-based; evaluate it only after real dealer demand proves the need.

Reference links:
- https://vpic.nhtsa.dot.gov/
- https://vpic.nhtsa.dot.gov/api/Home/Index
- https://carapi.app/pricing
- https://api.auto-data.net/

## First Dealer Push

Offer:
- Free initial ad upload.
- No card required for the first batch.
- Dealer sends inventory by CSV, JSON, XML, website link, or exported listing sheet.
- Autobazar123 converts, reviews, uploads, and normalizes the ads manually at the start.

Rules:
- No fake inventory.
- No scraping or reposting without dealer permission.
- Publish only ads the dealer confirms are available.
- Do not send outreach until the owner approves the exact copy and sending.

Target list for the first push:
- 3 smaller southeast/east-south Slovakia used-car dealers with visible online inventory.
- Prioritize Trebisov, Michalovce, Roznava, Rimavska Sobota, and nearby areas.
- Prefer dealers with active stock and clear phone/email contact.
- Status: first batch is researched only; no outreach has been sent.

Prepared first batch:

| Priority | Dealer | City/area | Contact path | Source |
| --- | --- | --- | --- | --- |
| 1 | STM Trade s.r.o. | Trebisov | `tomas@stmtrade.sk`, `+421 949 703 000` | `https://stmtrade.sk/ponuka-vozidiel/` |
| 2 | AUTOJARO s.r.o. / Kup si auto | Michalovce | `info@kupsiauto.sk`, `+421 903 366 266` | `https://kupsiauto.sk/` |
| 3 | Autobazar DUVIN | Trebisov | `0918 541 112`; email candidate `duvin89@gmail.com` must be reverified before use | `https://duvin-s-r-o.autobazar.sk/` |

Before sending:
- Re-open each source URL and verify the contact is still visible.
- Prefer email where clear; use phone/contact form only when email is hidden.
- Send no public outreach until the user approves the exact outreach copy and sending.

Inventory intake assets:
- Import pack: `docs/dealer-import/README.md`.
- Empty CSV template: `docs/dealer-import/autobazar123-import-template.csv`.
- Filled examples: `docs/dealer-import/autobazar123-import-example.csv`, `.json`, `.xml`.
- Internal converter: `node tools/dealer-import-converter.mjs --input <dealer-file> --output <clean.csv> --report <report.json>`.
- Tracking sheet: `docs/dealer-import/dealer-intake-tracker.csv`.
- First proof page checklist: `docs/dealer-import/first-proof-page-checklist.md`.

Minimum intake fields:
- Dealer name, city, phone, email, website, ICO if available.
- Vehicle brand, model, year, price, mileage, fuel, transmission, body type, photos, contact phone.
- VIN optional but useful for validation.
- Dealer confirmation that Autobazar123 may publish the listings.

## Outreach Message

Subject: Bezplatne nahratie aut na Autobazar123

Dobry den,

spustame Autobazar123 a hladame prvych overenych predajcov. Na start vam vieme bezplatne nahrat auta na portal, bez karty a bez poplatku.

Ak mate zaujem, staci poslat odkaz na vas aktualny sklad, CSV/export alebo zoznam aut s fotkami. Prve inzeraty pripravime my a pred zverejnenim vam ich dame na kontrolu.

Dakujem,
Autobazar123

## Launch Sequence

1. Finish the public-launch plan in `PROJECT_STATUS.md`.
2. User approves opening the site.
3. Verify production health and maintenance bypass one last time.
4. Open the site.
5. Contact first 3 dealers after separate outreach approval.
6. Upload first consenting dealer inventory manually.
7. Track replies, uploaded ads, approved ads, inquiries, and dealer feedback.

## Success Target For First Push

- 1 dealer reply.
- 1 consenting dealer.
- 10-20 real active dealer ads uploaded.
- No fake or stale listings.
