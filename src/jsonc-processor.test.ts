import { describe, expect, it } from 'vitest';
import { formatJsonc, processJsonc } from './jsonc-processor';

describe('processJsonc', () => {
  it('sorts object keys alphabetically', () => {
    const { result, error } = processJsonc('{"c": 3, "a": 1}', false);
    expect(error).toBeUndefined();
    expect(result).toBe('{\n  "a": 1,\n  "c": 3\n}');
  });

  it('sorts nested objects', () => {
    const { result, error } = processJsonc('{"z": {"b": 2, "a": 1}, "a": 3}', false);
    expect(error).toBeUndefined();
    expect(result).toBe('{\n  "a": 3,\n  "z": {\n    "a": 1,\n    "b": 2\n  }\n}');
  });

  it('returns error for invalid JSON', () => {
    const { result, error } = processJsonc('{bad}', false);
    expect(result).toBe('');
    expect(error).toBeDefined();
  });

  it('returns error for empty input', () => {
    const { result, error } = processJsonc('  ', false);
    expect(result).toBe('');
    expect(error).toBe('Empty input');
  });

  it('handles trailing commas in input', () => {
    const { result, error } = processJsonc('{"c": 3, "a": 1,}', false);
    expect(error).toBeUndefined();
    // Output should be standard JSON — no trailing commas
    expect(result).toBe('{\n  "a": 1,\n  "c": 3\n}');
  });

  it('preserves line comments before properties', () => {
    const { result, error } = processJsonc(
      '{\n  // this comes first\n  "b": 2,\n  // then this\n  "a": 1\n}',
      false,
    );
    expect(error).toBeUndefined();
    expect(result).toContain('// this comes first');
    expect(result).toContain('// then this');
    // "a" comes first after sorting, with its comment
    const idxA = result.indexOf('"a"');
    const idxB = result.indexOf('"b"');
    expect(idxA).toBeLessThan(idxB);
  });

  it('preserves block comments', () => {
    const { result, error } = processJsonc('{\n  /* block */\n  "b": 2,\n  "a": 1\n}', false);
    expect(error).toBeUndefined();
    expect(result).toContain('/* block */');
  });

  it('handles JSONC with comments and trailing commas', () => {
    const input = `{
      // user info
      "name": "John",
      "age": 30,
      // address details
      "address": {
        "zip": "12345",
        "city": "NYC",
      },
    }`;
    const { result, error } = processJsonc(input, false);
    expect(error).toBeUndefined();
    // Keys should be sorted
    expect(result.indexOf('"address"')).toBeLessThan(result.indexOf('"age"'));
    expect(result.indexOf('"age"')).toBeLessThan(result.indexOf('"name"'));
    // Inside address: city < zip
    expect(result.indexOf('"city"')).toBeLessThan(result.indexOf('"zip"'));
  });

  it('sorts array elements when sortArrays is true', () => {
    const { result, error } = processJsonc('{"items": [3, 1, 2]}', true);
    expect(error).toBeUndefined();
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
    // No trailing comma in array
    expect(result).not.toContain('3,');
  });
});

describe('formatJsonc', () => {
  it('formats without sorting keys', () => {
    const { result, error } = formatJsonc('{"z": 1, "a": 2}');
    expect(error).toBeUndefined();
    // Keys stay in original order (z before a)
    expect(result.indexOf('"z"')).toBeLessThan(result.indexOf('"a"'));
  });

  it('preserves comments', () => {
    const { result, error } = formatJsonc('{\n  // a comment\n  "x": 1\n}');
    expect(error).toBeUndefined();
    expect(result).toContain('// a comment');
  });

  it('returns error for empty input', () => {
    const { result, error } = formatJsonc('');
    expect(result).toBe('');
    expect(error).toBe('Empty input');
  });
});

describe('top-level comments', () => {
  it('handles leading comments before root value', () => {
    const input = `// Zed settings
//
// For information on how to configure Zed
{
  "z": 1,
  "a": 2
}`;
    const { result, error } = processJsonc(input, false);
    expect(error).toBeUndefined();
    // Leading comments are preserved at the top
    expect(result).toMatch(/^\/\/ Zed settings/);
    // Root value is parsed correctly and sorted
    expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"z"'));
  });

  it('handles both leading and trailing comments', () => {
    const input = `// header comment
{
  "b": 1,
  "a": 2
}
// footer comment`;
    const { result, error } = processJsonc(input, false);
    expect(error).toBeUndefined();
    // Leading comment is at the top
    expect(result).toMatch(/^\/\/ header comment/);
    // Trailing comment is at the bottom
    expect(result).toMatch(/\/\/ footer comment$/);
    // Keys are sorted
    expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"b"'));
  });
});
