import { describe, it, expect } from "vitest";
import { watchState } from "./progress";

describe("watchState (server-authoritative completion)", () => {
  it("marks completed within the last 5 seconds", () => {
    expect(watchState(96, 100).completed).toBe(true);
    expect(watchState(100, 100).completed).toBe(true);
    expect(watchState(50, 100).completed).toBe(false);
  });

  it("clamps position into [0, duration]", () => {
    expect(watchState(150, 100).positionSec).toBe(100);
    expect(watchState(-5, 100).positionSec).toBe(0);
    expect(watchState(42, 100).positionSec).toBe(42);
  });

  it("uses the passed (server) duration verbatim", () => {
    expect(watchState(10, 30).durationSec).toBe(30);
  });

  it("never completes a zero-duration video", () => {
    expect(watchState(0, 0).completed).toBe(false);
  });
});
