# Multiplayer verification

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

## Deployment boundary

Browser checks used the production build locally with the **live Firebase backend**. Vercel needs the values from .env.example / [DEPLOYMENT.md](DEPLOYMENT.md) and a deployment from the updated main branch. These public values are embedded at build time, so adding them requires a redeploy. Application code cannot guarantee search-engine indexing or staying within shared Blaze free allowances.
