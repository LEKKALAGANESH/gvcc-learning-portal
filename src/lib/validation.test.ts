import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema, createBookmarkSchema, fieldErrors } from "./validation";

describe("signupSchema", () => {
  it("accepts a valid payload and normalizes the email to lowercase", () => {
    const r = signupSchema.safeParse({ name: "Ada Lovelace", email: "ADA@Example.com", password: "password1" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ada@example.com");
  });

  it("rejects a password shorter than 8 chars", () => {
    expect(signupSchema.safeParse({ name: "Ada", email: "a@b.co", password: "short" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(signupSchema.safeParse({ name: "Ada", email: "not-an-email", password: "password1" }).success).toBe(false);
  });
});

describe("createBookmarkSchema", () => {
  it("rejects a negative timestamp", () => {
    expect(createBookmarkSchema.safeParse({ videoId: "v1", timeSec: -1 }).success).toBe(false);
  });

  it("accepts an optional null label", () => {
    expect(createBookmarkSchema.safeParse({ videoId: "v1", timeSec: 5, label: null }).success).toBe(true);
  });
});

describe("fieldErrors", () => {
  it("flattens a ZodError into { field: message }", () => {
    const r = loginSchema.safeParse({ email: "bad", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errs = fieldErrors(r.error);
      expect(errs.email).toBeTruthy();
      expect(errs.password).toBeTruthy();
    }
  });
});
