import Link from "next/link";
import { formatTime } from "@/lib/time";
import { thumbStyle, initials } from "@/lib/thumb";
import type { VideoDTO } from "@/lib/types";

type Props = { video: VideoDTO; progressPct?: number };

export default function VideoCard({ video, progressPct = 0 }: Props) {
  return (
    <Link href={`/watch/${video.slug}`} className="card" aria-label={`Watch ${video.title}`}>
      <div className="thumb" style={thumbStyle(video.slug)}>
        <span className="thumb-mark" aria-hidden>{initials(video.title)}</span>
        <span className="badge">{video.category}</span>
        <span className="duration">{formatTime(video.durationSec)}</span>
        <div className="play"><span className="play-dot" aria-hidden>▶</span></div>
        {progressPct > 0 && (
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{video.title}</h3>
        <p className="card-desc">{video.description}</p>
      </div>
    </Link>
  );
}
