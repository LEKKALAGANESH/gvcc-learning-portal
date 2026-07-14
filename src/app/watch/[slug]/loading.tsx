// Skeleton for the watch page (player + panel) during navigation/fetch.
export default function Loading() {
  return (
    <main className="container" style={{ padding: "20px 20px 64px" }}>
      <span role="status" className="sr-only">Loading lesson…</span>
      <div className="skeleton" style={{ height: 36, width: 140, marginBottom: 16 }} />
      <div className="watch">
        <div>
          <div className="player-wrap skeleton" />
          <div className="video-meta">
            <div className="skeleton" style={{ height: 22, width: "55%", marginTop: 16 }} />
            <div className="skeleton" style={{ height: 14, width: "85%", marginTop: 10 }} />
          </div>
        </div>
        <div className="panel">
          <div className="skeleton" style={{ height: 18, width: 120, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 44, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 44 }} />
        </div>
      </div>
    </main>
  );
}
