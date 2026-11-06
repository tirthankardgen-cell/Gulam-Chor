// Runs against the local Firebase emulators by default. --live is explicit.
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously, deleteUser } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator, get, ref, onValue, set, serverTimestamp } from "firebase/database";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

const live = process.argv.includes("--live");
const counts = (process.argv.find(a => a.startsWith("--counts="))?.split("=")[1] || "2,3,4,5,6").split(",").map(Number);
assert.ok(counts.every(n => Number.isInteger(n) && n >= 2 && n <= 6));
const config = live ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} : { apiKey: "demo-key", projectId: "demo-gulam-chor", databaseURL: "https://demo-gulam-chor-default-rtdb.firebaseio.com", appId: "demo-app" };
if (live) assert.equal(config.projectId, "gulam-chor", "Live tests are scoped to gulam-chor");
const players = [];
const rooms = new Map();
const watches = [];
async function player(index, signIn = true) {
  const app = initializeApp(config, `integration-${Date.now()}-${index}`);
  const auth = getAuth(app), db = getDatabase(app), functions = getFunctions(app, "us-central1");
  if (!live) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
  if (signIn) await signInAnonymously(auth);
  const call = httpsCallable(functions, "roomAction", { timeout: 30000 });
  const p = { app, auth, db, call: async (command) => (await call(command)).data };
  players.push(p);
  return p;
}
async function read(p, code, path = "public") {
  const snap = await get(ref(p.db, `rooms/${code}/${path}`));
  return snap.exists() ? JSON.parse(snap.val()) : null;
}
async function denied(p, path, write = false) {
  const token = p.auth.currentUser ? await p.auth.currentUser.getIdToken() : "";
  const base = live ? config.databaseURL : "http://127.0.0.1:9000";
  const url = new URL(`${base}/${path}.json`);
  if (!live) url.searchParams.set("ns", "demo-gulam-chor-default-rtdb");
  if (token) url.searchParams.set("auth", token);
  const response = await fetch(url, { method: write ? "PUT" : "GET", body: write ? JSON.stringify("tampered") : undefined });
  assert.ok([401, 403].includes(response.status), `${write ? "write" : "read"} must be denied at ${path}`);
}
async function waitUntil(predicate, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${label}`);
    await delay(30);
  }
}

try {
  for (let i = 0; i < 7; i++) await player(i);
  const outsider = players[6];
  const unauthenticated = await player(7, false);
  await assert.rejects(unauthenticated.call({ action: "create", name: "Guest", avatar: "you" }), /reconnect|unauthenticated/i);
  for (const count of counts) {
    const host = players[0];
    const { code } = await host.call({ action: "create", name: "Test host", avatar: "raju" });
    rooms.set(code, host);
    assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
    assert.equal((await host.call({ action: "create", name: "Test host", avatar: "raju" })).code, code);
    await denied(outsider, `rooms/${code}/public`);
    await denied(unauthenticated, `rooms/${code}/public`);
    await Promise.all(players.slice(1, count).map((p, i) => p.call({ action: "join", code, name: `Test friend ${i + 1}`, avatar: "dadi" })));
    let view = await read(host, code);
    assert.equal(view.players.length, count, "Concurrent joins must preserve all seats");
    await denied(host, "rooms");
    await denied(host, `rooms/${code}/secret`);
    await denied(host, `rooms/${code}/hands/${players[1].auth.currentUser.uid}`);
    await denied(host, `rooms/${code}/public`, true);
    await denied(host, `rooms/${code}/hands/${host.auth.currentUser.uid}`, true);
    await assert.rejects(players[1].call({ action: "start", code, revision: view.revision }), /host/i);
    if (count === 6) await assert.rejects(outsider.call({ action: "join", code, name: "Seventh", avatar: "you" }), /full/i);

    const observed = new Map();
    for (const p of players.slice(0, count)) {
      const stop = onValue(ref(p.db, `rooms/${code}/public`), snap => { if (snap.exists()) observed.set(p, JSON.parse(snap.val())); }, () => {});
      watches.push(stop);
    }
    await host.call({ action: "start", code, revision: view.revision });
    await waitUntil(() => observed.size === count && [...observed.values()].every(v => v.game), "start reaches all devices");
    view = observed.get(host);
    assert.equal(view.game.players.reduce((n, p) => n + p.initialCount, 0), 51);
    if (view.game.status === "playing") assert.equal(view.game.removedJack, null);
    const seats = new Map();
    for (const p of players.slice(0, count)) {
      const own = await read(p, code, `hands/${p.auth.currentUser.uid}`);
      assert.equal(own.cards.length, view.game.players.find(seat => seat.id === own.id).count);
      seats.set(own.id, p);
    }
    assert.equal((await players[1].call({ action: "join", code })).code, code, "An existing identity reconnects during play");
    await assert.rejects(outsider.call({ action: "join", code, name: "Late", avatar: "you" }), /started/);
    await delay(Math.max(0, view.turnDeadline - 60_000 + 75 - Date.now()));
    if (view.game.status === "playing") {
      const wrong = players.slice(0, count).find(p => p !== seats.get(view.game.actor));
      await assert.rejects(wrong.call({ action: "draw", code, revision: view.revision, slot: 0 }), /turn/i);
      await assert.rejects(host.call({ action: "nudge", code, revision: view.revision }), /moment/i);
      const actor = seats.get(view.game.actor);
      const selectionRef = ref(actor.db, `rooms/${code}/selection`);
      const preview = { revision: view.revision, slot: 0, updatedAt: serverTimestamp() };
      await assert.rejects(set(ref(wrong.db, `rooms/${code}/selection`), preview), /denied/i);
      await assert.rejects(set(selectionRef, { ...preview, slot: view.game.slotCount }), /denied/i);
      await assert.rejects(set(selectionRef, { ...preview, slot: 0.5 }), /denied/i);
      await assert.rejects(set(selectionRef, { ...preview, revision: view.revision - 1 }), /denied/i);
      await assert.rejects(set(selectionRef, { ...preview, card: "JS" }), /denied/i);
      await denied(outsider, `rooms/${code}/selection`);
      await denied(actor, `rooms/${code}/drawAccess`);
      await set(selectionRef, preview);
      const targetPlayer = seats.get(view.game.target);
      const selection = (await get(ref(targetPlayer.db, `rooms/${code}/selection`))).val();
      assert.equal(selection.slot, 0, "The hand owner sees the actor's touched slot");
      const targetHand = await read(targetPlayer, code, `hands/${targetPlayer.auth.currentUser.uid}`);
      assert.deepEqual(targetHand.offeredCardIds, targetHand.cards.map(card => card.id).reverse());
      await set(selectionRef, null);
      assert.equal((await get(ref(targetPlayer.db, `rooms/${code}/selection`))).exists(), false);
      await set(selectionRef, preview);
      const commands = await Promise.allSettled([0, 1].map(() => actor.call({ action: "draw", code, revision: view.revision, slot: 0 })));
      assert.equal(commands.filter(r => r.status === "fulfilled").length, 1, "A duplicate draw commits once");
      const previous = view.revision;
      await waitUntil(() => observed.get(host).revision > previous, "first move arrives");
      view = observed.get(host);
      assert.equal((await get(ref(host.db, `rooms/${code}/selection`))).exists(), false, "A move clears the old preview");
      await assert.rejects(set(selectionRef, preview), /denied/i);
    }
    let turns = 0;
    while (view.game.status === "playing") {
      assert.ok(++turns < 1500, "Round must finish");
      await seats.get(view.game.actor).call({ action: "draw", code, revision: view.revision, slot: Math.floor(Math.random() * view.game.slotCount) });
      const previous = view.revision;
      await waitUntil(() => [...observed.values()].every(v => v.revision > previous), "move reaches all devices");
      view = observed.get(host);
    }
    assert.equal(view.game.pairCount, 25);
    assert.equal(view.game.finalCard.rank, "J");
    assert.equal(view.game.safeOrder.length, count - 1);
    await host.call({ action: "start", code, revision: view.revision });
    await waitUntil(() => observed.get(host).game?.round === 2, "rematch starts");
    view = observed.get(host);
    await host.call({ action: "lobby", code, revision: view.revision });
    await waitUntil(() => observed.get(host).game === null, "return to lobby");
    view = observed.get(host);
    const removed = await read(players[1], code, `hands/${players[1].auth.currentUser.uid}`);
    await host.call({ action: "remove", code, player: removed.id });
    await denied(players[1], `rooms/${code}/public`);
    for (const stop of watches.splice(0)) stop();
    for (const p of players.slice(2, count)) await p.call({ action: "leave", code });
    await host.call({ action: "leave", code });
    rooms.delete(code);
    console.log(`PASS ${count} players: private hands, concurrent joins, start, ${turns + 1} draws, result, rematch, removal, room deletion`);
  }
  console.log(`PASS ${live ? "LIVE" : "EMULATOR"} multiplayer integration`);
} finally {
  for (const stop of watches) stop();
  for (const [code, host] of rooms) {
    try {
      const view = await read(host, code);
      if (view?.game) await host.call({ action: "lobby", code, revision: view.revision });
      for (const p of players.slice(1)) if (p.auth.currentUser) await p.call({ action: "leave", code }).catch(() => {});
      await host.call({ action: "leave", code });
    } catch { console.error(`Cleanup needed for test room ${code}`); }
  }
  for (const p of players) {
    if (p.auth.currentUser) await deleteUser(p.auth.currentUser).catch(() => {});
    await deleteApp(p.app);
  }
}
