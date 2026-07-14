import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken, type SessionPayload } from "./auth";

/** Read the current session from the cookie. Returns null when signed out. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Require a session or redirect to login. Use in protected server components/routes. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * For API route handlers: returns the session, or a 401 NextResponse to return early.
 * Usage: `const s = await requireApiSession(); if (s instanceof NextResponse) return s;`
 */
export async function requireApiSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}
