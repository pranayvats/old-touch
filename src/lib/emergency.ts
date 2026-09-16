/**
 * Shared helpers for the Emergency flow: phone validation and the
 * "primary contact" marker.
 *
 * The primary marker is stored on the device (keyed by user id) because the
 * emergency_contacts table has no is_primary column yet. Contacts themselves
 * always live in Supabase under the existing RLS rules.
 */

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
  return (
    typeof value === "string" &&
    (EMERGENCY_REASONS as readonly string[]).includes(value)
  );
}

/** Keeps digits and a single leading +, so tel: links always work. */
export function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

/** Basic check: at least 10 digits, at most 15 (E.164 maximum). */
export function isValidPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").length;
  return digits >= 10 && digits <= 15;
}

const primaryKey = (userId: string) => `old-touch-primary-contact:${userId}`;

export function getPrimaryContactId(userId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(primaryKey(userId));
}

export function setPrimaryContactId(userId: string, contactId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(primaryKey(userId), contactId);
}

export function clearPrimaryContactId(userId: string, contactId: string) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(primaryKey(userId)) === contactId) {
    window.localStorage.removeItem(primaryKey(userId));
  }
}

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
};

/** Primary contact first, then the rest in their saved order. */
export function sortContacts(
  contacts: EmergencyContact[],
  primaryId: string | null,
) {
  if (!primaryId) return contacts;
  return [...contacts].sort((a, b) =>
    a.id === primaryId ? -1 : b.id === primaryId ? 1 : 0,
  );
}
