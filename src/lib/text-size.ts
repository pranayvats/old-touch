/**
 * App-wide text size preference.
 *
 * The chosen size is written to the <html> element as data-text-size and
 * remembered on the device, so every screen grows together. The same value is
 * also saved on the user's profile (profiles.text_size) so it follows them.
 */

export const TEXT_SIZES = ["default", "large", "xlarge"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  default: "Default",
  large: "Large",
  xlarge: "Extra large",
};

const STORAGE_KEY = "old-touch-text-size";

export function isTextSize(value: unknown): value is TextSize {
  return typeof value === "string" && (TEXT_SIZES as readonly string[]).includes(value);
}

export function getStoredTextSize(): TextSize {
  if (typeof window === "undefined") return "default";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTextSize(stored) ? stored : "default";
}

export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset["textSize"] = size;
}

export function saveTextSize(size: TextSize) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, size);
  }
  applyTextSize(size);
}
