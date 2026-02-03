# Ultra-Detailed Redesign Plan: "Soul & Intuition"

## 1. Philosophy: The "Soul" of Autobazar123
Current state is "Luxury Monochrome" - stark, cold, premium but perhaps too sterile ($000000, $ffffff).
**Goal:** Create a digital environment that feels *human*, *trustworthy*, and *alive*. Selling a car is emotional; buying one is a journey. The site should feel like a handshake, not a terminal.

**Core Values:**
- **Warmth:** Use colors that aren't just #000 or #FFF. Soft off-whites, deep racing greens or warm navies, maybe subtle earthy accents.
- **Tactility:** Buttons should feel like they press. Cards should feel like physical objects.
- **Clarity > Minimalism:** Don't hide things for the sake of "clean lines". If a user needs to see "Manual Transmission", show it clearly, don't hide it in an icon that requires a hover.
- **Motion:** Not "flashy" motion, but respiratory motion. Things breathe.

---

## 2. Global Design System

### A. Color Palette
*Current:* Strict Monochrome.
*Critique:* Safe, generic luxury, cold.

**Approach 1: "Swiss Classic"**
- Deep Navy Blue (#0a192f) as primary.
- International Orange (#ff4500) as action/accent.
- Cream/Off-White (#fdfbf7) for background.
- *Feel:* Reliable, precise, slightly retro.

**Approach 2: "Modern Organic"**
- Forest Green (#1a3c2f) for trust/money.
- Sand/Beige (#e6e2d3) for backgrounds.
- Charcoal (#333) for text.
- *Feel:* Grounded, calm, expensive but approachable.

**Approach 3: "Techno-Warmth" (RECOMMENDED)**
- **Primary:** Deep Slate (#1e293b) - Softer than black, modern.
- **Background:** Porcelain (#f8fafc) - Not harsh white.
- **Accent:** Electric Indigo (#6366f1) but softened - for digital connectivity.
- **Soul Accent:** Burnt Sienna or Amber (#d97706) for "human" touches (warnings, calls to action).
- *Reasoning:* It keeps the modern tech feel but adds the warmth of Amber/Gold which suggests "value" and "sunlight".

### B. Typography
*Current:* Inter (Standard, good, but ubiquitous).
**Decision:** Keep **Inter** for UI/Body (readability is king for specs).
**Enhancement:** Introduce **"Playfair Display"** or **"Fraunces"** for Headings to add that "Soul" and editorial feel. It makes every car listing feel like a magazine feature.

### C. Spacing & Radius
- **Radius:** Move from `12px` to `16px` or `24px` for cards. Friendlier, less industrial.
- **Spacing:** Increase whitespace by 20%. Let the cars breathe.

---

## 3. Component Deep Dives

### Component: **The "Search" Bar** (The Heart of the App)
*Current:* Likely a standard input + dropdowns.

**Approach 1: The "Commander"**
- Giant input field: "I am looking for a..."
- Natural language processing.
- *Critique:* Too ambiguous. Users know what they want (brand/model). Hard to discover options.

**Approach 2: The "Pilot Cockpit"**
- Dense row of dropdowns (Brand | Model | Year | Price).
- *Critique:* Efficient but overwhelming. Looks like a spreadsheet. Zero soul.

**Approach 3: The "Conversational Wizard" (RECOMMENDED)**
- **Visuals:** Large, floating card in the hero.
- **Interaction:**
  1. "What are you looking for?" [Brand/Model]
  2. *Smooth transition* -> "What's your budget?" [Slider with emotional tags like 'First Car', 'Executive']
  3. "Show me the 43 cars" (Button pulses).
- **Soul:** Micro-copy changes. Instead of "Search", use "Find my match".
- **Why:** It guides the user. It feels like a concierge asking questions, not a form demanding data.

### Component: **The "Car Card"** (The Product)
*Current:* Image top, title, price, specs below.

**Approach 1: Minimalist**
- Just image + Name + Price. Hover for details.
- *Critique:* Frustrating. I need to know mileage/year without hovering.

**Approach 2: Data-Heavy**
- Image + Table of 10 specs.
- *Critique:* Too noisy. Anxiety inducing.

**Approach 3: The "Snapshot" (RECOMMENDED)**
- **Layout:** High-res image (aspect 4:3).
- **Typography:** Bold price, clearly separated from monthly payment (if leasing).
- **Chips:** "Diesel", "2020", "150k km" - visual chips with subtle icons.
- **Soul:** Add a "Seller Pulse" - e.g., "Verified Dealer" badge that glows slightly green.
- **Interaction:** "Quick Preview" eye icon that opens a modal without leaving the search results.

---

## 4. Page-by-Page Plan

### A. Homepage (`src/app/page.tsx`)
**Goal:** Inspire & Direct.
- **Hero:** Remove generic stock car photo. Use a *lifestyle* video background (blurred) or a high-quality montage of driving on Slovak roads.
- **Headline:** Change "Najrýchlejší spôsob..." to something emotive. "Discover the car you deserve."
- **Section - "Why Us":** Instead of 3 grid icons, use a horizontal scroll of stories/testimonials with real photos of happy buyers.

### B. Search Results (`src/app/vysledky`)
**Goal:** Filter & Compare.
- **Layout:** Split view? No, keep it vertical list but with a clear "sticky" filter bar on the left (desktop) or bottom sheet (mobile).
- **Soul:** "Saved Search" shouldn't be a bell icon. It should be a widget: "Notify me when a BMW M3 drops below €30k".

### C. Car Detail Page (`src/app/auto/[id]`)
**Goal:** Fall in Love & Trust.
- **Visual:** Image gallery should be distinct. Not a carousel. A masonry grid of best angles: Front, Interior, Wheel, Dashboard.
- **Trust:** "Transparency Section" - clear history check (CEBIA/OdoPass) prominently displayed, not hidden.
- **Call to Action:** Two buttons.
  1. "Call Seller" (Primary, Warm Amber)
  2. "Calculate Leasing" (Secondary, Outline)

### D. Login / Auth
**Goal:** frictionless entry.
- **Design:** Centered card. Glassmorphism background blur.
- **Copy:** "Welcome back" -> "Good to see you again, [Name]".

---

## 5. Implementation Steps (The Workflow)

1.  **Foundation:** Update `globals.css` with new variables (The "Techno-Warmth" palette). Import Serif font.
2.  **Layout Structure:** Rewrite `Navbar.tsx` and `Footer.tsx` to use the new "softer" spacing and colors.
3.  **Core Components:** Redesign `CarCard.tsx` - this is used everywhere. Make it perfect.
4.  **Home Page:** tear down current `HomeHero` and build the "Wizard".
5.  **Search Page:** Update filters to be tactile "pills" buttons instead of native checkboxes.
6.  **Detail Page:** Rebuild the gallery and "Trust" section.

This plan focuses on **clarity, warmth, and tactility**.
