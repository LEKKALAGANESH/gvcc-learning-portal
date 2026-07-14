import { describe, it, expect } from "vitest";
import { rateLimit } from "./ratelimit";

describe("rateLimit (sliding window)", () => {
  it("allows up to the limit, then blocks", () => {
    const key = `test-block-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("keeps separate counters per key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false); // a exhausted
    expect(rateLimit(b, 1, 60_000).ok).toBe(true); // b unaffected
  });

  it("frees the window as time passes", () => {
    const key = `test-window-${Math.random()}`;
    expect(rateLimit(key, 1, 1).ok).toBe(true); // 1ms window
    // A second call after the 1ms window has elapsed should be allowed again.
    const later = Date.now() + 5;
    while (Date.now() < later) { /* busy-wait past the tiny window */ }
    expect(rateLimit(key, 1, 1).ok).toBe(true);
  });
});
