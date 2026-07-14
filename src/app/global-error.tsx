"use client";

import { useEffect } from "react";

// Catches errors in the root layout itself — must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#0a0a0f", color: "#f4f4f8", fontFamily: "system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 30 }} aria-hidden>⚠️</div>
          <h1 style={{ fontSize: 20, margin: "8px 0" }}>Something went wrong</h1>
          <button
            onClick={reset}
            style={{ marginTop: 16, minHeight: 44, padding: "0 18px", borderRadius: 12, border: 0, background: "#7c6cff", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
