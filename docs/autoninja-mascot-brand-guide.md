# AutoNinja mascot continuity guide

## Source of truth

- Master reference board: `public/brand/autoninja/mascot-reference-board.png`
- Reusable full-body mascot: `public/brand/autoninja/mascot-master.png`
- Compact logo head: `public/brand/autoninja/mascot-head.png`

Every future mascot graphic must use the reference board or one of the approved
transparent masters as an image reference. A text prompt by itself is not enough
to preserve the character.

## Character invariants

- Rounded, compact body with an oversized rounded hooded head.
- Matte black and deep-charcoal ninja clothing with soft polished 3D rendering.
- Wide black face visor framed by the hood.
- Friendly curved orange eyes; the default expression is calm and smiling.
- Vivid orange headband with two short tied tails on the character's left.
- White geometric `A` chest mark with a small orange lower triangle.
- Relaxed, confident, helpful personality; never aggressive or weapon-led.
- Orange is the dominant action accent. Dark green remains the platform's
  structural color. White, black, and charcoal carry most surfaces and type.
  Mint appears only as a small positive or technical highlight.

## Approved palette

- Ninja orange: `#F45B00` for accessible UI controls and `#FE6800` in rendered
  mascot artwork where the reference lighting calls for the brighter tone.
- Orange hover: `#E85A00`
- Ninja black: `#111317`
- Platform dark green: `#005C33`
- Dark-green hover: `#004726`
- White: `#FFFFFF`
- Mint highlight: `#49E698`

## Reusable generation prompt

Use the master reference image and begin with:

> Preserve the exact AutoNinja mascot identity from the supplied reference:
> rounded proportions, black hood and outfit, orange headband and belt, black
> face visor, friendly curved orange eyes, white-and-orange A chest emblem,
> polished soft 3D illustration finish, and relaxed helpful personality. This
> must be the same character, not a generic ninja or a redesign.

Then describe only the new pose, prop, expression, or scene. Repeat the
invariants in every edit and request one change per iteration.

## Usage rules

- Use the head icon at small sizes; do not shrink the full-body mascot into an icon.
- Keep clear space around the headband tails and hood silhouette.
- Do not add weapons, photorealistic human features, exposed skin, or a mouth
  outside the visor's expression system.
- Do not recolor the headband, eyes, or belt away from orange.
- Avoid placing the mascot over visually busy vehicle details.
- Use empty alt text when the mascot is decorative. Use concise descriptive alt
  text only when the mascot conveys unique information.
