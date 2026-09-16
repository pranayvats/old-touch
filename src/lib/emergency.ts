/** Shared helpers for the Emergency flow. */
export const EMERGENCY_REASONS = [
  "Heart problem",
  "Fainted",
  "Severe pain",
  "Breathing problem",
  "Injury",
  "Other",
] as const;

export type EmergencyReason = (typeof EMERGENCY_REASONS)[number];

export function isEmergencyReason(value: unknown): value is EmergencyReason {
  return typeof value === "string" && (EMERGENCY_REASONS as readonly string[]).includes(value);
}

/** Keeps digits and a single leading + for safe tel: links. */
export function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/** E.164 allows at most 15 digits. */
export function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").length;
  return digits >= 10 && digits <= 15;
}

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
};

/** Primary contact first, then saved order. */
export function sortContacts(contacts: EmergencyContact[]) {
  return [...contacts].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
}
