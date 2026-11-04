# Preview verification

Checked locally on 4 November 2026 with Node 22 and Google Chrome driven through the Playwright CLI.

## Rules and build

- **14 passing automated checks**, including **400 full seeded rounds** (80 each with 2, 3, 4, 5, and 6 seats).
- All 52 unique card identities are conserved across hands, discarded pairs, and the removed Jack after every move.
- Every completed simulated round has one remaining Jack, exactly 25 discarded pairs, and exactly one Chor.
- Rank-only pairing, triples/quads, wraparound, safe-seat skipping, stale-turn rejection, invalid moves, stable blind slots during hand shuffling, and invalid saved-state rejection are covered.
- A dedicated uneven-deal check confirms that rotating the local player's view does not always give that player an extra card.
- A round that finishes during initial pairing is handled without inventing a playable turn.
- ESLint passed with zero warnings. The Next.js production build passed, including TypeScript checking. Both `/` and `/play` are prerendered; the random local game starts only in the browser.

Commands: `npm test`, `npm run lint`, `npm run build`, and `npm run typecheck`. Use Node 22 as pinned in `.nvmrc`; the host's older Node 20.16 cannot run this version of the Tailwind build toolchain correctly.

## Real-browser checks

- The sole hero action opens `/play` directly, with no login or lobby.
- Every seat count from 2 through 6 renders the correct number of occupied seats at desktop and phone widths. No extra ghost seats, horizontal page overflow, broken images, or opponent card faces appeared in the checked layouts.
- Desktop captures: 1440×900. Phone captures: 390×844 and 360×740. At short viewport heights the page can scroll vertically to preserve usable card sizes; the opponent strip remains visible together.
- Complete two-seat and six-seat rounds were played by clicking/keyboard-selecting blind positions while bots took their turns. Both reached valid single-Jack results, showed safe spectators, and exposed both final Jacks only after completion.
- Reloading on the user's turn restored the same round, turn, and own hand without replaying the deal.
- Target-fan counts were checked against the current target's count; target fans contain back images, not hidden face elements.
- The rules sheet pauses local bots. Escape dismisses it and returns keyboard focus to its opener. Both sound-toggle states and the optional quicker pace were exercised.
- In-table seat selection deals a fresh round and rematch stays on `/play`.
- System reduced motion skips the opening animation and reduces card transitions.
- Browser checks reported no page errors or broken-image requests. The favicon uses the central asset resolver rather than an overriding file-based icon route.

Working captures and the one-off CLI verification scripts are in the ignored `output/playwright/` folder. Curated, optimized screenshots are in `docs/preview/` for repository review. They show original SVG placeholder art, not the deferred finished paintings.

## Artwork handoff checks

All 15 manifest entries have a detailed prompt and an exact output filename. The generated folder is intentionally empty except for `.gitkeep`; `npm run art:sync` reports `0/15` and routes all current image slots to valid original SVG studies. Generated files can be added one at a time without broken links. Final image quality, crop, alpha, and compression must be reviewed when those images are supplied.

## Boundaries

This verifies a local preview against virtual players, not online multiplayer fairness or Firebase security. No Vercel deployment, Firebase project, anonymous authentication, shared room, private-hand network protocol, server timeout, or multi-device synchronization has been provisioned. The future production steps and security boundaries are described in `GAME_AND_VISUAL_PLAN.md` and the preserved original specification. No runtime credentials are required for this preview.
