// src/lib/normalize.ts

/**
 * Normalize city and name capitalization and spacing.
 * Example: "  new   york " -> "New York"
 */
export function normalizeInput(text?: string): string {
  if (!text) return "";
  return text
    .trim() // remove extra spaces
    .split(/\s+/) // collapse multiple spaces
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalize a member entry (name + city)
 */
export function normalizeMember(member: { name: string; city: string }) {
  return {
    name: normalizeInput(member.name),
    city: normalizeInput(member.city),
  };
}
