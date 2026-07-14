import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

// Gate the app behind auth; keep /login, /signup, API auth, and assets open.
const PUBLIC = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  // Signed-in users skip the auth pages.
  if (session && isPublic) {
    return NextResponse.redirect(new URL("/library", req.url));
  }
  // Signed-out users can't reach protected pages.
  if (!session && !isPublic) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Run on pages only — exclude API, static, image, and file assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
