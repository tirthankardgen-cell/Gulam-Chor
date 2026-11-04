# Browser research · 4 November 2026

The supplied specification was read in full. The following pages were opened and inspected in an actual Chrome session using Playwright. Local reference captures are kept in the ignored `output/playwright/` directory; third-party website images are not copied into the shipped app.

## Rules and how families play

### [Cheettukali — Gulam Chor rules](https://cheettukali.com/gulam-chor/rules/)

Observed: one Jack is set aside face down; 51 cards are dealt; equal-rank pairs are discarded regardless of colour or suit; three of a kind leaves one card. Players blindly pick from the next hand, may shuffle the offered hand, and skip people whose hands are empty. The last Jack holder is the Chor. The page describes three or more people, with its playable table supporting 3–6. It explicitly lists household variations: remove a Queen, remove a different card, use a Joker, or require same-colour pairs.

The page's offering/drawing wording and another household's direction should not silently alter this project's turn engine. Here, the **actor draws from the next active seat in the fixed anticlockwise order**, then the turn proceeds in that same order, following section 2.2 of the supplied specification.

### [Nepali Games — How to play Gulam Chor](https://nepali.games/gulam-chor/how-to-play)

Observed: a **2–6 player** pairing game, one removed Jack, blind draws, automatic pair disposal, no cards means safe, and a lone unpaired Jack means Chor. It discusses family play during Dashain, children learning the game, the suspense of the passing Jack, and household variations. This is evidence of the game's wider South Asian family context, not a claim that a Nepali festival describes every Indian household.

It describes five-round matches as one configurable format and casual forfeits as a tradition at some tables. This preview does not add either: one complete round and a rematch make the core experience immediately understandable. The original specification's 2–6 cap takes precedence over varying player limits on the web.

### Practical social observations translated into interaction

The pleasure is in the gathering and suspense: fanning a hand, teasing someone with a poker face, taking a chance, watching a pair disappear, and becoming safe while the Jack keeps travelling. This is not a points-heavy strategy game. Preserve those moments with visible seat identities, a tactile fan of identical backs, an unhurried pace, clear “safe” status, and a playful result. Don't invent a skill rating, wager, timer pressure, punitive loss, or competitive leaderboard.

The family names and portraits in the preview are fictional companions. Their choices are random blind positions; their personalities are presentation, not secret knowledge or different odds.

## Website style references supplied by the user

### [Truck Wala Music](https://www.truckdrivermusic.in/)

Observed in Chrome: a full-screen painterly Indian roadside scene; warm terracotta land and architecture; a shaded tree; oversized cream/white Hindi lettering with a small spaced Latin subtitle; controls arranged over the image. The setting carries the identity before any interface details are read.

Adopt: one immersive scene, a strong Hindi title, warm/cool pigment contrast, everyday Indian nostalgia, generous quiet space, and minimal entry friction. Adapt the subject to a courtyard and cards. The site's truck artwork, music player, listening count, donation control, and audio assets are not part of this game.

### [Deluxe Salon Music](https://deluxesalonmusic.in/)

Observed in Chrome: a vivid painted Indian neighbourhood salon facade, terracotta-red plaster, blue-green details, tropical foliage, people in an everyday social setting, and a very large two-line Hindi title. The site also includes music controls, rain mode, promotional elements, and content below its hero.

Adopt: the sense of a familiar place, painterly ordinary life, tactile colour, confident Devanagari scale, and a scene that feels occupied. For this project, keep the user's explicit **single hero → direct game** flow. Do not bring over the promotional bar, music functionality, extra content sections, or glossy controls.

## Resolved product decisions

| Question | Decision | Reason |
| --- | --- | --- |
| Visual style | Hand-painted Indian courtyard; earthy pigments; block-printed deck | User's latest request and both supplied references |
| Entry flow | `/` → Play → `/play` | Explicitly requested; no extra entry screens |
| Initial preview opponents | 1–5 local virtual family members | A playable preview without requiring a backend or waiting for other people |
| Seats | Every integer 2–6 | Original house-rule contract, including the requested two-person minimum |
| Odd card | One random Jack removed; three remain in play | Original specification and both rules sources |
| Match | Same rank, any suit/colour | Original specification; variations are not active here |
| Draw direction | Next active anticlockwise seat | One tested data model, never inferred from responsive CSS |
| Results | One Chor, everyone else safe | Single-Jack invariant; no misleading “only one winner” claim |
| Preview frontend hosting | Next.js on Vercel | User's later hosting choice supersedes Firebase Hosting |
| Production authority | Future Firebase Auth + Firestore + trusted Cloud Functions | Preserve the specification's private-hand and fair-move boundaries |
| Generated images | Deferred; 15 prompts and exact wired slots | User specifically requested another image-capable agent to supply them |

The Google search results were used to find context, not as an authority for a universal player count or house rule. The implementation follows the explicit specification where sources differ.
