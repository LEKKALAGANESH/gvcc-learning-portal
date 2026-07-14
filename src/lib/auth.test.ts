import { describe, it, expect } from "vitest";
import { createToken, verifyToken } from "./auth";

describe("session tokens (jose)", () => {
  const payload = { userId: "u_123", email: "ada@example.com", name: "Ada Lovelace" };

  it("round-trips a signed token back to its payload", async () => {
    const token = await createToken(payload);
    expect(typeof token).toBe("string");
    const decoded = await verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it("returns null for a malformed token", async () => {
    expect(await verifyToken("not.a.jwt")).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await createToken(payload);
    const tampered = token.slice(0, -3) + "abc";
    expect(await verifyToken(tampered)).toBeNull();
  });
});
