# Firebase and Vercel deployment

## Vercel variables

Import the root repository using Next.js, Node **22.x**, `npm ci`, and `npm run build`. Paste this into Vercel's environment-variable bulk editor (or import `.env.example`), select the environments you use, and **redeploy**. Next.js embeds these public values at build time.

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDtahxzErvrC_nDXruePkmZHyGOaMf7WCY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gulam-chor.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gulam-chor
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://gulam-chor-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gulam-chor.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=708724884747
NEXT_PUBLIC_FIREBASE_APP_ID=1:708724884747:web:8c7c8a90b4bb4dea588e0e
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-77BB53WDC7
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
NEXT_PUBLIC_SITE_URL=https://gulamchor.vihar.online
```

These are public web configuration values, not administrator credentials. Never add a service-account private key to the frontend. Analytics is not started automatically; the measurement ID is retained for an optional later integration. Storage is not used for game state or uploads.

Do not set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` in Vercel. Add `gulamchor.vihar.online` to the Vercel project. A push to `main` triggers deployment when that project is connected to this repository.

## Firebase

- Project: `gulam-chor` (`708724884747`), Blaze.
- Anonymous Authentication is enabled; authorized domains include `gulamchor.vihar.online`, the project's Firebase domains, and localhost.
- Realtime Database: `gulam-chor-default-rtdb`, `us-central1`.
- `roomAction`: callable function, Node 22, 256 MiB, minimum 0 instances, maximum 2, concurrency 40, 20-second timeout.
- `cleanupRooms`: daily scheduled function, maximum 1 instance, 256 MiB, bounded cleanup.

Both functions use Firebase's managed service identity and run in the same region as the database. Vercel needs no server credentials. The first action after an idle period may wait for a cold start.

```sh
npm ci
npm ci --prefix functions
npx firebase login
npx firebase deploy --project gulam-chor --only database,functions
npx firebase functions:artifacts:setpolicy --project gulam-chor --location us-central1 --days 1
```

For this workstation's multiple accounts, append `--account tirthankar.dgen@gmail.com`. The build hook compiles shared game/room modules into the functions bundle; the backend has no runtime dependency on the frontend package.

`database.rules.json` denies all client writes and all reads by default. Only members of an unexpired room can read its public view, and only a matching UID can read a private hand. Expiry indexes support cleanup. Firestore and Storage rules are not needed because neither service is used by the game.

## Emulator and browser tests

Install Java 21+ and run `npm run emulators`. In another terminal run `npm run test:integration`. The test suite uses the isolated `demo-gulam-chor` project.

For browser tests, set these overrides in `.env.local` and restart Next.js:

```dotenv
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-gulam-chor
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://demo-gulam-chor-default-rtdb.firebaseio.com
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

Retain a nonempty API key and app ID. Open localhost in independent browser profiles; ordinary tabs share the same anonymous identity and seat. The emulator flag only works on localhost/127.0.0.1. Remove the overrides to use production again.

Explicit live verification: `node --env-file=.env.local scripts/test-multiplayer.mjs --live --counts=2,6`. This creates temporary anonymous players and rooms, checks live permissions and full rounds, and removes its test data.

## Cost controls

- Two data listeners per player. Connection status and countdowns use local SDK metadata and local timers; no database polling.
- A command transaction publishes public state and private hands atomically. Only six recent move events are retained, with no unbounded history or chat.
- Create retries reuse an identity's available room; each room has at most six players. Invalid, stale, and duplicate actions cannot advance the game.
- No warm instances, automatic bots, per-second server timers, Firestore, Storage transfers, or paid external APIs. Timeout draws occur only on a player's request.
- Rooms expire after 24 inactive hours. The daily cleanup checks at most 500 expired rooms and 500 owner records, with conditional transactions to preserve freshly renewed rooms.
- One-day build-artifact retention limits Artifact Registry storage. A single daily Scheduler job can fit the billing account's free allowance if available.

Free allowances are shared with the relevant project or billing account. Instance caps limit scaling, **not total spend**. Traffic, abuse, builds, outbound data, and other resources can still cause charges. Review Firebase Usage and Cloud Billing and configure billing alerts for your account; the app does not impose a hard zero-cost cap.

## SEO

Canonical site: `https://gulamchor.vihar.online`. Landing and rules pages are indexable. Private play URLs have `noindex,follow` and are excluded from the sitemap.

The sitemap **updates daily**, uses `changefreq=daily` and **priority 1.0** for both the homepage and `/how-to-play`, and revalidates every **86400 seconds (one day)**. The robots policy also refreshes daily and allows crawlers to reach pages, images, favicons, and icons. These are crawler hints, not guaranteed crawl times or search rankings. Update `SITE_UPDATED_AT` in `src/lib/site.ts` when page content materially changes; daily regeneration does not fabricate a new content-edit date. Submit `/sitemap.xml` to your site's Search Console when ready.

`npm run build` automatically scans `public/` into `src/lib/sitemap-images.json`; the sitemap bundles this inventory so every public image (including generated artwork, favicon files, and app icons) appears without runtime filesystem access. Run `npm run seo:sync` to refresh it manually. `npm run seo:assets` regenerates the committed 1200×630 share JPEG, 16/32/48-pixel favicon variants, 180-pixel Apple icon, 192/512-pixel app icons, and maskable icon. `/manifest.webmanifest` advertises app icons. Each page supplies its own Open Graph and Twitter title, description, canonical share URL, and image metadata.
