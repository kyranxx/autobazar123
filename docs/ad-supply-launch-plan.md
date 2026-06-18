# Ad Supply Launch Plan

Last updated: 2026-05-15

Use this only after the site is safe to open and the user explicitly agrees to open it.

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
- Dealer sends inventory by CSV, website link, or exported listing sheet.
- Autobazar123 uploads/normalizes the ads manually at the start.

Rules:
- No fake inventory.
- No scraping or reposting without dealer permission.
- Publish only ads the dealer confirms are available.
- Keep maintenance mode on until launch checks pass.

Target list for the first push:
- 10 small/medium Slovak used-car dealers with visible online inventory.
- Prioritize Bratislava, Trnava, Nitra, Zilina, Banska Bystrica, Kosice, Presov.
- Prefer dealers with at least 10 active cars and clear phone/email contact.

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

1. Finish launch blockers in `docs/launch-checklist.md`.
2. User approves opening the site.
3. Verify production health and maintenance bypass one last time.
4. Open the site.
5. Contact first 10 dealers.
6. Upload first consenting dealer inventory manually.
7. Track replies, uploaded ads, approved ads, inquiries, and dealer feedback.

## Success Target For First Push

- 3 dealer replies.
- 1 consenting dealer.
- 20 real active dealer ads uploaded.
- No fake or stale listings.
