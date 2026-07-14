// Deterministic, self-contained thumbnail styling derived from a video's slug.
// No external image dependency → renders anywhere, offline, never 403s.
export function thumbStyle(seed: string): { background: string } {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const h2 = (h + 45) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h} 62% 26%), hsl(${h2} 58% 14%))`,
  };
}

export const initials = (title: string) =>
  title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
