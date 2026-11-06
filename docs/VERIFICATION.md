# Multiplayer verification

## SEO, sitemap, and sharing update — 7 November 2026

- The optimized Next.js build, ESLint, and TypeScript checks passed with Node 22.
- Verified the built site's HTTP responses using a Facebook crawler user agent: `/`, `/how-to-play`, `/play`, and an invite URL each return the correct title, description, canonical URL, page-specific Open Graph/Twitter metadata, and icon links in the HTML head.
- `/sitemap.xml` includes both public pages at **priority 1.0** with **daily** change hints. Its image URLs exactly cover all **22 public images**, including favicons, icons, original SVG art, and both share images. Every listed image returned HTTP 200 with an image content type.
- The production prerender manifest confirms **86400-second (daily)** regeneration for both `/sitemap.xml` and `/robots.txt`. The sitemap uses the actual content revision date, and robots permits crawling and advertises the sitemap.
- Validated the ICO's 16/32/48-pixel variants, 180×180 Apple PNG, 192/512-pixel app icons, maskable icon, and web manifest against their actual files. The new Open Graph JPEG is 1200×630 and was visually inspected alongside the icon artwork.
- Public pages permit indexing and large image previews. Private room/play URLs remain `noindex,follow` for both general crawlers and Googlebot and are absent from the sitemap.
- The image inventory regenerates before development/production builds. Verification scripts are in ignored `output/seo/`; generated public assets and the inventory are committed with the implementation.

## Laptop layout and card interaction update — 6 November 2026

This update is verified locally; the deployment evidence below describes the earlier release.

- **26 tests passed**, including 500 simulated complete rounds. Added checks for mirrored draw slots, unchanged surviving-card order, the full opening timeline, accurate seat deal counts, and private preview mappings.
- ESLint, TypeScript checks, the Firebase Functions build, and the optimized Next.js production build passed using Node 22. The system's older Node 20 cannot load this project's current CSS tooling; use the declared Node 22 runtime.
- The Firebase emulator integration suite passed for **2, 3, 4, 5, and 6 players** with real Authentication, Database rules, and callable functions. Selection writes from other players, invalid slots, stale revisions, and extra payload fields were rejected. The owner received the chosen slot; drawing cleared it atomically. Existing privacy, concurrent joins, duplicate draws, and rematch checks passed.
- Two separate browser sessions verified mouse hover and touch feedback. The first offered card highlighted the owner's last card. Drawing removed exactly that card and left the other cards in order. A real emulated touch preview left the turn unchanged until **Take this card** was pressed.
- Desktop play and winner/loser layouts were inspected at **1024×600, 1280×600, 1366×650, 1440×900, and 1920×950**, including six seats and long names. Document dimensions matched the viewport; hand captions, results, and controls did not overlap. Very short windows below 550 CSS pixels retain scrolling to keep controls accessible.
- A rematch displayed the full 10.75-second shuffle, separate face-down Jack, all 51 card flights, and pairing sequence. Counts matched each seat's actual initial deal. Results replace the playing seats and hand; winners get confetti, and the loser gets an animated Gulam Chor stamp.
- Touch play was inspected at **390×844**. Both mobile result variants were checked at 390px and 320px widths. Reduced-motion mode hides card flights/confetti and removes the reveal animations.
- Browser captures and local-only fixture scripts are in ignored `output/playwright/update-*` files. These fixtures target only the isolated `demo-gulam-chor` emulator.
- Deploy **Firebase Database rules, `roomAction`, and the frontend together**: the longer deal lock and mirrored slot mapping are authoritative server changes. No production deployment was performed for this update.

## Earlier release verification

Verified on **6 November 2026**, using Node 22, Firebase emulators, live Firebase, and production Next.js pages in Chrome through Playwright CLI.

## Rules and backend

- **24 tests passed**, including **500 full simulated rounds** across 2, 3, 4, 5, and 6 players.
- Coverage includes card conservation, fair 51-card deals, rank pairing, safe seats, single-Jack results, invalid moves, stale revisions, and host controls.
- Room checks include profile validation, capacity, rejoining, host transfer, removal, reseating, rematches, deadlines, expiry, and public/private projections.
- The **Firebase emulator integration suite passed for all five player counts**, exercising real SDK authentication, callable functions, subscriptions, and rules.
- The **same suite passed against deployed Firebase for 2, 3, 4, 5, and 6 players**. Rounds took 8, 17, 23, 31, and 58 draws respectively; results and rematches passed.
- Unauthenticated callers cannot create rooms. Outsiders cannot read a room; members cannot read secret state, room listings, or another hand, or write their own hand. Removed members lose access.
- Concurrent joins preserve every seat. Duplicate draws commit once. Invalid actions return controlled errors without crashing the worker.
- Integration-created rooms and temporary anonymous accounts were removed after verification.

## Browser flow

- The landing button opens Create/Join. Names, six avatar choices, room codes, and direct invite links work.
- Six independent browser contexts joined the same live room. Only the host could start; the button was disabled with one player.
- Clipboard copying returned the correct invite. The shuffle/deal overlay appeared before the playable table.
- A normal draw and the 60-second timeout draw reached the other clients. Mobile browsers recovered their seat and round after reload.
- Desktop (1440x900) and mobile (390x844) tables showed five opponents and one private hand, with no horizontal overflow. The monitored flow had no page exceptions.
- The rules dialog opened and dismissed with Escape. Existing art, sound controls, keyboard access, and reduced-motion styles remain.
- Captures are in the ignored output/playwright directory. Existing original SVG artwork is used; no generated paintings were added.

## Build, SEO, and cloud

- Tests, ESLint, TypeScript, the production Next.js build, and the functions build passed.
- Production pages returned HTTP 200 for /, /how-to-play, /play, /robots.txt, and /sitemap.xml.
- Landing and rules pages have indexable metadata, canonical URLs under https://gulamchor.vihar.online, and a valid social image. Private room pages use noindex,follow.
- The sitemap advertises weekly changes. The built prerender manifest confirms a **604800-second (one-week)** revalidation interval.
- Anonymous Authentication and the production domain are configured on project gulam-chor.
- Database rules were released to gulam-chor-default-rtdb.
- roomAction and cleanupRooms are **ACTIVE**, on Node 22 in us-central1. The callable has a two-instance maximum and 256 MiB memory.
- The cleanup Scheduler job is **ENABLED**, runs every 24 hours, and its Cloud Run endpoint is private.
- Artifact Registry's cleanup policy removes deployment images after **86400 seconds (one day)**. The policy was set and read back after the initial deployment reported it missing.

## Public deployment

The implementation was pushed to main as e2de9ee. Vercel deployed successfully, and every step of [GitHub's check suite](https://github.com/tirthankardgen-cell/Gulam-Chor/actions/runs/42199227669) passed, including the Firebase emulator integration suite.

The public domain **https://gulamchor.vihar.online** serves the updated pages, robots file, and weekly sitemap. Two independent browsers completed a full round directly on this domain, displayed the single-Jack result, started a rematch, returned to the lobby, and left the test room. The other browser checks above used a local production build with the same live Firebase backend.

The copy-paste Vercel values are in .env.example / [DEPLOYMENT.md](DEPLOYMENT.md). They are embedded at build time, so changing them requires a redeploy. Application code cannot guarantee search-engine indexing or staying within shared Blaze free allowances.
