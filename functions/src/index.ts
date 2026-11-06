import { randomInt } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { GameRuleError } from "../../src/lib/game";
import { changeRoom, createRoom, roomNode, ROOM_LIFETIME, type Room, type RoomCommand } from "../../src/lib/room";

// The emulator's default Admin URL omits "-default-rtdb", while the CLI loads
// this project's rules into that namespace. Keep SDK clients on the same DB.
const app = initializeApp(process.env.FIREBASE_DATABASE_EMULATOR_HOST ? {
  projectId: process.env.GCLOUD_PROJECT,
  databaseURL: `https://${process.env.GCLOUD_PROJECT}-default-rtdb.firebaseio.com`,
} : undefined);
const db = getDatabase(app);
const region = "us-central1";
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const roomAction = onCall({ region, minInstances: 0, maxInstances: 2, concurrency: 40, memory: "256MiB", timeoutSeconds: 20 }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Please reconnect to take your seat.");
  const data = request.data;
  if (!data || typeof data !== "object" || typeof data.action !== "string") throw new HttpsError("invalid-argument", "Choose a room action.");
  const now = Date.now();
  try {
    if (data.action === "create") {
      // One active created room per anonymous identity, also makes retries idempotent.
      const ownerRef = db.ref(`owners/${uid}`);
      for (let attempt = 0; attempt < 4; attempt++) {
        const candidate = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
        const proposed = createRoom(candidate, uid, data.name, data.avatar, now);
        const claim = await ownerRef.transaction((owner) => owner?.expiresAt > now ? owner : { code: candidate, expiresAt: now + ROOM_LIFETIME });
        const code = claim.snapshot.val().code as string;
        const result = await db.ref(`rooms/${code}`).transaction((node) => {
          if (node?.expiresAt > now) {
            const existing: Room = JSON.parse(node.secret);
            return existing.players.some((p) => p.uid === uid) ? node : undefined;
          }
          return roomNode({ ...proposed, code });
        });
        if (result.committed) return { code };
        // A code collision or an old seat must not lock someone out for a day.
        await ownerRef.transaction((owner) => owner?.code === code ? null : undefined);
      }
      throw new GameRuleError("Could not reserve a room code. Please try again.");
    }
    if (typeof data.code !== "string" || !/^[A-HJ-NP-Z2-9]{6}$/.test(data.code)) throw new GameRuleError("Enter the 6-character room code.");
    if (!["join", "start", "draw", "nudge", "leave", "lobby", "remove"].includes(data.action)) throw new GameRuleError("Unknown room action.");
    let rejection: unknown;
    const result = await db.ref(`rooms/${data.code}`).transaction((node) => {
      // The Admin SDK may first invoke this callback with an empty local cache.
      // Returning null triggers a server comparison and retries with the real value.
      if (!node) return null;
      try {
        const next = changeRoom(JSON.parse(node.secret) as Room, uid, data as RoomCommand, now);
        return next ? roomNode(next) : null;
      } catch (error) {
        // RTDB can rerun this callback asynchronously. Throwing here escapes
        // the awaited promise and crashes the worker on an invalid move.
        rejection = error;
        return undefined;
      }
    });
    if (rejection) throw rejection;
    if (!result.snapshot.exists() && data.action !== "leave") throw new GameRuleError("Room not found. Check the code or ask for a fresh invite.");
    if (data.action === "leave") {
      await db.ref(`owners/${uid}`).transaction((owner) => owner?.code === data.code ? null : undefined);
    }
    return { code: data.code };
  } catch (error) {
    if (error instanceof GameRuleError) throw new HttpsError("failed-precondition", error.message);
    console.error("Room operation failed", error instanceof Error ? error.message : "Unknown error");
    throw new HttpsError("internal", "The table could not connect. Please try again.");
  }
});

export const cleanupRooms = onSchedule({ schedule: "every 24 hours", region, maxInstances: 1, memory: "256MiB", timeoutSeconds: 120 }, async () => {
  const now = Date.now();
  // Bounded daily work. Transactions do not delete a room that was just refreshed.
  for (const collection of ["rooms", "owners"]) {
    const stale = await db.ref(collection).orderByChild("expiresAt").endAt(now).limitToFirst(500).get();
    const keys: string[] = [];
    stale.forEach((child) => { keys.push(child.key!); });
    for (let offset = 0; offset < keys.length; offset += 20) {
      await Promise.all(keys.slice(offset, offset + 20).map((key) => db.ref(`${collection}/${key}`).transaction((node) => node?.expiresAt <= now ? null : undefined)));
    }
  }
});
