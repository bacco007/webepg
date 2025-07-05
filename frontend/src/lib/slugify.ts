// Regex patterns for slugification
const FTA_PREFIX_REGEX = /^FTA\s*-\s*/i;
const SPECIAL_CHARS_REGEX = /[^a-z0-9\s-]/g;
const SPACES_REGEX = /\s+/g;
const MULTIPLE_HYPHENS_REGEX = /-+/g;
const LEADING_TRAILING_HYPHENS_REGEX = /^-|-$/g;
const WORD_BOUNDARY_REGEX = /\b\w/g;

/**
 * Converts a region name to a URL-friendly slug
 * Removes "FTA - " prefix and converts to lowercase with hyphens
 */
export function slugifyRegion(region: string): string {
  // Remove "FTA - " prefix if present
  const cleaned = region.replace(FTA_PREFIX_REGEX, "");

  // Convert to lowercase and replace spaces/special chars with hyphens
  return cleaned
    .toLowerCase()
    .replace(SPECIAL_CHARS_REGEX, "") // Remove special characters except spaces and hyphens
    .replace(SPACES_REGEX, "-") // Replace spaces with hyphens
    .replace(MULTIPLE_HYPHENS_REGEX, "-") // Replace multiple hyphens with single hyphen
    .replace(LEADING_TRAILING_HYPHENS_REGEX, ""); // Remove leading/trailing hyphens
}

/**
 * Converts a slug back to a display-friendly region name
 * This is used for reverse lookup when reading from URL
 */
export function deslugifyRegion(slug: string): string {
  // Convert hyphens back to spaces and capitalize
  return slug
    .replace(/-/g, " ")
    .replace(WORD_BOUNDARY_REGEX, (char) => char.toUpperCase());
}
