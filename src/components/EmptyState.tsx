import type { ReactNode } from "react";

// One data-driven empty/placeholder block, reused for empty lists, 404, and errors.
export default function EmptyState({
  emoji,
  title,
  children,
  action,
}: {
  emoji: string;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="emoji" aria-hidden>{emoji}</div>
      {title && <h2 style={{ fontSize: 18, margin: "8px 0 6px" }}>{title}</h2>}
      <p>{children}</p>
      {action}
    </div>
  );
}
