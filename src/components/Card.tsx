import type { ReactNode } from "react";

/** Simple high-contrast content card used for posts, places, and lists. */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-border bg-card p-5 shadow-sm">
      {children}
    </div>
  );
}
