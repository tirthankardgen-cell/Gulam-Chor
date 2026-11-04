# Gulam Chor · game and visual plan

## Product intent and scope

Make opening the website feel like walking into a familiar Indian courtyard where one more round is about to begin. The interaction is immediate: **one hero screen, one Play action, one game page**. There is no marketing scroll, login, dashboard, lobby, shop, or separate result route in this preview.

The current user request is for a preview of the plan and appearance, with final raster art produced later by an image-capable agent. The earlier specification is the source of game rules and future multiplayer engineering requirements. Its contemporary navy/glow styling, longer entry flow, Vite preference, and Firebase Hosting recommendation are superseded here by the user's later traditional Indian direction, Next.js choice, direct flow, and Vercel hosting target.

The preview is a complete **local game against virtual family members**, with 2–6 occupied seats. It does not pretend that bots are connected humans or that browser-local state is cheat-resistant. The existing specification is preserved unchanged for the future multiplayer build.

## Understand the physical game

1. Gather two to six people around a single deck. Decide a consistent seat order.
2. Remove one randomly chosen Jack without showing its suit. This creates the odd rank; **51 is the number of cards, not the player limit**.
3. Shuffle and deal all 51 cards round-robin. Hand sizes differ by at most one before cleanup.
4. Each person discards all equal-rank pairs from their own hand. Suit and colour are irrelevant. Three equal ranks discard one pair; four discard two.
5. A randomly chosen active player takes one unseen card from the next active person on the left, defined here as the next anticlockwise seat.
6. If that card matches a rank already held, both cards leave the hand as a pair. Otherwise, it stays.
7. Anyone with an empty hand is safe, including a person whose last card was taken by someone else. Skip empty seats when choosing the next actor and target.
8. Continue until only one card remains. Its rank must be Jack because all other ranks began even and each discard removes two. That holder is the Gulam Chor; everybody else is safe.
9. Reveal the last Jack and the originally removed Jack. A rematch uses a new shuffle, new removed Jack, randomized seats, and a new random starter.

The emotional progression is anticipation → choosing a back → relief at a pair → the suspicious Jack moving → safe spectators → affectionate teasing at the reveal. The interface should make these beats clear without requiring anyone to read a manual first.

## Visual language

**Place:** a modest Indian neighbourhood baithak, a woven charpoy/wooden table, worn plaster, neem shade, faded teal shutters, potted plants, and chai. The hero and game are views of the same location. It is an everyday family space, not a palace, casino, or fantasy battlefield.

**Art:** original gouache-style narrative backgrounds with irregular brush edges and restrained paper grain. Supporting card backs use small Indian buta/block-print motifs. Court art has an original miniature-inspired Jack. Human portraits are warm, fictional, consistent, and respectful.

**Colour:** shaded neem green `#293D35`, cotton teal `#2B4A42`, terracotta `#AF6443`, ochre `#C99558`, warm cream `#F5E6C5`, faded brass `#DFB36D`, dusty blue `#7A929A`. Active turns use a fine brass outline; safe players use a leaf-like pale green plus an explicit label/check; the Chor uses a warm clay accent. Status is never colour alone.

**Type:** locally bundled Yatra One for the large Hindi identity and short scene titles; Hind for legible controls and bilingual copy; a restrained serif for the main table prompt. Keep text as HTML, never baked into artwork. The logo is an emblem plus an accessible live-text wordmark; the icon is a simplified derivative.

**Materials:** cream paper faces, worn teal block-printed backs, cotton cloth, wood edging, fine dashed stitching, restrained brass accents. Rounded corners follow a physical card or wooden edge. Avoid glossy gradients, glass dashboard panels, neon glows, floating analytics tiles, or ornamental clutter.

## Screen and state plan

| Screen/state | Composition | What the player can do |
| --- | --- | --- |
| Hero `/` | Full-screen courtyard; small emblem at upper left; large two-line `गुलाम चोर`; one short familiar line; one cream Play button | Open the game directly |
| Loading `/play` | Same shaded setting, spade mark, “Your seat is waiting” | Briefly wait for the local game module |
| Opening deal | The real round already exists; a shuffled-back animation and four brief cues describe 52 cards, one removed Jack, 51 dealt, automatic pairs | Skip; reduced motion bypasses the sequence |
| Your turn | Own cards face up below; target's exact number of backs fanned in the center; source explicitly named; active and target seats identified | Choose one target back by touch/mouse or keyboard |
| Other turn | Own cards stay visible; the active virtual player and source remain explicit; backs are disabled | Watch, inspect/shuffle own hand, open rules/settings |
| Pair feedback | A short “pair” message, updated discard pile/counter, optionally two quiet wood-like synthesized tones | Wait for the short move lock to clear |
| Safe | Empty own hand replaced by a chai-break message; the seat has a check and “Safe” label; game continues | Spectate, use settings, or return to courtyard |
| Finished | Same table, a warm Hindi reaction, named Chor, final Jack and removed Jack, every safe player, one rematch control | Deal again without a lobby |
| Rules sheet | Warm paper, four concise numbered rules, local-preview disclosure | Close, Escape, or return to the table |
| Settings sheet | Paper sheet; 2–6 seat radio group; leisurely/quicker choice; explicit fresh-deal action | Start the chosen table or keep the existing round |

No control suggests an unsupported online room, share link, invite, account, public chat, or payment. “Virtual player” and “practice round” labels keep the scope understandable.

## Table layout by device and count

Desktop seats use the fixed anticlockwise seat order, rotated so the local user is always at the bottom. Two seats have one opponent opposite; three form a triangle; four form a cross; five and six form a ring. Only occupied seats render. A central target fan is used consistently so people do not need to tap tiny cards at the perimeter.

On phones, all one-to-five opponents form a compact top strip. This strip preserves the same seat sequence; it does not recompute the “left” target from screen coordinates. The engine chooses the target. A focused card fan occupies the center, with discarded pairs and the set-aside Jack above. The own hand remains near the bottom. Hand overlap adapts to count, and a selected own card lifts for inspection. All 2–6 layouts use the same engine and component; there are no hard-coded four-seat rules or ghost players.

Target backs are anonymous positions, not rendered card identities. The set-aside Jack is visibly separate from the discard pile. The discard pile is never an active draw deck.

## Motion, sound, and accessibility

- Brief shuffle/fan motion; no page-long cinematics. The game state exists before the intro, and skipping does not change the deal.
- Disable draw buttons immediately during the accepted move. The engine validates actor, turn number, and slot; a duplicate old turn is rejected.
- Keep the target fan count exact. The drawn card is visible only in the local player's face-up hand; bot move messages reveal only public discarded ranks, never an unpaired face.
- Optional synthesized taps, off by default, unlocked by user interaction. No soundtrack, copyrighted recording, remote audio, or autoplay dependency.
- Respect system reduced motion, label each draw by position/source, label own cards by rank/suit, and use native dialogs for focus containment and Escape.
- Persist an intact local round in this tab's session storage; validate its full card integrity before restoring. Storage failure does not block play.
- Pausing on a rules/settings sheet is appropriate for a local preview. A future live multiplayer game must not pause every other device because one person opened a sheet.

## Artwork handoff

The 15-slot [manifest](../art-direction/asset-manifest.json) and [detailed prompts](../art-direction/README.md) cover both orientations of both scenes, a textile tile, one universal back, Jack portrait, six avatars, logo, and favicon. Use only generated files that actually exist. Current SVG studies are original project assets and remain fallbacks.

Every asset has an exact destination, aspect ratio, negative-space contract, palette, exclusions, and small-size review requirements. Cards keep live rank/suit labels. The logo has no generated lettering. The screen layout remains unchanged when the paintings arrive.

## Frontend architecture and Vercel

Next.js App Router with `/` and `/play`; React client game; TypeScript rules module; Tailwind 4 plus scoped design CSS; bundled fonts; local assets. The pages can be prerendered, and the game starts only in the browser so a random deal cannot cause server/client hydration differences. Node 22 is pinned for the build toolchain. `vercel.json` selects Next.js; no environment variables are needed for the preview.

`src/lib/game.ts` owns deck creation, cryptographic shuffle input, fair deal, pair removal, fixed seat rotation, per-turn anonymous slots, safe status, and completion. It is pure apart from injected randomness. Its `assertIntegrity` checks all 52 original identities across hands/discards/removed Jack, no within-hand pairs, safe membership, actor/target slots, and the single-Jack final state. Browser randomness uses `crypto.getRandomValues`; deterministic seeded randomness is supplied only to tests.

## Steps from preview to real family multiplayer

These are planned, not implemented or deployed by this preview:

1. Keep Vercel for the Next.js frontend. Create a Firebase project with anonymous Auth, Firestore, and trusted callable Cloud Functions; configure environment values and emulators.
2. Add an optional small in-table create/join/invite interaction so the hero can still lead directly to `/play`. Nickname/auth and readiness can live in the table's seating state. A friend opening a room link should arrive at that same page.
3. Move deck creation, private hands, per-turn slot mapping, dealing, and every move into trusted functions. The client sends only round/turn/slot/request IDs. Never publish another player's hand or the removed Jack before the result.
4. Use transactions with reads before writes, idempotent request IDs, membership checks, a 2–6 hard cap, and strict rules forbidding client writes to game state. Subscribe only to public state and the caller's own hand.
5. Animate from server-confirmed timestamps/events. Preserve cards during disconnects; recover current snapshots on refresh. Add a genuinely server-authoritative optional timeout rather than trusting a browser timer.
6. Test 2–6 separate authenticated devices, forbidden private-hand queries, simultaneous moves, repeat requests, host departure, fresh rematches, and connection recovery. Only then label the mode “play with friends.”

This preserves the mathematical game and visual system while replacing the explicitly local simulation with the specification's secure multiplayer authority.
