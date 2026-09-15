import type { ReactNode } from "react";

/**
 * Phone-width app frame. Centers the app on larger screens so it always
 * feels like a mobile app. Later, Capacitor will wrap this same shell.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/40">
      <div className="app-shell shadow-xl">{children}</div>
    </div>
  );
}
