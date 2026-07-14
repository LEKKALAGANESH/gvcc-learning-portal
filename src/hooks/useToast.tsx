"use client";

import { useCallback, useRef, useState } from "react";

type Toast = { text: string; kind: "error" | "success" };

/** Lightweight transient toast. Returns the element to render + a notify() trigger. */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((text: string, kind: Toast["kind"] = "error") => {
    setToast({ text, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const element = toast ? (
    <div
      className={`toast ${toast.kind === "success" ? "toast-ok" : ""}`}
      role={toast.kind === "success" ? "status" : "alert"}
    >
      <span aria-hidden>{toast.kind === "success" ? "✓" : "⚠"}</span> {toast.text}
    </div>
  ) : null;

  return { toast: element, notify };
}
