# GULAM CHOR — Browser Multiplayer Card Game

**Version:** 1.1 (traditional-sized rooms; build-ready product and engineering specification)  
**Working title:** Gulam Chor  
**Platform:** Mobile-first web browser / installable PWA  
**Players per room:** **2–6 inclusive** (standard one-deck family-table limit for this product)  
**Preferred technology:** React + TypeScript + Firebase Authentication + Cloud Firestore + Cloud Functions + Firebase Hosting  
**Game type:** Real-time private-room, turn-based, social card game  
**Authoritative game engine:** Firebase Cloud Functions (no self-managed game server)

> **Instruction to the implementation agent:** Build a functioning game from this specification, not just a visual mockup. Every player uses a separate device, sees only their own card faces, and joins the same synchronized room. Handle 2 to 6 players using the exact same rules. The user requested a minimum of 2 and a traditional-sized maximum. Enforce a hard cap of 6 players. Never hard-code four players.

---

## 1. The core concept

Gulam Chor is a multiplayer card game derived from the familiar pair-removal / Old Maid family of games. A standard 52-card deck is shuffled, **one Jack is removed and set aside face-down**, and the **remaining 51 cards** are dealt among the players. Players discard pairs of cards with the same rank, then take turns blindly drawing a card from the next active player on their **left**. Whenever a draw completes a rank-matching pair, the pair is automatically discarded. Players with no remaining cards become **Safe**. The **last player left holding the single unpaired Jack is the Gulam Chor** and **loses** the round. Everyone else wins / is Safe.

This specification defines a consistent digital house-rule variant for implementation. Traditional household variations exist; the UX and exact turn direction below are deliberate choices.

### 1.1 Player count: 2 to 6 (traditional-sized play)

- Play with **2, 3, 4, 5, or 6 people**, each on their own phone. **Six is the maximum room size in v1.**
- Traditional Gulam Chor does not have a single universally fixed upper limit across households. Common one-deck family-game descriptions and online implementations use **2–6** or **3–6** players; keeping two as the minimum also follows the product request.
- A standard 52-card deck minus one Jack leaves **51 playable cards**. This is the **number of cards**, **not the number of supported players**.
- The host can optionally choose a room capacity of **2 to 6**, default **6**. Once the room reaches its chosen capacity, further joins are rejected.
- Do not support 7 or more players in this release, even if it would be mathematically possible to deal cards to them. Do not add extra decks.

---

## 2. Essential rules — source of truth

| Field | Rule |
|---|---|
| Player count | 2–6 users, each on their own phone/browser |
| Cards | Standard 52-card deck (13 ranks × 4 suits) |
| Removed card | One randomly selected Jack, kept out of play, face down |
| Active deck | 51 cards |
| Dealing | Fair round-robin dealing in randomized seat order: player hand sizes differ by at most 1 |
| Initial cleanup | Automatically remove all possible pairs **within each player's hand** |
| Matching | **Same rank** only (for example, 8♣ and 8♥); suits/colors do not matter |
| Three of a kind | Remove one pair and keep the third card |
| Four of a kind | Remove two pairs |
| Turn | Active player draws one unknown card from the nearest other active player to their **left** |
| Visibility | Only a player can see their own card faces; draw targets are shown **face down** |
| Draw result | Add card to drawer's hand; if a rank match now exists, automatically discard exactly one pair |
| Empty hand | Player becomes Safe and is removed from the active-turn rotation |
| Final result | When only one card remains in all players' hands combined, its owner is Gulam Chor and loses |
| Everyone else | Wins / Safe, with optional order-of-finishing leaderboard |
| Discard pile | Matched pairs go into a separate discard pile and **never re-enter the deck** |

**Important:** The player who receives a drawn card may see the face of that card, but other players do not. Never reveal private cards to other players through the UI, API, or database security rules.

### 2.1 Probability and integrity invariant

Removing one Jack makes the card-count parity of Jacks odd (3 remaining); every other rank has four cards. Every matching discard removes exactly two cards of the same rank. Consequently, with valid moves the final remaining card **must be a Jack**, regardless of player count or turn order.

### 2.2 Turn-direction convention

Pick one fixed seating order when the game begins. Define **left** as the next seat anticlockwise around the virtual table (wrap around). On a player's turn:

1. The **current actor** draws from the nearest other **active** player to their left (skip Safe/empty players).
2. The actor's hand updates and automatic pair cleanup resolves.
3. The turn advances to the **next active** seat in that **same anticlockwise direction**. This next player is typically the source of the prior draw, unless that source has become Safe.
4. If the current actor becomes Safe, exclude them while finding the next actor.

This convention must be implemented once as shared, tested engine logic. The rule about drawing from the player to the left must not depend on visual screen orientation.

---

## 3. Player journey / complete application flow

```text
Open website
   ↓
Welcome / Login (Google sign-in OR nickname-based guest sign-in)
   ↓
Home: [Create Room]   [Join Room]   [How to Play]
   ↓
CREATE: choose display name, optional room capacity (2–6), create room
    OR
JOIN: enter 7-character room code or open invite link
   ↓
Room lobby with all connected participants, seating list, Ready controls
   ↓
Every player marks Ready → Host taps Start Game (minimum 2 players)
   ↓
Synchronized full-screen shuffling animation
   ↓
One random Jack is removed from the 52-card deck (face-down)
   ↓
51 cards visibly fly/deal to the participating seats
   ↓
Each player sees their own cards and automatic pair-discard animation
   ↓
Turns begin: see own hand + opponent counts + current draw target
   ↓
On your turn, choose one face-down card from the left player's fan
   ↓
Card animates to your hand; matching pair automatically discards
   ↓
Empty-hand players become Safe; turns skip them
   ↓
Last one holding the unmatched Jack becomes GULAM CHOR
   ↓
Results: reveal odd Jack, show Safe players / Chor, Play Again, Exit
```

### 3.1 Account and identity

- Sign-in is required to establish a persistent user ID. Implement Firebase Authentication with **anonymous guest sign-in** and optionally Google sign-in.
- Guest flow: user types a display name; Firebase Anonymous Auth creates `uid` behind the scenes (no account/password friction). Google sign-in is an optional alternative, not a requirement to join a room.
- A player's `uid` is the identity key. Do not identify players by nicknames or phone numbers.
- A user may belong to a room from one browser at a time during a round; define behavior for multiple tabs (show warning, use latest connected session or read-only secondary tab).

---

## 4. Screen-by-screen mobile UI specification

### 4.1 Screen A — Welcome / Home

**Goal:** Enter a game in seconds.

- Dark card-table-inspired visual language (midnight navy / forest green), warm gold highlight, clear white text, restrained glow; visually polished but fast on low-end phones.
- Title **GULAM CHOR** and small subtitle **Don't be the last one holding the Jack.**
- Big primary action: **Create Room**.
- Secondary action: **Join Room**.
- Tertiary actions: **How to Play**, sound setting, optional account/profile.
- Display current nickname and edit option.
- Responsive portrait-first layout, minimum comfortable 44px touch targets.

### 4.2 Screen B — Create Room

**Inputs:** nickname (if needed), optional room name, room capacity segmented selector/dropdown **2–6**, default **6**; guest room invite by code.

**Actions:** **Create & Enter Lobby**, Back.

**Response:** Backend generates a unique, hard-to-guess 7-character uppercase room code avoiding ambiguous characters; room ID and code are distinct. Navigate to `/room/{roomCode}`.

### 4.3 Screen C — Join Room

- Single field for room code (uppercase, forgiving whitespace and hyphens) or automatic deep-link join.
- **Join Room** button.
- Validate not found, game started, full, closed, duplicate user, or expired.
- No need for everyone to be physically together; all players need internet access.
- `Share invite` uses Web Share API when available, with copy-link fallback.

### 4.4 Screen D — Lobby

**Top:** room code + tap-to-copy, sharing button, player count `current / maxPlayers`.

**Middle:** adaptive list/grid of player avatars and nicknames, Host crown, Ready / Not Ready, connection status. For 2–6 players, show all occupied seats clearly in a responsive grid or compact circular arrangement; no virtualization is necessary.

**Bottom:**

- Each non-host taps **I'm Ready** or **Cancel Ready**.
- The host also sets Ready; host-only **Start Game** enabled when `playerCount >= 2`, every participant is Ready, no round running, and `playerCount <= configuredCapacity`.
- Host can remove a player from lobby before start; transfer host when original host leaves.
- Player leaving before start is removed from lobby; joining after start is blocked.

**Fast synchronization:** Player joins and readiness updates live on everyone else's screens via Firestore listeners.

### 4.5 Screen E — Cinematic opening (synchronized across devices)

Sequence (indicative; keep animations configurable and skippable via reduced-motion setting):

1. A stack of 52 cards appears in the central table area.
2. Cards shuffle, riffle and rotate for ~2.5 seconds.
3. **One Jack slides out face-down** to a side tray marked **Removed**. Do not reveal which suit until the results screen.
4. The remaining 51 cards visually deal into every occupied seat. On a 2–6-player room, animate deals into exactly the occupied seats (two to six visible destinations). Use responsive positions so a six-player table remains legible on a phone.
5. On each player's phone, their cards settle into a readable face-up hand at screen bottom; all other players' cards remain face-down or just represented by card counts.
6. Rank-matching pairs fly into the **Discard Pile** in the center.
7. Highlight randomly selected starter. Overlay: **Your turn** / **Waiting for [player]**.

**Critical:** Animations are client presentation only. Cloud Functions create and persist the authoritative deck, hands, first turn, and valid moves **before** animation starts. Every device receives a server-sourced start timestamp and derives its stage timeline from that time. On refresh/late entry, skip ahead to current true phase. Never use a client-side animation callback to authorize a game action.

### 4.6 Screen F — Active game table

**Mobile portrait layout (illustrative):**

```text
┌─────────────────────────────────┐
│ GULAM CHOR  Room: X7K9Q2P   ⚙ │
│ Turn 05    4 players   ♠ 27 left│
├─────────────────────────────────┤
│ [Player strip: avatars + counts]│
│  ◉ Current Player     ✦ Target │
│                                 │
│       [Discarded pairs]         │
│         12 pairs                │
│                                 │
│   DRAW FROM: PRIYA  (4 cards)   │
│    [▧]  [▧]  [▧]  [▧]          │
│  Tap one FACE-DOWN card to draw │
│                                 │
├─────────────────────────────────┤
│ YOUR HAND (scroll / fan)        │
│ [7♥] [J♠] [K♣] [2♦] [10♠]     │
│  Shuffle Hand          ♫        │
│           [Your turn]           │
└─────────────────────────────────┘
```

- **My hand is always at the bottom** and face-up only on my device.
- Remaining opponents appear at top as **face-down counts** and status chips; never show other people's face values.
- Current actor and designated draw target are prominently highlighted.
- Only the current actor sees an **interactive face-down fan** for their eligible left-side target. All others see it as noninteractive spectator state.
- Face-down fan count equals **exactly** the target's current hand count. The fan is visually reversed/facing away from the picker, echoing the real-life act of picking from another hand.
- Picker taps one position/slot; animate chosen back moving into own hand; reveal face to drawer only; if matched, both cards move into central discard pile.
- Other clients see a generic **back-of-card transfer** and a public discard animation, never the secret unpaired card face.
- The central pile is a **discard** pile, not an active main draw deck. Draws exclusively come from players' hands.
- Display `Cards remaining`, recent public pair-discarded rank, and safe-player list.
- When your hand is empty, show **You're Safe!** and maintain a spectator view of the ongoing round.
- For all 2–6-player layouts, show every player without scrolling the entire table. In narrow portrait mode, use a top row/arc of opponents with a focused target fan in the center; always highlight **Me**, **Current player**, and **My draw target**.

### 4.6.1 Responsive seat layouts for the full supported player range

| Joined players | Seating / animation layout |
|---|---|
| 2 | One opponent opposite the local player; large face-down draw fan |
| 3 | Triangle arrangement; local player's hand remains anchored to bottom |
| 4 | Four-seat virtual table; cards appear to deal toward four seats |
| 5 | Five-seat arc/ring with clear individual avatars and card counts |
| 6 | Six-seat ring with compact avatars; central active draw fan stays comfortably tappable |

Everyone sees the same table **seat order**, rotated so their own hand is at the bottom on their own device. Left-draw selection comes from backend seat order, not visual CSS positions. The app must never render extra ghost seats or make the layout require 7+ players.

### 4.7 Screen G — Results

- Reveal the remaining Jack and the originally removed Jack, each with suit.
- Show **GULAM CHOR** with loser avatar / nickname and subtle comic defeat animation.
- Show every other participant as **Safe** (winner). Optionally show first-to-safe ordering, without claiming it is an objective points ranking.
- Buttons: **Play Again** (host initiates new ready lobby), **Share Result** (text summary, no sensitive details), **Leave Room**.
- Rematch uses fresh randomness, fresh removed Jack, fresh shuffle, fresh starting seat, and preserves room membership.

### 4.8 Tablet, landscape, and desktop behavior

- Desktop/tablet: use a wider virtual table and visible seat constellation.
- Mobile portrait: stacked layout with bottom hand, focused target fan, horizontal player strip.
- No hover-only controls. Ensure readable text and card rank/suit markings on small screens, respect safe areas/notches, avoid mobile browser address-bar jumps.

---

## 5. Interaction and animation states

| Game state | Visible to players | Allowed action |
|---|---|---|
| `LOBBY` | Player list, room code, readiness | Join, ready, share, host start |
| `DEALING` | Shuffle, Jack removal, animated deal, automatic pairs | Observe / reduce motion / reconnect |
| `PLAYING` — my turn | Own cards and active left-target card backs | Select **one** target slot; optionally shuffle own hand |
| `PLAYING` — other turn | Own hand and table status | Wait; optionally shuffle own hand (if not target in a committed draw) |
| `SAFE` | Safe banner, ongoing public table | Spectate / chat emotes if added |
| `FINISHED` | Loser / winners / final Jack | Rematch or exit |
| `ABANDONED` | Round ended exceptionally | Return to lobby / exit |

**UX behaviors:**

- Lock input immediately after selecting a slot; show pending indicator and deduplicate retries.
- Animate state transitions using server-confirmed events, not speculative local card ownership.
- Sound and haptics are optional and must be toggleable.
- A user with reduced motion enabled sees instantaneous deal/draw transitions plus a concise status cue.
- Keep a short, chronological public event feed for reconnect and animations (`round_started`, `dealt`, `pair_discarded`, `card_drawn`, `player_safe`, `round_finished`). The feed must not reveal private card values.

---

## 6. Multiplayer architecture — Firebase only (serverless)

**Short answer:** You do **not** need to build, deploy, or maintain a dedicated Node.js/Express game server. You **do** need trusted server-side execution for a fair game. Firebase provides it as managed Cloud Functions.

```text
Browser / Mobile PWA
    │
    ├─ Firebase Authentication
    │   └─ anonymous nickname guest and optional Google identity
    │
    ├─ Firestore realtime listeners
    │   ├─ room metadata, lobby, public players, turn status, events
    │   └─ ONLY this logged-in player's private hand
    │
    └─ HTTPS Callable Cloud Functions
        ├─ createRoom, joinRoom, setReady, startRound
        ├─ drawCard, shuffleHand, leaveRoom
        └─ beginRematch, endInactiveRoom
                       │
                       └─ Firestore (transactions + strict security rules)
```

**Services:**

- **Firebase Hosting** — hosts web assets; deploy SPA with appropriate rewrite.
- **Firebase Authentication** — unique, authenticated client identity.
- **Cloud Firestore** — room data, public state, restricted own-hand records, real-time changes and result history.
- **Cloud Functions for Firebase (callable, 2nd gen)** — trusted room validation, random deck creation, card dealing, move validation, automatic pairing, turn advancement, result calculation. Uses Firebase Admin SDK; the client must never choose a secret card directly.
- **Firebase App Check** — useful defense-in-depth for production abuse control, **not** a substitute for authentication or server validation.

**Cost/plan:** Firestore and Hosting can be inexpensive for small usage, but Cloud Functions generally requires the Firebase **Blaze pay-as-you-go** plan (which may have no-cost usage allowances). Turn on budgets/alerts and monitor Firestore reads/writes and function execution. 'No self-managed server' does **not** mean 'no backend' or guaranteed zero cost.

**Firestore-only prototype:** Client-writable Firestore can reproduce basic synchronization, but it cannot reliably hide all opponents' card identities while also letting untrusted clients shuffle and deal, enforce turns, and prevent fake card writes. Do not present this approach as cheat-resistant. The production MVP should use Cloud Functions.

---

## 7. Firestore data model

Suggested collection hierarchy (adjust details consistently, but preserve visibility boundaries):

```text
rooms/{roomId}                        // members-only public room status
rooms/{roomId}/players/{uid}          // members-only public player profile/state
rooms/{roomId}/hands/{uid}            // readable ONLY by that uid; server writes
rooms/{roomId}/private/engine         // readable/writable ONLY by Admin SDK backend
rooms/{roomId}/events/{eventId}       // members-only public sanitized events
rooms/{roomId}/rounds/{roundId}       // members-only non-secret completed result
users/{uid}                           // own user preferences and profile
```

### 7.1 Public room document `rooms/{roomId}`

```json
{
  "code": "X7K9Q2P",
  "hostUid": "uid_A",
  "status": "LOBBY",
  "roundId": null,
  "maxPlayers": 6,
  "playerCount": 4,
  "seatOrder": ["uid_A", "uid_B", "uid_C", "uid_D"],
  "currentTurnUid": null,
  "currentDrawTargetUid": null,
  "turnNumber": 0,
  "activePlayers": 4,
  "remainingCards": 51,
  "discardedPairs": 0,
  "animationStartAt": null,
  "nextActionAllowedAt": null,
  "lastMoveAt": null,
  "roundWinnerUids": [],
  "chorUid": null,
  "version": 1,
  "createdAt": "<server timestamp>",
  "updatedAt": "<server timestamp>"
}
```

- All counters are backend-owned. `seatOrder` length at most 6.
- `remainingCards = sum(all player hand sizes)`; initially 51, then declines by exactly 2 for every discarded pair; on conclusion it is 1.
- `discardedPairs = (51 - remainingCards) / 2`, so 25 pairs at the end.
- Don't store active identities or private card values in public fields.
- If lobby exposes a joinable room code, nonmembers can only join through the `joinRoom` function, which checks it securely; don't enable unrestricted Firestore discovery.

### 7.2 Public player document `rooms/{roomId}/players/{uid}`

```json
{
  "uid": "uid_A",
  "nickname": "Aarav",
  "seatIndex": 0,
  "isHost": true,
  "ready": false,
  "status": "LOBBY",
  "handCount": 0,
  "connection": "CONNECTED",
  "safeOrder": null,
  "joinedAt": "<server timestamp>"
}
```

### 7.3 Per-player **private hand**

`rooms/{roomId}/hands/{uid}`:

```json
{
  "roundId": "round_001",
  "cards": ["7H", "JS", "KC", "2D"],
  "handVersion": 9,
  "updatedAt": "<server timestamp>"
}
```

- This document is readable by the owning authenticated player only, even when five other people are in the room.
- Direct **client writes must be denied**. Functions update it transactionally with authoritative engine data.
- The private engine stores canonical `handsByUid` and per-turn mapping `drawSlotPermutation` / slot tokens, keyed to a `turnId` and version. It also stores the secret removed Jack and shuffled deck state until finishing.
- The only place that exposes the currently drawable card backs to a picker is a sanitized integer `drawCount` in public room/target state or a callable payload; do **not** expose other players' actual card IDs.

### 7.4 Events

For public `card_drawn` events, include `actorUid`, `targetUid`, time, resulting counts, and whether a pair was discarded. **Never** include the card face if the drawn card was retained unmatched. For a discarded pair, exposing rank after discard is an optional rule; v1 can reveal the discard pair rank because both cards have left hands, but the UI must ensure there is no remaining hidden identity leaked.

### 7.5 Firestore Security Rules (design requirements)

- All reads of room and public player docs require membership (validated with a corresponding player doc and authenticated `uid`).
- A player may read `hands/{theirOwnUid}` and never `hands/{anotherUid}`.
- `private/engine` and all other secret documents: **deny all browser/client reads and writes**.
- All room game-state writes, player status changes, cards, events, and result mutations occur only through callable backend functions using Admin SDK.
- `users/{uid}` can be read/edited only by that user for harmless preferences/identity fields.
- Ensure `get`/`list` restrictions prevent querying collections to discover secrets; rules are **not** a post-query filter.
- Keep room-code lookup in trusted backend, not public Firestore document queries.

---

## 8. Trusted Cloud Functions / API contract

Every callable checks Firebase Auth, request input schema, room membership (when relevant), room state, room capacity, and rate limits. Return stable machine-readable errors and do not reveal private state in errors.

| Callable | Input | Validates | Effect |
|---|---|---|---|
| `createRoom` | `nickname`, `maxPlayers` (2–6) | authenticated, valid name/cap | generates room/code, host and seat 0 |
| `joinRoom` | `code`, `nickname` | valid active code, room lobby, free seat, not duplicate | adds player, assigned seat, updates count |
| `setReady` | `roomId`, `ready` | member, lobby | updates ready state |
| `startRound` | `roomId`, `requestId` | host, 2–6, everyone ready, no round active | creates 52, removes Jack, shuffles/deals 51, initial pairs, starter, publishes animation state |
| `drawCard` | `roomId`, `roundId`, `turnId`, `slotIndex`, `requestId` | current actor, expected turn, valid slot, no duplicate, target active | atomically moves card, auto-pairs, marks Safe, advances turn, emits sanitized event |
| `shuffleHand` | `roomId`, `roundId` | member, round active, not colliding with committed draw | optionally reorders **own private displayed hand**, no card-value change |
| `leaveRoom` | `roomId` | member | remove from lobby; during round mark disconnected rather than delete secret cards |
| `startRematch` | `roomId` | host, prior round finished | returns everyone to lobby/unready, resets counts, retains membership |
| `closeRoom` | `roomId` | host or cleanup | closes stale rooms safely |

**Important nuance:** A player clicking the fourth face-down card is sending a **slot index**, not a card ID. The backend owns the slot-to-card mapping and the target's actual cards. On every new turn, generate an unpredictable server-side shuffle of the target's hand positions, fix it for that turn, and reveal only the number of selectable card backs to the actor.

**Idempotency:** Each draw has a client-generated unique `requestId`. Record processed requests (per round/turn) so retrying after a network timeout cannot remove a second card. Validate monotonic `turnId` and `roundId`, and use a Firestore transaction to prevent simultaneous valid draws.

---

## 9. Game engine pseudocode

### 9.1 Starting a round

```ts
function startRound(room) {
  assert(room.status === "LOBBY");
  assert(room.players.length >= 2 && room.players.length <= 6);
  assert(room.players.every(p => p.ready));
  assert(requesterIsHost());

  const fullDeck = makeStandard52CardDeck();
  const jacks = fullDeck.filter(card => card.rank === "J");
  const removedJack = secureRandomChoice(jacks);
  const playingDeck = secureShuffle(fullDeck.filter(c => c.id !== removedJack.id));
  assert(playingDeck.length === 51);

  const orderedPlayers = secureShuffle(room.players); // or fixed lobby seat order
  const hands = roundRobinDeal(playingDeck, orderedPlayers);

  const discarded = [];
  for (const uid of orderedPlayers) {
    const { kept, pairs } = discardAllRankPairs(hands[uid]);
    hands[uid] = kept;
    discarded.push(...pairs);
  }

  const activeUids = orderedPlayers.filter(uid => hands[uid].length > 0);
  const starter = secureRandomChoice(activeUids);
  // Persist all hands privately, room public state, removedJack in private engine,
  // and synchronized animationStartAt in a trusted atomic operation.
  // If only one hand/card remains, finish immediately after the animation stage.
}
```

### 9.2 Selecting a card

```ts
async function drawCard(roomId, actorUid, roundId, turnId, slotIndex, requestId) {
  return firestoreTransaction(async tx => {
    const { publicRoom, engine, handDocs, requestRecord } = await readAllFirst(tx);
    if (requestRecord?.completed) return requestRecord.previousResult;

    assert(publicRoom.status === "PLAYING");
    assert(publicRoom.roundId === roundId);
    assert(publicRoom.currentTurnUid === actorUid);
    assert(engine.turnId === turnId);
    assert(now() >= publicRoom.nextActionAllowedAt);

    const targetUid = nextActivePlayerToLeft(actorUid, engine.seatOrder, engine.hands);
    const permutedTargetHand = engine.drawSlotPermutation; // backend-only
    assert(slotIndex >= 0 && slotIndex < permutedTargetHand.length);
    const chosenCardId = permutedTargetHand[slotIndex];
    assert(engine.hands[targetUid].includes(chosenCardId));

    removeExactlyOne(engine.hands[targetUid], chosenCardId);
    engine.hands[actorUid].push(chosenCardId);

    const newlyDiscardedPair = discardMatchingPairForDrawnCard(engine.hands[actorUid], chosenCardId);
    if (newlyDiscardedPair) engine.discardedPairs.push(newlyDiscardedPair);

    for (const uid of [actorUid, targetUid]) {
      if (engine.hands[uid].length === 0) markSafe(uid);
    }

    if (sumHandCounts(engine.hands) === 1) {
      finishRoundWithLastJackHolder(engine);
    } else {
      const nextActorUid = nextActivePlayerToLeft(actorUid, engine.seatOrder, engine.hands);
      setNextTurnAndRandomizedDrawSlotPermutation(nextActorUid);
    }

    // Only after all transaction reads, write engine, own-hand docs,
    // room/players public counts, result or next turn, event, idempotency key.
    // Return outcome visible to this actor; do not publish private faces publicly.
    return sanitizedActorResult();
  });
}
```

**Implementation caveat:** Structure transaction reads before any writes. Resolve all affected player docs, including the next actor/target when necessary, before staging writes. Don't rely on randomly re-running side effects in a retrying Firestore transaction. Generate RNG safely outside the transaction or use retry-stable, trusted values that cannot be influenced by the client.

### 9.3 Ranks, suits, and exact pairing behavior

- Card ranks: `A`, `2`...`10`, `J`, `Q`, `K`.
- Card suits: `S` (♠), `H` (♥), `D` (♦), `C` (♣).
- Unique identifiers: `JS`, `JH`, `JD`, `JC`, etc.
- A pair is two cards with **equal rank**, irrespective of suit.
- After dealing, discard every possible pair in each individual hand, leaving zero or one card of any given rank.
- After a draw, at most one rank match arises; remove exactly the new card and its same-rank partner. Do not allow manual discard manipulation in v1.
- **One designated Jack is removed before dealing**, face down. Do not remove all Jacks. The final loser must be holding one of the three remaining Jacks.

### 9.4 Never leak private card identifiers

Public state, events, timestamps, callable responses to other players, logs visible to users, room invites, and user-facing error messages must **never contain** the engine hands map, remaining Jack location, secret removed card, or draw-slot mapping.

---

## 10. Fairness and anti-cheat

1. Server-side cryptographically strong shuffle / random selection (not predictable `Math.random` for secure fairness logic).
2. Card dealing and one-Jack removal occur only in trusted Cloud Functions.
3. No client can write to room, hand, score, or engine state directly.
4. Move accepted only for `currentTurnUid`, current `turnId`, and the correct left target.
5. Slot indices are mapped to server-hidden target cards; clients receive card backs/counts only.
6. Function responses return the new drawn card to the **actor**, and updated private hand is visible only to actor; all others receive sanitized public events.
7. Explicit Firestore Security Rules tests proving unauthorized hand reads fail.
8. Rate-limit room-code guessing / create spam / callable requests.
9. Basic abuse defenses: Firebase App Check, throttles, request size validation, and room inactivity cleanup.
10. Prevent multiple tabs from giving duplicate valid actions via backend idempotency and monotonic turn versions.

---

## 11. Disconnections, timeouts, and edge cases

### 11.1 Reconnection

- Refreshing the browser should recover authentication, locate active room, fetch room + private hand, and display the **current live state**, not replay from beginning.
- A member who disconnects temporarily **keeps their cards**. Removing them or discarding their cards mid-round would break the odd-Jack mathematics.
- Backend may mark a stale player `DISCONNECTED`; treat this as informational until reliable activity checks are available.

### 11.2 Inactive player's turn

A round must not freeze forever. Define an optional **turn timeout** (e.g. 20–30 seconds) and a scheduled/server-authoritative **auto-draw random slot** on behalf of that player. This action uses the same validated engine path as a real draw, with actor marked as auto-play. Make timeouts configurable and include a visible countdown. Client clocks do not dictate expiration or enforce turns. Do not use a browser `setTimeout` as the sole authority.

For all room sizes from 2–6, retain fair server-controlled decisions and a clear, visible timeout for disconnected or inactive players.

### 11.3 Edge-case behavior

- **Exactly 2 players:** both alternate until one has the Jack and loses.
- **Exactly 6 players:** all six occupied seats are visible; 51 dealt cards give initial hand sizes of either eight or nine cards before automatic pair removal.
- **Uneven deal:** with 51 cards, distribution differs by at most one card.
- **User has 0 cards immediately after initial cleanup:** mark Safe before first playable turn.
- **Target becomes empty after someone draws:** target becomes Safe and is skipped in future turn targeting.
- **Actor empties their own hand:** mark Safe and advance to the nearest still-active seat.
- **Only one card remains after initial cleanup:** finish once the intro is over; no pointless extra turns.
- **Two clients click at the same time / retry:** only one valid action per turn succeeds, by transaction and idempotency.
- **Host leaves mid-round:** transfer host privileges for rematch and lobby management; do not reset active cards.
- **Join after start:** reject cleanly with option to join future rematch if invited.
- **Player count below 2 before start:** Start disabled.
- **All players become Safe:** logically impossible with the one-Jack invariant; detect and log as an engine corruption error.
- **Abandonment / prolonged backend inactivity:** close as `ABANDONED` explicitly; do not declare a false Chor/winner.

### 11.4 Screen locking and network interruptions

- On slow network, show pending state and prevent repeat taps.
- Firestore listener stream might be delayed; callable response and authoritative event/version reconcile the UI.
- Reconnect restores from current Firestore snapshot rather than trusting local cache for card ownership.
- If device goes offline during a draw request, show **Reconnecting** and never apply irreversible speculative client-only moves.

---

## 12. Room codes and lifecycle

- Room code example: `X7K9Q2P`, generate with cryptographic randomness, collisions checked in trusted backend.
- Codes are case-insensitive for input and uppercase for display.
- Invite URL example: `https://YOUR_DOMAIN/join/X7K9Q2P`.
- Each unique code maps to a private room ID, with expiration and server-enforced status.
- A room has one host, but game turns are never controlled by host authority once started.
- Clean up expired or long-idle rooms and ephemeral events using backend-admin processes / Firestore TTL where appropriate; never inadvertently delete an active room.
- Host can start only with 2–6 Ready members and within configured room capacity.
- Support multiple independent rooms simultaneously.

---

## 13. Recommended React frontend structure

```text
src/
  app/
    router.tsx
    auth/
    home/
    room-create/
    room-join/
    lobby/
    game/
    results/
  components/
    PlayingCard.tsx
    CardBack.tsx
    PlayerBadge.tsx
    LobbyPlayerList.tsx
    HandFan.tsx
    OpponentDrawFan.tsx
    DiscardPile.tsx
    DealAnimation.tsx
    TablePlayerStrip.tsx
    RoomCodeShare.tsx
    TurnBanner.tsx
  hooks/
    useAuth.ts
    useRoom.ts
    useOwnHand.ts
    usePublicEvents.ts
  lib/
    firebase.ts
    roomFunctions.ts
    gameViewModel.ts
    animationTimeline.ts
  styles/
    tokens.css
functions/src/
  callables/
    createRoom.ts
    joinRoom.ts
    setReady.ts
    startRound.ts
    drawCard.ts
    startRematch.ts
  engine/
    deck.ts
    shuffling.ts
    pairing.ts
    seatRotation.ts
    applyMove.ts
    invariants.ts
  security/
    validate.ts
    rateLimit.ts
firestore.rules
firestore.indexes.json
firebase.json
```

- React + TypeScript + Vite preferred for simplicity, or Next.js if SSR requirements emerge. PWA installability is nice to have, not a prerequisite for v1.
- Reusable playing-card components with SVG/CSS instead of depending on copyrighted external card art.
- Use CSS transforms and Framer Motion or Motion for rich transitions, while respecting reduced-motion settings.
- Subscribe to room, own-hand and sanitized-event updates. Avoid subscribing to every private hand.
- Keep all 2–6 player seats visibly accessible on screen. Use GPU-friendly card animations; reduced-motion and low-end mobile performance should still be tested.

---

## 14. Design system / visual direction

**Style:** premium contemporary digital card room, refined gradients, polished micro-animations; lively without becoming a casino/gambling UI.

- Background: deep green / navy table surface, low-contrast texture.
- Accent: muted gold for active turn, teal for Safe status, crimson selectively for final Chor state.
- Cards: clear high-contrast rank/suit icons; white faces; shared branded pattern on backs.
- Layout: bottom 28–35% of mobile viewport is dedicated to the player's own hand; middle region focuses on the draw target; top strip displays players and game status.
- Fan behavior: responsive overlap when own hand is large, tap-to-expand, swipe horizontal scroller instead of shrinking all 26 cards unreadably for 2-player rooms.
- Accessibility: not reliant solely on color, screen-reader labels for card ranks, explicit `Draw card 3 of 5` labels, contrast checks, and generous tap targets.
- State presentation: active turn glow, distinct disabled backs, short feedback on discarded pairs.
- When a 2-player round begins, make the other player's fan large and central; for 3–6 players arrange the occupied seats around a responsive virtual table, always keeping the local hand and current draw target prominent.

---

## 15. Testing and acceptance criteria

### Game logic unit tests

- Deck contains all 52 unique cards before removal; exactly one Jack removed; exactly 51 cards dealt.
- For each valid room size **2 through 6**, every player receives at least one card and every card belongs to exactly one hand before cleanup.
- Distribution difference between maximum and minimum hand sizes is at most 1.
- Pair cleanup only matches same rank and removes 2 cards at a time.
- Three-of-a-kind produces one pair plus one card; four-of-a-kind produces two pairs.
- Turn selection skips Safe players, wraps around seating, and always targets the next active seat on the left.
- A player becomes Safe exactly when their hand becomes empty.
- Total card integrity: `all hands + discarded cards + removed Jack = original 52 unique cards`, with no duplicates ever.
- A completed non-abandoned round has **exactly one Jack remaining in hands**, 25 discarded pairs, 1 removed Jack and 1 loser.
- HandCount and UI counters agree with canonical engine.
- Repeated request IDs never produce a second draw.

### Multiplayer integration tests

- Create/join/readiness and start with **2**, **3**, **4**, **5**, and **6** devices/clients.
- No one can see another player's hand, even by directly querying Firestore SDK or network endpoints.
- Drawing off-turn or selecting invalid `slotIndex` gets rejected.
- Two conflicting draws for the same turn cannot both succeed.
- Reconnect after refresh yields the current state and correct private hand.
- Six-player lobby, game table, and dealing animations remain readable on narrow mobile screens; benchmark listener overhead, write latency, and updates across six devices.
- Finish and rematch work without stale cards or old events contaminating the next round.
- Verify reduced-motion and mobile accessibility flows.

### Acceptance checklist

- [ ] Anyone can create a private room and share a code or link.
- [ ] **Any integer player count from 2 to 6** can join and start (subject to host capacity setting).
- [ ] Every player uses their own browser/device.
- [ ] Shuffle → remove one Jack → deal 51 cards → auto-discard matches plays on all screens.
- [ ] Own hand is at bottom and revealed only to its owner.
- [ ] Current player taps exactly one of the left neighbor's face-down card slots.
- [ ] Cards move and pairs discard automatically on the backend.
- [ ] Safe players are excluded from subsequent turns.
- [ ] Only the final player holding the unmatched Jack loses and is named Gulam Chor.
- [ ] Rematch works with the same lobby and fresh cards.
- [ ] Every secret card path and backend action is appropriately protected.

---

## 16. Build sequence for Codex / implementation milestones

**Milestone 1 — Project bootstrap:** React + TypeScript frontend, Firebase project wiring, Auth, env/example, Emulator Suite config, hosting and routes. Add setup README with exact commands.

**Milestone 2 — Room flow:** Home, Create, Join, Lobby, invite share, host/Ready, room capacity 2–6, multi-device realtime listeners.

**Milestone 3 — Secure rules engine:** Trusted Cloud Functions, deck creation, Jack removal, round-robin deal, initial pairs, seat rotation, blind draw slot mapping, pair discard, safe/win/lose conditions, unit tests.

**Milestone 4 — Real multiplayer:** Private hand subscriptions, public game state, turn and draw actions, idempotency, transactions, reconnect logic.

**Milestone 5 — Animated UI:** Shuffle, face-down Jack removal, variable-seat dealing, pair discard, opponent reverse-facing fan, responsive table, Safe and Results screens.

**Milestone 6 — Production hardening:** Security Rules and emulator tests, abuse prevention, timeout/auto-turn, listener cost audit, accessibility, performance testing up to 6 players, deployed HTTPS build.

---

## 17. Explicit decisions and future enhancements

### Fixed decisions for v1

- Product name **Gulam Chor**.
- **Minimum 2**, **maximum 6**, a single normal deck.
- **One Jack removed** face-down, not one Ace.
- Pair by **rank**, not suit/color.
- Blind draw from next active player on the **left**.
- Automatically discard pairs (no manual player confirmation).
- Last owner of a Jack loses; all other players are Safe.
- No betting, real money, in-app gambling, or pay-to-win mechanics.
- Cloud Functions own every security-sensitive action.

### Optional post-v1 features (do not block MVP)

- Match series of 3, 5 or 10 rounds and fewest Chor losses leaderboard.
- Emotes, reactions, custom card-back themes and private room themes.
- Friends/recent rooms, join-by-QR, spectator mode and accessibility preferences.
- Resumable guest sessions, persistent account stats, achievement badges.
- Custom table rules: randomly remove an unknown card instead of a Jack (different game variant).
- Alternative drawing direction, locally configurable only before the match starts.
- Any 7+ player mode is out of scope. Preserve the familiar, small-group, one-deck Gulam Chor experience.

---

## 18. Implementation-agent brief (copy into Codex if useful)

> Build a complete responsive, multiplayer browser-based Gulam Chor game from `Gulam_Chor_Game_Design_and_Build_Spec.md`. Use Firebase Auth, Firestore, Cloud Functions (callable 2nd gen) and Hosting. Support **2 to 6 players**, never just four; reject joins beyond the configured capacity and enforce a hard room cap of six. Create secure room-code joins and a Ready lobby, synchronize shuffle/deal/Jack-removal animations, keep each player's hand confidential, and implement a backend-authoritative pair-matching blind-draw game. The current actor sees the left player's cards only as selectable backs; server maps selected slot to actual card and automatically removes rank-matching pairs. The final player holding the unmatched Jack is Gulam Chor and loses. Implement the full UI, security rules, tests and emulator instructions. Favor an actual working end-to-end product over mock/demo buttons. If Firebase credentials are unavailable, supply `.env.example`, emulator setup and clear configuration steps without hard-coding secrets.

---

## 19. Reference reading (non-binding; implementation spec above wins when house rules differ)

- Gulam Chor pairing and Jack-removal description: https://cheettukali.com/gulam-chor/rules/
- Gulam Chor variants and typical 2–6-player play: https://nepali.games/gulam-chor/how-to-play
- Another one-deck 2–6-player Gulam Chor implementation: https://lazypatta.com/en/how-to-play/gadha-chor
- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firestore Security Rules for queries: https://firebase.google.com/docs/firestore/security/rules-query
- Cloud Functions callable requests: https://firebase.google.com/docs/functions/callable
- Firebase pricing: https://firebase.google.com/pricing

**Note on tradition:** Gulam Chor house rules vary, and there is no universally agreed player maximum. This product deliberately adopts a familiar **2–6 player** range, with a recommended group of 3–6. The **51** refers only to the cards remaining after removal of one Jack. Do not use the theoretical number of dealable cards as the maximum number of people.

---

**Document status:** Ready for engineering kickoff. Naming, backend fairness, 2–6 room capacity, UI flow, game rules, winner/loser handling and v1 boundaries are specified.
