"use client";

import { useEffect, useState } from "react";

/**
 * Best-effort web screenshot deterrent. The web platform CANNOT truly block an OS
 * screenshot (see README) — this raises the cost and signals intent:
 *  - Blur protected media whenever the app loses focus (tab switch / alt-tab / minimize),
 *    which is when most screen-capture tools grab the frame.
 *  - Intercept PrintScreen: wipe the clipboard and flash a warning.
 *  - Block context-menu / drag / long-press save on protected regions.
 * True prevention requires native (Android FLAG_SECURE / Electron setContentProtection).
 */
export default function ScreenshotGuard() {
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    const hide = () => document.body.classList.add("app-hidden");
    const show = () => document.body.classList.remove("app-hidden");
    const onVisibility = () => (document.hidden ? hide() : show());

    const flashWarning = () => {
      // Overwrite whatever a capture tool may have placed on the clipboard.
      navigator.clipboard?.writeText("").catch(() => {});
      setWarn(true);
      window.setTimeout(() => setWarn(false), 2200);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        hide();
        flashWarning();
        window.setTimeout(show, 900);
      }
      // Deter the common devtools/save shortcuts on protected content.
      if ((e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(e.key.toLowerCase())) {
        if (document.querySelector("[data-protected]")) {
          e.preventDefault();
          flashWarning();
        }
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest("[data-protected]")) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.closest("[data-protected]")) e.preventDefault();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("keyup", onKey);
    document.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("keyup", onKey);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  if (!warn) return null;
  return (
    <div className="toast" role="alert">
      <span aria-hidden>🛡️</span> Screen capture is discouraged for protected content.
    </div>
  );
}
