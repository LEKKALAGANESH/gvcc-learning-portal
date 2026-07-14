import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <main className="auth-wrap">
      <EmptyState
        emoji="🔍"
        title="Page not found"
        action={
          <Link href="/library" className="btn" style={{ marginTop: 16, display: "inline-flex" }}>
            Back to library
          </Link>
        }
      >
        We couldn&apos;t find that lesson or page.
      </EmptyState>
    </main>
  );
}
