import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createToken, SESSION_COOKIE, cookieOptions } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { signupSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, clientIp, tooMany } from "@/lib/ratelimit";

const emailTaken = () =>
  NextResponse.json({ errors: { email: "An account with this email already exists" } }, { status: 409 });

export async function POST(req: Request) {
  const rl = rateLimit(`signup:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  let user;
  try {
    user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });
  } catch (err) {
    // Unique-constraint race (two concurrent signups) → clean 409, not a raw 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return emailTaken();
    console.error("POST /api/auth/signup", err);
    return NextResponse.json({ errors: { form: "Server error" } }, { status: 500 });
  }

  const token = await createToken({ userId: user.id, email: user.email, name: user.name });
  const res = NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 },
  );
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return res;
}
