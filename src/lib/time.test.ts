import { describe, it, expect } from "vitest";
import { formatTime } from "./time";

describe("formatTime", () => {
  it("formats mm:ss (matches the assignment's own examples)", () => {
    expect(formatTime(122)).toBe("2:02");
    expect(formatTime(645)).toBe("10:45");
    expect(formatTime(1110)).toBe("18:30");
  });

  it("formats h:mm:ss past an hour", () => {
    expect(formatTime(3725)).toBe("1:02:05");
  });

  it("clamps invalid or negative input to 0:00", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(NaN)).toBe("0:00");
  });
});
