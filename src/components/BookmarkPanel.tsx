"use client";

import { useState } from "react";
import { formatTime } from "@/lib/time";
import EmptyState from "@/components/EmptyState";
import type { BookmarkDTO } from "@/lib/types";

type Props = {
  bookmarks: BookmarkDTO[];
  onAdd: (label: string) => Promise<boolean>;
  onRename: (id: string, label: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
  onSeek: (timeSec: number) => void;
  notify: (text: string, kind?: "error" | "success") => void;
};

export default function BookmarkPanel({ bookmarks, onAdd, onRename, onDelete, onSeek, notify }: Props) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function addBookmark(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await onAdd(label);
    if (ok) setLabel(""); // keep the typed label on failure so it isn't lost
    setBusy(false);
  }

  async function saveRename(id: string) {
    const ok = await onRename(id, editLabel);
    if (ok) setEditingId(null); // stay in edit mode on failure
  }

  function shareBookmark(timeSec: number) {
    const url = `${window.location.origin}${window.location.pathname}?t=${Math.floor(timeSec)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => notify("Link to this moment copied", "success"))
      .catch(() => notify("Couldn't copy link"));
  }

  return (
    <aside className="panel">
      <div className="panel-head">
        <h2>Bookmarks</h2>
        <span className="count" style={{ color: "var(--text-faint)", fontSize: 13 }}>
          {bookmarks.length}
        </span>
      </div>

      <form className="add-bar" onSubmit={addBookmark}>
        <input
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          maxLength={80}
          aria-label="Bookmark label"
        />
        <button className="btn btn-sm" type="submit" disabled={busy} title="Bookmark current time (B)">
          {busy ? "…" : "+ Mark"}
        </button>
      </form>

      {bookmarks.length === 0 ? (
        <EmptyState emoji="🔖">
          No bookmarks yet. Hit <strong>+ Mark</strong> (or press <kbd>B</kbd>) to save the exact timestamp.
        </EmptyState>
      ) : (
        <ul className="bm-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {bookmarks.map((b) => (
            <li key={b.id} className="bm">
              <button
                className="bm-time"
                onClick={() => onSeek(b.timeSec)}
                title={`Resume from ${formatTime(b.timeSec)}`}
              >
                {formatTime(b.timeSec)}
              </button>

              {editingId === b.id ? (
                <input
                  className="input bm-edit"
                  value={editLabel}
                  autoFocus
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(b.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => saveRename(b.id)}
                  maxLength={80}
                  aria-label="Edit bookmark label"
                />
              ) : (
                <button
                  className={`bm-label ${b.label ? "" : "empty"}`}
                  onClick={() => onSeek(b.timeSec)}
                  title="Jump to this moment"
                >
                  {b.label || "Untitled bookmark"}
                </button>
              )}

              {editingId !== b.id && (
                <div className="bm-actions">
                  {confirmingId === b.id ? (
                    <>
                      <button
                        className="btn-icon danger"
                        aria-label="Confirm delete"
                        onClick={() => { setConfirmingId(null); onDelete(b.id); }}
                      >
                        ✓
                      </button>
                      <button className="btn-icon" aria-label="Cancel delete" onClick={() => setConfirmingId(null)}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-icon" aria-label="Copy link to this moment" onClick={() => shareBookmark(b.timeSec)}>
                        🔗
                      </button>
                      <button
                        className="btn-icon"
                        aria-label="Rename bookmark"
                        onClick={() => { setEditingId(b.id); setEditLabel(b.label ?? ""); }}
                      >
                        ✎
                      </button>
                      <button className="btn-icon danger" aria-label="Delete bookmark" onClick={() => setConfirmingId(b.id)}>
                        🗑
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>
        Tip: click a timestamp to resume from that moment · <kbd>[</kbd> / <kbd>]</kbd> jump between bookmarks.
      </p>
    </aside>
  );
}
