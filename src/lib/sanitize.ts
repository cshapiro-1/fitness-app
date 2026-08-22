/**
 * Input sanitization and bounds checking utilities
 * Protects against XSS, HTML injection, and numeric overflow / out-of-bounds payloads.
 */

/**
 * Strips HTML tags, script elements, javascript: pseudo-protocols, and control characters.
 */
export function sanitizeText(input: string | null | undefined, maxLength: number = 2000): string {
  if (!input || typeof input !== "string") return "";

  // 1. Remove script tags and their contents
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove all HTML tags
  sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, "");

  // 3. Remove dangerous javascript: or data: URIs
  sanitized = sanitized.replace(/(javascript|vbscript|data):/gi, "");

  // 4. Strip dangerous ASCII control characters (keep standard newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 5. Trim and enforce length limit
  return sanitized.trim().slice(0, maxLength);
}

/**
 * Validates and clamps numeric bounds to prevent negative or absurd values (e.g. 50,000 lbs weights).
 */
export function validateNumericBounds(
  val: any,
  min: number = 0,
  max: number = 2000,
  defaultVal: number = 0
): number {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
}
