// ── JSON processing utilities ──

export interface JsonValue {
  [key: string]: JsonValue;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonData = JsonPrimitive | JsonArray | JsonValue;

/**
 * Removes trailing commas from JSON-like strings so they can be parsed.
 * Handles commas before `}` or `]` at any nesting level.
 */
export function stripTrailingCommas(raw: string): string {
  return raw.replace(/,\s*([}\]])/g, '$1');
}

/**
 * Parses a JSON string, tolerating trailing commas.
 * @throws {SyntaxError} if the string cannot be parsed as JSON.
 */
export function parseJson(raw: string): unknown {
  const cleaned = stripTrailingCommas(raw);
  return JSON.parse(cleaned);
}

/**
 * Compares two JSON values for sorting purposes.
 * Order of types: null < boolean < number < string < object.
 * Within the same type, values are compared naturally.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;

  const ta = typeof a;
  const tb = typeof b;

  // Same-type comparisons
  if (ta === 'boolean' && tb === 'boolean') {
    if (a === b) return 0;
    return a ? 1 : -1;
  }
  if (ta === 'number' && tb === 'number') return (a as number) - (b as number);
  if (ta === 'string' && tb === 'string') return (a as string).localeCompare(b as string);
  if (ta === 'object' && tb === 'object') {
    // Compare by type tag first (array vs object), then by stable key representation
    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return aIsArray ? -1 : 1;
    // For same-type objects, compare by stringified form for stability
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
  }

  // Different types: sort by type name for deterministic order
  return ta.localeCompare(tb);
}

/**
 * Recursively sorts object keys alphabetically.
 * If `sortArrays` is true, array values are also sorted.
 */
export function sortValue(val: unknown, sortArrays: boolean): unknown {
  if (val === null || typeof val !== 'object') return val;

  if (Array.isArray(val)) {
    const arr = val.map((v) => sortValue(v, sortArrays));
    if (sortArrays) {
      return [...arr].sort((a, b) => compareValues(a, b));
    }
    return arr;
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(val as Record<string, unknown>).sort((a, b) => a.localeCompare(b));
  for (const k of keys) {
    sorted[k] = sortValue((val as Record<string, unknown>)[k], sortArrays);
  }
  return sorted;
}

/**
 * Formats a parsed JSON value as a pretty-printed string.
 */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/**
 * Processes raw JSON input: parses, sorts, and formats.
 * @returns `{ result: string, error?: string }`
 */
export function processJson(raw: string, sortArrays: boolean): { result: string; error?: string } {
  if (!raw.trim()) {
    return { result: '', error: 'Empty input' };
  }
  try {
    const parsed = parseJson(raw);
    const sorted = sortValue(parsed, sortArrays);
    return { result: formatJson(sorted) };
  } catch (err) {
    return {
      result: '',
      error: (err as Error).message,
    };
  }
}

/**
 * Formats raw JSON input without sorting keys.
 * @returns `{ result: string, error?: string }`
 */
export function formatOnly(raw: string): { result: string; error?: string } {
  if (!raw.trim()) {
    return { result: '', error: 'Empty input' };
  }
  try {
    const parsed = parseJson(raw);
    return { result: formatJson(parsed) };
  } catch (err) {
    return {
      result: '',
      error: (err as Error).message,
    };
  }
}

/**
 * Counts the number of lines in a string.
 */
export function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}
