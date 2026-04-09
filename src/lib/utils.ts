import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatRelativeDate(dateString);
}

const UPPERCASE_WORDS = new Set([
  'LLC', 'INC', 'HVAC', 'DBA', 'LP', 'LLP', 'PC', 'PA', 'MD', 'DDS',
  'CO', 'CORP', 'LTD', 'PLC', 'USA', 'US', 'II', 'III', 'IV',
]);

/**
 * Title-case a name: capitalize first letter of each word,
 * preserve common abbreviations (LLC, HVAC, INC, etc.) in uppercase.
 */
export function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (UPPERCASE_WORDS.has(upper)) return upper;
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// US state abbreviations for address detection
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

/**
 * Clean an AI-extracted insured name by stripping address-like suffixes.
 *
 * The AI extraction sometimes pulls the full insured block including street
 * address, city, state, and zip. This strips the address while preserving
 * business name parts like LLC, Inc, DBA, etc.
 *
 * Strategy:
 * 1. Strip trailing "City, ST 12345" or "City ST 12345" patterns
 * 2. Strip trailing street address lines (number + street name)
 * 3. Trim and collapse whitespace
 */
export function cleanExtractedEntityName(raw: string): string {
  let name = raw.trim();

  // Remove trailing zip code patterns: ", CO 80110" or "CO 80110" at end
  // Match: optional comma, optional city words, state abbrev, zip
  name = name.replace(
    /,?\s+(?:[A-Za-z]+\s+)*([A-Z]{2})\s+\d{5}(?:-\d{4})?$/,
    (match, state) => {
      if (US_STATES.has(state.toUpperCase())) return '';
      return match; // Not a real state — keep it
    }
  );

  // Remove trailing city/state without zip: ", Englewood CO" or ", Denver, CO"
  name = name.replace(
    /,?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s+([A-Z]{2})$/,
    (match, state) => {
      if (US_STATES.has(state.toUpperCase())) return '';
      return match;
    }
  );

  // Remove trailing street address patterns: "2875 W Oxford" or "527 Kalamath"
  // Match: number, optional directional, street name word(s)
  // Only strip if it looks like a street (number followed by name words)
  name = name.replace(
    /\s+\d{1,6}\s+(?:[NSEW]\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:St|Ave|Blvd|Rd|Dr|Ln|Way|Ct|Pl|Cir|Pkwy|Hwy|Trail|Loop)\.?)?$/,
    ''
  );

  // Collapse multiple spaces and trim
  name = name.replace(/\s+/g, ' ').trim();

  // If we stripped everything (unlikely), fall back to original
  if (name.length === 0) return raw.trim();

  return name;
}
