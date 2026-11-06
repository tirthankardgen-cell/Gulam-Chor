import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, connectAuthEmulator, getAuth, setPersistence, signInAnonymously } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import type { RoomCommand } from "./room";

let services: ReturnType<typeof initialize> | undefined;
let signingIn: Promise<string> | undefined;

function initialize() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  if (!config.apiKey || !config.projectId || !config.databaseURL || !config.appId) throw new Error("Online tables are not configured yet. Add the Firebase environment variables in Vercel and redeploy.");
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const database = getDatabase(app);
  const functions = getFunctions(app, process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1");
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" && ["localhost", "127.0.0.1"].includes(location.hostname)) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectDatabaseEmulator(database, "127.0.0.1", 9000);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
  return { auth, database, functions };
}

export function firebase() { return services ??= initialize(); }

export async function identity(): Promise<string> {
  if (!signingIn) signingIn = (async () => {
    const { auth } = firebase();
    await auth.authStateReady();
    if (!auth.currentUser) {
      await setPersistence(auth, browserLocalPersistence);
      await signInAnonymously(auth);
    }
    return auth.currentUser!.uid;
  })().catch((error) => { signingIn = undefined; throw error; });
  return signingIn;
}

export async function roomAction(data: (RoomCommand | { action: "create"; name: string; avatar: string }) & { code?: string }) {
  await identity();
  const call = httpsCallable<typeof data, { code: string }>(firebase().functions, "roomAction", { timeout: 25000 });
  return (await call(data)).data;
}

export function connectionError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (/operation-not-allowed|configuration-not-found/.test(code)) return "Anonymous sign-in is not enabled in Firebase yet. The host needs to finish the Firebase setup.";
  if (/permission.denied|PERMISSION_DENIED/i.test(code)) return "This room is no longer available to you. It may have expired or the host may have removed your seat.";
  if (/network|unavailable|deadline/.test(code)) return "Connection interrupted. Check your internet and try again; your seat is saved.";
  return error instanceof Error ? error.message.replace(/^Firebase:\s*/, "") : "Could not reach the table. Please try again.";
}
