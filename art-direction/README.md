# Gulam Chor · artwork handoff

This folder is the complete handoff for the person or agent with an image-generation tool. **No generated paintings are included yet.** The working website uses original SVG colour studies, so all pages and game states already work.

## The world

A familiar Indian neighbourhood courtyard at the end of a warm afternoon. Terracotta limewash, faded indigo shutters, a neem tree, woven charpoys, cotton cloth, steel or clay chai cups, and a family lingering for one more round. Earthy, welcoming, gently mischievous. Everyday Indian life, rather than a royal casino or an exotic spectacle.

The user's references are [Truck Wala Music](https://www.truckdrivermusic.in/) and [Deluxe Salon Music](https://deluxesalonmusic.in/). Study their **full-screen painted environments, large Hindi lettering, warm light, painterly texture, and quiet interface**. Make original artwork for this game. Do not copy their truck, salon, signs, logo, background files, music, or other assets.

The user explicitly requested traditional Indian art throughout, including the logo and browser icon. Use one consistent family of gouache / hand-painted Indian poster illustrations, with small block-print accents. Avoid neon, glossy 3D, gaming dashboards, photorealistic stock photography, glass interface panels, generic casino imagery, and modern gadgets.

## Shared style bible

- Palette: neem/shadow green `#293D35`, deep cotton teal `#2B4A42`, terracotta `#AF6443`, ochre `#C99558`, cream `#F5E6C5`, muted brass `#DFB36D`, dusty sky blue `#7A929A`.
- Light: low warm light from upper right; long, soft-edged shadows. No dramatic blue/purple night lighting.
- Medium: layered opaque gouache, visible dry-brush edges, subtle paper grain, gently imperfect contours. Shapes should read clearly before texture is added.
- Period: an unhurried, late-20th-century everyday Indian setting. No phones, LEDs, modern cars, branded packages, plastic gaming props, or polished luxury resort furniture.
- Mood: affectionate family familiarity, playful suspense, comfortable faces, natural dignity. No caricatures of ethnicity, class, age, or gender.
- Text: **do not generate any text into scene, card, avatar, or emblem images**. Hindi titles, English UI, ranks, and suits are real accessible website text. The card-back mark is decorative and identical for every card.
- Continuity: the same courtyard and light must appear in all four environment paintings; avatars share one painter, crop, and lighting. Generate the desktop hero first and reuse it as the environment reference.
- Keep focal decoration away from the actual interface. The supplied prompts define safe areas. Nothing that looks like a button, readable card, interactive seat, or score should be baked into a background.

## The 15 slots

`asset-manifest.json` is the exact contract. Each asset has a standalone prompt in `prompts/`, its dimensions, destination, composition, negative constraints, and review notes. Start in this order:

1. `01` desktop hero, then `02` portrait hero using the chosen original as a reference.
2. `03–04` game environment views using that same courtyard.
3. `05–07` cotton cloth, identical card back, and the mischievous Jack.
4. `08–13` the six matching portraits.
5. `14–15` the logo emblem and simplified favicon.

Suggested generation sizes are in the manifest. If a tool cannot generate those exact sizes, generate at the closest supported ratio and crop without stretching. Optimize the final web deliverables: landscape backgrounds preferably below 700 KB, portrait backgrounds below 500 KB, cards below 180 KB, and avatars below 80 KB after downsampling to 256–512 px. Logo and favicon PNGs need clean edges; the logo needs a real alpha channel.

## Add the artwork without changing the UI

1. Save the final assets at their **exact** paths under `public/art/generated/`. Do not overwrite `public/art/studies/`; those remain fallback originals and editable references.
2. Run `npm run art:sync`. It discovers only files that exist and updates `src/lib/generated-art.json`. Missing assets continue to use the studies, with no broken-image requests. `npm run dev` and `npm run build` also run the sync automatically.
3. For a running development server, rerun `npm run art:sync` after adding images. It updates the imported JSON and triggers a refresh.
4. Check `/` and `/play` at 1440×900, 390×844, and 360×740. On the game page use Table settings to try 2 and 6 seats, inspect a Jack, and finish a round to inspect both revealed Jacks.
5. Check text contrast, scene cropping, card corner readability, 48px portrait legibility, reduced motion, logo contrast, and the favicon at 16–32px. Keep the live Hindi heading in place.
6. Run `npm run build`. Commit generated assets **and** `src/lib/generated-art.json` together.

The central resolver is `src/lib/art.ts`. Environment images render in `src/components/scene.tsx`; card graphics in `src/components/playing-card.tsx`; portraits on the game table; the emblem in `src/components/brand.tsx`; and the favicon in app metadata. Portrait environments are selected with a native `<picture>` breakpoint at 700px. If only a desktop painting exists, it temporarily serves both orientations. No API key, image service, or runtime image generation is required by the deployed website.

## What must remain functional

- The player must always see real rank and suit labels outside the portrait. Never replace an entire functional card with a generated card screenshot.
- A back must not encode rank, suit, identity, or whether a Jack is underneath. Use the **same image** for every hidden card.
- The discarded pile is not a draw deck. The isolated face-down Jack stays hidden until results. Background illustrations must not add misleading interactive cards.
- The main heading and buttons remain HTML. Generate a symbol for the logo, not a flattened full-page image.
- Do not introduce a lobby, login, shop, marketing section, or extra route when integrating the artwork.

## Existing studies

`public/art/studies/` contains the original courtyard, cotton motif, card back, Jack, portraits, and emblem. These are deliberately replaceable concept assets, not claims that finished AI paintings have been generated. Their editable source is `scripts/make-preview-art.mjs`; running it recreates the studies and fallback `public/favicon.svg` only, without touching generated assets.
