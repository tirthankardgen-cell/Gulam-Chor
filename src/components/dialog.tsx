"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icon";

export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      // React removes the dialog before the browser's native focus restoration.
      // Restore the actual trigger after that removal, for every close path.
      queueMicrotask(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
    };
  }, []);
  return (
    <dialog ref={ref} className="paper-dialog" aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    }}>
      <button className="dialog-close icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
      <span className="dialog-flower" aria-hidden="true">✺</span>
      <h2 id="dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
