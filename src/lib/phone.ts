export function normalizeIndianPhone(value: string): string | null {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+91") && digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }

  return null;
}

export function displayIndianPhone(phone: string): string {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return phone;
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 8)} ${normalized.slice(8)}`;
}
