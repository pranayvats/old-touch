import { useEffect, type ReactNode } from "react";
import { applyTextSize, getStoredTextSize } from "@/lib/text-size";

/** Phone-width app frame with automatic theme and app-wide text sizing. */
export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => document.documentElement.classList.toggle("dark", media.matches);
    syncTheme();
    media.addEventListener("change", syncTheme);
    applyTextSize(getStoredTextSize());
    return () => media.removeEventListener("change", syncTheme);
  }, []);

  return (
    <div className="min-h-dvh bg-muted/40 text-foreground transition-colors duration-200">
      <div className="app-shell shadow-xl">{children}</div>
    </div>
  );
}
