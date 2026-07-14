import { SignJWT, jwtVerify } from "jose";

// Edge-safe: this module uses only `jose` so it can be imported from middleware.
// Password hashing (bcryptjs, Node-only) lives in ./password.
const RAW_SECRET = process.env.AUTH_SECRET;
const DEV_FALLBACK = "dev-only-change-me-32-chars-minimum-secret-key";

// Resolved lazily on first token operation — never at module load. This keeps
// `next build` (which imports this module to collect page data) from crashing when
// the secret isn't present at build time, while still failing fast on the first real
// request in production rather than silently signing sessions with a public dev key.
let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  if (process.env.NODE_ENV === "production" && (!RAW_SECRET || RAW_SECRET.length < 32)) {
    throw new Error("AUTH_SECRET must be set to a 32+ character secret in production.");
  }
  cachedSecret = new TextEncoder().encode(RAW_SECRET ?? DEV_FALLBACK);
  return cachedSecret;
}
export const SESSION_COOKIE = "gvcc_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { userId: string; email: string; name: string };

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: payload.userId as string, email: payload.email as string, name: payload.name as string };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
