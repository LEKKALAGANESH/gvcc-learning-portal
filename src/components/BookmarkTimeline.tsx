"use client";

import { formatTime } from "@/lib/time";
import type { BookmarkDTO } from "@/lib/types";

type Props = {
  bookmarks: BookmarkDTO[];
  duration: number;
  currentTime: number;
  onSeek: (timeSec: number) => void;
};

// A slim scrubber under the player: a tick per bookmark + a live playhead. Clicking a tick
// jumps the video. Complements the native controls without rebuilding them.
export default function BookmarkTimeline({ bookmarks, duration, currentTime, onSeek }: Props) {
  if (!duration || duration <= 0) return null;
  const pct = (t: number) => `${Math.min(100, Math.max(0, (t / duration) * 100))}%`;

  return (
    <div className="timeline" role="group" aria-label="Bookmark timeline">
      <div className="timeline-track">
        <div className="timeline-progress" style={{ width: pct(currentTime) }} />
        <div className="timeline-playhead" style={{ left: pct(currentTime) }} aria-hidden />
        {bookmarks.map((b) => (
          <button
            key={b.id}
            type="button"
            className="timeline-mark"
            style={{ left: pct(b.timeSec) }}
            onClick={() => onSeek(b.timeSec)}
            title={`${b.label ? b.label + " · " : ""}${formatTime(b.timeSec)}`}
            aria-label={`Jump to ${b.label || "bookmark"} at ${formatTime(b.timeSec)}`}
          />
        ))}
      </div>
    </div>
  );
}
