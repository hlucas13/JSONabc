import { describe, expect, it } from 'vitest';
import {
  compareValues,
  countLines,
  formatJson,
  formatOnly,
  parseJson,
  processJson,
  sortValue,
  stripTrailingCommas,
} from './json-utils';

describe('stripTrailingCommas', () => {
  it('removes trailing comma before }', () => {
    expect(stripTrailingCommas('{"a": 1,}')).toBe('{"a": 1}');
  });

  it('removes trailing comma before ]', () => {
    expect(stripTrailingCommas('[1, 2,]')).toBe('[1, 2]');
  });

  it('handles nested structures', () => {
    expect(stripTrailingCommas('{"a": [1, 2,],}')).toBe('{"a": [1, 2]}');
  });

  it('does nothing when no trailing commas', () => {
    expect(stripTrailingCommas('{"a": 1}')).toBe('{"a": 1}');
  });
});

describe('parseJson', () => {
  it('parses valid JSON', () => {
    expect(parseJson('{"name": "test"}')).toEqual({ name: 'test' });
  });

  it('parses JSON with trailing commas', () => {
    expect(parseJson('{"name": "test",}')).toEqual({ name: 'test' });
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJson('{invalid}')).toThrow();
  });
});

describe('compareValues', () => {
  it('sorts null before other types', () => {
    expect(compareValues(null, 1)).toBe(-1);
    expect(compareValues(1, null)).toBe(1);
  });

  it('sorts booleans naturally', () => {
    expect(compareValues(false, true)).toBe(-1);
    expect(compareValues(true, false)).toBe(1);
    expect(compareValues(true, true)).toBe(0);
  });

  it('sorts numbers numerically', () => {
    expect(compareValues(1, 2)).toBe(-1);
    expect(compareValues(5, 3)).toBe(2);
    expect(compareValues(3, 3)).toBe(0);
  });

  it('sorts strings alphabetically', () => {
    expect(compareValues('a', 'b')).toBe(-1);
    expect(compareValues('zebra', 'apple')).toBeGreaterThan(0);
  });

  it('sorts objects by stringified form', () => {
    expect(compareValues({ a: 1 }, { b: 2 })).not.toBe(0);
  });

  it('sorts arrays before objects when comparing objects', () => {
    expect(compareValues([1, 2], { a: 1 })).toBe(-1);
    expect(compareValues({ a: 1 }, [1, 2])).toBe(1);
  });

  it('sorts different types by type name', () => {
    // "boolean" < "number" < "string"
    expect(compareValues(false, 0)).toBe(-1);
    expect(compareValues(0, 'a')).toBe(-1);
  });
});

describe('sortValue', () => {
  it('sorts object keys alphabetically', () => {
    const input = { c: 3, a: 1, b: 2 };
    const result = sortValue(input, false) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
  });

  it('sorts nested objects', () => {
    const input = { z: { b: 2, a: 1 }, a: 3 };
    const result = sortValue(input, false) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['a', 'z']);
    expect(Object.keys(result['z'] as Record<string, unknown>)).toEqual(['a', 'b']);
  });

  it('preserves array order when sortArrays is false', () => {
    const input = { items: [3, 1, 2] };
    const result = sortValue(input, false) as Record<string, unknown>;
    expect(result['items']).toEqual([3, 1, 2]);
  });

  it('sorts array values when sortArrays is true', () => {
    const input = { items: [3, 1, 2] };
    const result = sortValue(input, true) as Record<string, unknown>;
    expect(result['items']).toEqual([1, 2, 3]);
  });

  it('handles null values', () => {
    expect(sortValue(null, false)).toBe(null);
  });

  it('handles primitives', () => {
    expect(sortValue(42, false)).toBe(42);
    expect(sortValue('hello', false)).toBe('hello');
    expect(sortValue(true, false)).toBe(true);
  });

  it('handles mixed-type arrays with sortArrays true', () => {
    const input = ['b', 1, null, true];
    const result = sortValue(input, true) as unknown[];
    // null < boolean < number < string
    expect(result).toEqual([null, true, 1, 'b']);
  });
});

describe('formatJson', () => {
  it('pretty-prints JSON with 2-space indent', () => {
    const result = formatJson({ a: 1, b: 2 });
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });
});

describe('processJson', () => {
  it('returns sorted JSON', () => {
    const { result, error } = processJson('{"c": 3, "a": 1}', false);
    expect(error).toBeUndefined();
    expect(result).toBe('{\n  "a": 1,\n  "c": 3\n}');
  });

  it('returns error for invalid JSON', () => {
    const { result, error } = processJson('{bad}', false);
    expect(result).toBe('');
    expect(error).toBeDefined();
  });

  it('returns error for empty input', () => {
    const { result, error } = processJson('  ', false);
    expect(result).toBe('');
    expect(error).toBe('Empty input');
  });
});

describe('formatOnly', () => {
  it('formats without sorting keys', () => {
    const { result, error } = formatOnly('{"z": 1, "a": 2}');
    expect(error).toBeUndefined();
    expect(result).toBe('{\n  "z": 1,\n  "a": 2\n}');
  });

  it('returns error for empty input', () => {
    const { result, error } = formatOnly('');
    expect(result).toBe('');
    expect(error).toBe('Empty input');
  });
});

describe('countLines', () => {
  it('counts lines correctly', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(countLines('')).toBe(0);
  });

  it('counts single line', () => {
    expect(countLines('hello')).toBe(1);
  });
});
