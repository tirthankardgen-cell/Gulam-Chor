"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onDisconnect, onValue, ref, serverTimestamp, set } from "firebase/database";
import { firebase } from "@/lib/firebase";
import type { CardSelection } from "@/lib/room";

/** Transient pointer feedback never changes the authoritative hand or turn. */
export function useCardSelection(code: string, revision: number, canPreview: boolean) {
  const [selection, setSelection] = useState<CardSelection | null>(null);
  const send = useRef<(slot: number | null) => void>(() => {});

  useEffect(() => onValue(ref(firebase().database, `rooms/${code}/selection`),
    (snap) => setSelection(snap.val()), () => setSelection(null)), [code]);

  useEffect(() => {
    if (!canPreview) { send.current = () => {}; return; }
    const selectionRef = ref(firebase().database, `rooms/${code}/selection`);
    const disconnect = onDisconnect(selectionRef);
    void disconnect.remove().catch(() => {});
    let slot: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const write = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
      void set(selectionRef, slot === null ? null : { revision, slot, updatedAt: serverTimestamp() }).catch(() => {
        // Stale previews are rejected when a draw wins the race. Moves remain authoritative.
      });
    };
    const preview = (next: number | null) => {
      if (next === slot) return;
      slot = next;
      if (timer) clearTimeout(timer);
      if (slot === null) write();
      else timer = setTimeout(write, 60);
    };
    send.current = preview;
    const clear = () => preview(null);
    const visibility = () => { if (document.hidden) clear(); };
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibility);
    const heartbeat = setInterval(() => { if (slot !== null) write(); }, 2000);
    return () => {
      send.current = () => {};
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibility);
      if (slot !== null) void set(selectionRef, null).catch(() => {});
      void disconnect.cancel().catch(() => {});
    };
  }, [code, revision, canPreview]);

  return { selection: selection?.revision === revision ? selection : null,
    preview: useCallback((slot: number | null) => send.current(slot), []) };
}
