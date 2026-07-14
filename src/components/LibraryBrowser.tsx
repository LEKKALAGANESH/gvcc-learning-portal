"use client";

import { useState } from "react";
import VideoCard from "@/components/VideoCard";
import EmptyState from "@/components/EmptyState";
import type { VideoDTO } from "@/lib/types";

export type CardItem = { video: VideoDTO; progressPct: number };

function Section({ title, items, emptyText }: { title: string; items: CardItem[]; emptyText?: string }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div className="section-title">
        {title} <span className="count">· {items.length}</span>
      </div>
      {items.length === 0 && emptyText ? (
        <EmptyState emoji="🔍">{emptyText}</EmptyState>
      ) : (
        <div className="grid">
          {items.map(({ video, progressPct }) => (
            <VideoCard key={video.id} video={video} progressPct={progressPct} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function LibraryBrowser({
  all,
  continueWatching,
  recent,
}: {
  all: CardItem[];
  continueWatching: CardItem[];
  recent: CardItem[];
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const searching = query.length > 0;
  const filtered = searching
    ? all.filter(
        ({ video }) =>
          video.title.toLowerCase().includes(query) || video.category.toLowerCase().includes(query),
      )
    : all;

  return (
    <>
      <div className="search-bar">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons…"
          aria-label="Search lessons"
        />
      </div>

      {!searching && continueWatching.length > 0 && (
        <Section title="Continue watching" items={continueWatching} />
      )}
      {!searching && recent.length > 0 && <Section title="Recently watched" items={recent} />}

      <Section
        title={searching ? "Results" : "All lessons"}
        items={filtered}
        emptyText={searching ? `No lessons match “${q}”.` : undefined}
      />
    </>
  );
}
