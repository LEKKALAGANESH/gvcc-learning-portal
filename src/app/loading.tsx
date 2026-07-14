// Instant skeleton for the library while the server component fetches — never a blank screen.
export default function Loading() {
  return (
    <main className="container" style={{ padding: "28px 20px 64px" }}>
      <span role="status" className="sr-only">Loading lessons…</span>
      <div className="skeleton" style={{ height: 30, width: 220, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 320, marginBottom: 28 }} />
      <div className="grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card" aria-hidden>
            <div className="thumb skeleton" />
            <div className="card-body">
              <div className="skeleton" style={{ height: 16, width: "70%" }} />
              <div className="skeleton" style={{ height: 12, width: "92%", marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
