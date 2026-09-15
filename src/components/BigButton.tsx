import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface BigButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  /** Internal navigation target (TanStack route path). */
  to?: string;
  /** Render as a plain button instead of a link. */
  onClick?: () => void;
  variant?: "default" | "emergency";
}

const base =
  "flex w-full items-center gap-4 rounded-3xl border-2 px-5 py-5 text-left transition-colors active:scale-[0.99]";
const variants = {
  default:
    "border-border bg-card text-foreground shadow-sm active:bg-accent",
  emergency:
    "border-emergency bg-emergency text-emergency-foreground shadow-md active:opacity-90",
};

function Content({
  icon: Icon,
  label,
  description,
  variant = "default",
}: Pick<BigButtonProps, "icon" | "label" | "description" | "variant">): ReactNode {
  const emergency = variant === "emergency";
  return (
    <>
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
          emergency
            ? "bg-emergency-foreground/20 text-emergency-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-8 w-8" strokeWidth={2.25} />
      </span>
      <span className="min-w-0">
        <span
          className={`block font-extrabold leading-tight ${
            emergency ? "text-2xl tracking-wide" : "text-xl"
          }`}
        >
          {label}
        </span>
        {description ? (
          <span
            className={`mt-0.5 block text-base font-semibold ${
              emergency ? "text-emergency-foreground/85" : "text-muted-foreground"
            }`}
          >
            {description}
          </span>
        ) : null}
      </span>
    </>
  );
}

/** Extra-large, high-contrast tap target used across the whole app. */
export function BigButton({
  variant = "default",
  ...props
}: BigButtonProps) {
  const className = `${base} ${variants[variant]}`;
  if (props.to) {
    return (
      <Link to={props.to} className={className}>
        <Content {...props} variant={variant} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={className}>
      <Content {...props} variant={variant} />
    </button>
  );
}
