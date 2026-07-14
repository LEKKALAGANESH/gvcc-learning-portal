"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookmarkPanel from "@/components/BookmarkPanel";
import BookmarkTimeline from "@/components/BookmarkTimeline";
import { useToast } from "@/hooks/useToast";
import type { BookmarkDTO, VideoDTO } from "@/lib/types";

type Props = { video: VideoDTO; initialBookmarks: BookmarkDTO[]; resumeAt: number };

const byTime = (a: BookmarkDTO, b: BookmarkDTO) => a.timeSec - b.timeSec;

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return data?.errors?.form ?? data?.error ?? fallback;
}

export default function WatchExperience({ video, initialBookmarks, resumeAt }: Props) {
  const router = useRouter();
  const { toast, notify } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTimeRef = useRef(0);
  const lastSavedRef = useRef(0);
  const cacheBustedRef = useRef(false); // invalidate the library's client cache once
  const [bookmarks, setBookmarks] = useState<BookmarkDTO[]>([...initialBookmarks].sort(byTime));
  const [displayTime, setDisplayTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSec);
  const [resumeKind, setResumeKind] = useState<null | "link" | "progress">(null);
  const resumeAppliedRef = useRef(false);
  const addingRef = useRef(false); // guards against concurrent/key-repeat adds

  // Keep a ref of the latest bookmarks so the keydown handler isn't rebound each change.
  const bookmarksRef = useRef(bookmarks);
  bookmarksRef.current = bookmarks;

  // ---- progress persistence (throttled; keepalive survives unload) ----
  function saveProgress(positionSec: number, durationSec: number, completed: boolean) {
    if (!Number.isFinite(positionSec) || !Number.isFinite(durationSec)) return;
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ videoId: video.id, positionSec, durationSec, completed }),
    })
      .then(() => {
        // Bust the client Router Cache once so the library's Continue/Recently-watched
        // sections are fresh on return (covers link, brand, and browser-back navigation).
        if (!cacheBustedRef.current) {
          cacheBustedRef.current = true;
          router.refresh();
        }
      })
      .catch(() => {});
  }

  // Apply the resume seek once. Called from onLoadedMetadata AND a mount effect, because
  // metadata can finish loading before React attaches the handler (fast/cached sources).
  function applyResume() {
    const el = videoRef.current;
    if (!el || resumeAppliedRef.current || !el.duration) return;
    resumeAppliedRef.current = true;
    setDuration(el.duration);
    // Resume precedence: explicit ?t= link > saved progress > start.
    const tParam = Number(new URLSearchParams(window.location.search).get("t"));
    const fromLink = Number.isFinite(tParam) && tParam > 0;
    const target = fromLink ? tParam : resumeAt;
    if (target > 1 && target < el.duration - 2) {
      el.currentTime = target;
      setResumeKind(fromLink ? "link" : "progress");
    }
  }

  function onLoadedMetadata() {
    applyResume();
  }

  // Catch the case where metadata already loaded before hydration.
  useEffect(() => {
    applyResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onTimeUpdate() {
    const el = videoRef.current;
    if (!el) return;
    currentTimeRef.current = el.currentTime;
    setDisplayTime(el.currentTime);
    if (Math.abs(el.currentTime - lastSavedRef.current) >= 5) {
      lastSavedRef.current = el.currentTime;
      saveProgress(el.currentTime, el.duration, false);
    }
  }

  const onPause = () => {
    const el = videoRef.current;
    if (el) saveProgress(el.currentTime, el.duration, false);
  };
  const onEnded = () => {
    const el = videoRef.current;
    if (el) saveProgress(el.duration, el.duration, true);
  };

  // Save on tab-hide / navigation, and pause when the tab is actually hidden
  // (privacy: content shouldn't keep playing/leaking audio while you're away).
  useEffect(() => {
    const flush = () => {
      const el = videoRef.current;
      if (el && el.currentTime > 0) saveProgress(el.currentTime, el.duration, el.ended);
    };
    // Pause whenever the app loses focus/visibility (matches the privacy veil + blur).
    const pauseAway = () => videoRef.current?.pause();
    const onVisibility = () => { flush(); if (document.hidden) pauseAway(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pauseAway);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pauseAway);
      window.removeEventListener("pagehide", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function seekTo(timeSec: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = timeSec;
    currentTimeRef.current = timeSec;
    setDisplayTime(timeSec);
    el.play().catch(() => {});
  }

  // ---- bookmark CRUD (single source of truth; timeline + panel stay in sync) ----
  async function addBookmark(label: string): Promise<boolean> {
    if (addingRef.current) return false; // ignore concurrent / key-repeat adds
    addingRef.current = true;
    const timeSec = Math.floor(currentTimeRef.current);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, timeSec, label: label.trim() || null }),
      });
      if (!res.ok) {
        notify(await errorMessage(res, "Couldn't add bookmark"));
        return false;
      }
      const { bookmark } = await res.json();
      setBookmarks((prev) => [...prev, bookmark].sort(byTime));
      notify("Bookmark added", "success");
      return true;
    } catch {
      notify("Network error — bookmark not saved");
      return false;
    } finally {
      addingRef.current = false;
    }
  }

  async function renameBookmark(id: string, label: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      if (!res.ok) {
        notify(await errorMessage(res, "Couldn't rename bookmark"));
        return false;
      }
      const { bookmark } = await res.json();
      setBookmarks((prev) => prev.map((b) => (b.id === id ? bookmark : b)));
      return true;
    } catch {
      notify("Network error — rename failed");
      return false;
    }
  }

  async function deleteBookmark(id: string) {
    const prev = bookmarks;
    setBookmarks((b) => b.filter((x) => x.id !== id)); // optimistic
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setBookmarks(prev);
        notify("Couldn't delete bookmark");
      }
    } catch {
      setBookmarks(prev);
      notify("Network error — delete failed");
    }
  }

  // ---- keyboard shortcuts: B = bookmark, [ / ] = prev / next bookmark ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const t = currentTimeRef.current;
      const list = bookmarksRef.current;
      if (e.key === "b" || e.key === "B") {
        if (e.repeat) return; // holding B shouldn't spawn duplicates
        e.preventDefault();
        addBookmark("");
      } else if (e.key === "[") {
        const prev = [...list].reverse().find((b) => b.timeSec < t - 0.5);
        if (prev) seekTo(prev.timeSec);
      } else if (e.key === "]") {
        const next = list.find((b) => b.timeSec > t + 0.5);
        if (next) seekTo(next.timeSec);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="watch">
      <div>
        <div className="player-wrap" data-protected>
          <video
            ref={videoRef}
            src={video.url}
            controls
            playsInline
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPause={onPause}
            onEnded={onEnded}
          />
          <div className="protect-veil">
            👁️ Paused &amp; blurred for privacy — return to this tab to keep watching.
          </div>
        </div>

        <BookmarkTimeline bookmarks={bookmarks} duration={duration} currentTime={displayTime} onSeek={seekTo} />

        <div className="video-meta">
          <span className="badge" style={{ position: "static", display: "inline-block", marginBottom: 10 }}>
            {video.category}
          </span>
          <h1>{video.title}</h1>
          <p>{video.description}</p>
          {resumeKind && (
            <p style={{ fontSize: 13, color: "var(--accent-hover)", marginTop: 8 }}>
              {resumeKind === "link" ? "↳ Jumped to the shared moment." : "↺ Resumed where you left off."}
            </p>
          )}
        </div>
      </div>

      <BookmarkPanel
        bookmarks={bookmarks}
        onAdd={addBookmark}
        onRename={renameBookmark}
        onDelete={deleteBookmark}
        onSeek={seekTo}
        notify={notify}
      />

      {toast}
    </div>
  );
}
