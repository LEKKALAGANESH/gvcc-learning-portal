import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Never cache: a readiness probe must reflect the state of this instance right now.
export const dynamic = "force-dynamic";

// Why a slug and not the raw error: the underlying message embeds the database host, and
// occasionally the connection string. Classifying to a fixed set means the endpoint says
// enough to fix a misconfiguration without becoming an information leak.
type DbFault =
  | "url_missing"
  | "url_wrong_protocol"
  | "unreachable"
  | "auth_failed"
  | "schema_missing"
  | "unknown";

// Matched on message text, not error code: PrismaClientInitializationError leaves
// `errorCode` undefined for every fault below, so the message is the only signal. Codes
// are still checked first for the cases that do carry one (PrismaClientKnownRequestError).
const FAULTS: { match: (code: string, msg: string) => boolean; fault: DbFault; hint: string }[] = [
  {
    match: (_, msg) => msg.includes("Environment variable not found"),
    fault: "url_missing",
    hint: "DATABASE_URL is not set for this environment.",
  },
  {
    match: (_, msg) => msg.includes("must start with the protocol"),
    fault: "url_wrong_protocol",
    hint: "DATABASE_URL is not a postgres:// string — likely still the old file:./dev.db value.",
  },
  {
    match: (code, msg) =>
      code === "P1000" || /authentication failed/i.test(msg) || msg.includes("password"),
    fault: "auth_failed",
    hint: "Wrong database password, or the [YOUR-PASSWORD] placeholder was never substituted.",
  },
  {
    match: (code, msg) =>
      code === "P1001" ||
      code === "P1002" ||
      code === "P1017" ||
      msg.includes("Can't reach database server") ||
      msg.includes("timed out"),
    fault: "unreachable",
    hint: "Host unreachable. Use the pooler host on port 6543, not the IPv6-only direct host.",
  },
  {
    match: (code, msg) => code === "P2021" || msg.includes("does not exist in the current database"),
    fault: "schema_missing",
    hint: "Tables are missing — run supabase/setup.sql.",
  },
];

function classify(e: unknown): { fault: DbFault; code: string | null; hint: string } {
  const code = String((e as { errorCode?: string; code?: string })?.errorCode ?? (e as { code?: string })?.code ?? "") || null;
  const msg = e instanceof Error ? e.message : String(e);
  const hit = FAULTS.find((f) => f.match(code ?? "", msg));
  return hit
    ? { fault: hit.fault, code, hint: hit.hint }
    : { fault: "unknown", code, hint: "Unrecognized database fault — check the runtime logs." };
}

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", db: "up" });
  } catch (e) {
    console.error("GET /api/health", e);
    return NextResponse.json({ status: "degraded", db: "down", ...classify(e) }, { status: 503 });
  }
}
