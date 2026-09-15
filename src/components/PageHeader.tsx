import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  /** Where the Back button goes. Defaults to home. */
  backTo?: string;
  /** Optional short helper line shown under the title. */
  subtitle?: string;
}

/** Large, obvious header with a big Back button — used on every inner screen. */
export function PageHeader({ title, backTo = "/", subtitle }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
      <Link
        to={backTo}
        aria-label="Go back"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-background text-foreground active:bg-accent"
      >
        <ArrowLeft className="h-8 w-8" strokeWidth={2.5} />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold leading-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-base font-semibold text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
