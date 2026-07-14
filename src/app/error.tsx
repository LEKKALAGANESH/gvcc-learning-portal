"use client";

import { useEffect } from "react";
import EmptyState from "@/components/EmptyState";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="auth-wrap">
      <EmptyState
        emoji="⚠️"
        title="Something went wrong"
        action={
          <button className="btn" style={{ marginTop: 16 }} onClick={reset}>
            Try again
          </button>
        }
      >
        An unexpected error occurred. You can try again.
      </EmptyState>
    </main>
  );
}
