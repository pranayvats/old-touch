import { useEffect, type ReactNode } from "react";

/**
 * Phone-width app frame. Centers the app on larger screens so it always
 * feels like a mobile app. Later, Capacitor will wrap this same shell.
 *
 * The app follows the device/browser light or dark preference automatically.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      document.documentElement.classList.toggle("dark", media.matches);
    };

    syncTheme();
    media.addEventListener("change", syncTheme);

    return () => media.removeEventListener("change", syncTheme);
  }, []);

  return (
    <div className="min-h-dvh bg-muted/40 text-foreground transition-colors duration-200">
      <div className="app-shell shadow-xl">{children}</div>
    </div>
  );
}
