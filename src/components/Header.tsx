"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="header">
      <div className="container row" style={{ gap: 16 }}>
        <Link href="/library" className="brand">
          <span className="brand-mark" aria-hidden>▶</span>
          <span>GVCC&nbsp;Learn</span>
        </Link>
        <div className="spacer" />
        <div className="row" style={{ gap: 12 }}>
          <span className="avatar" title={name}>{initials}</span>
          <button className="btn btn-ghost btn-sm logout-btn" onClick={logout} disabled={busy} aria-label="Log out">
            <span aria-hidden>⎋</span>
            <span className="logout-text">{busy ? "…" : "Log out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
