// ── JSONC Processor — comment-preserving JSONC sort & format ──
//
// Parses JSON with comments (// and /* */), sorts object keys alphabetically,
// and serialises back with comments preserved in sensible positions.
//
// Comment association heuristics:
//   - Consecutive comments before a property → attached to it, move with it
//   - Comments at the start of an object (before first property) → preserved as header
//   - Comments at the end of an object (after last property) → preserved as footer
//   - Standalone/instruction comments between properties → move with the next property
//   - Commented-out properties (// "key": value) → treated as plain comments,
//     NOT sorted as active properties
//
// Inline comments (after a value on the same line) do not survive the
// parse/serialize round-trip — they are re-emitted as a leading comment
// for the next element.

import { createScanner, SyntaxKind, type JSONScanner } from 'jsonc-parser';

// ── Types ──

interface Comment {
  text: string;
}

interface Prop {
  /** Leading comments immediately before this property. */
  comments: Comment[];
  key: string;
  value: Value;
}

interface ArrayItem {
  /** Leading comments immediately before this element. */
  comments: Comment[];
  value: Value;
}

interface ObjectVal {
  kind: 'object';
  props: Prop[];
  /** Comments after `{` before the first property. */
  openComments: Comment[];
  /** Comments after the last property before `}`. */
  closeComments: Comment[];
}

interface ArrayVal {
  kind: 'array';
  items: ArrayItem[];
}

type Value =
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | ObjectVal
  | ArrayVal;

// ── Document type (root value with surrounding comments) ──

interface Document {
  /** Comments and whitespace before the root value (file header). */
  leading: string;
  /** The parsed root value tree. */
  root: Value;
  /** Comments and whitespace after the root value (file footer). */
  trailing: string;
}

// ── Public API ──

export interface ProcessResult {
  result: string;
  error?: string;
}

/**
 * Parses JSONC input, sorts all object keys alphabetically (and optionally
 * array elements), and returns the result with comments preserved.
 */
export function processJsonc(raw: string, sortArrays: boolean): ProcessResult {
  if (!raw.trim()) {
    return { result: '', error: 'Empty input' };
  }
  try {
    const doc = parseDocument(raw);
    sortValue(doc.root, sortArrays);
    return { result: stringifyDocument(doc) };
  } catch (err) {
    return { result: '', error: (err as Error).message };
  }
}

/**
 * Pretty-prints JSONC without reordering keys. Comments are preserved.
 */
export function formatJsonc(raw: string): ProcessResult {
  if (!raw.trim()) {
    return { result: '', error: 'Empty input' };
  }
  try {
    const doc = parseDocument(raw);
    return { result: stringifyDocument(doc) };
  } catch (err) {
    return { result: '', error: (err as Error).message };
  }
}

// ── Helpers ──

function tokenName(kind: SyntaxKind): string {
  const names: Record<number, string> = {
    [SyntaxKind.OpenBraceToken]: 'OpenBraceToken',
    [SyntaxKind.CloseBraceToken]: 'CloseBraceToken',
    [SyntaxKind.OpenBracketToken]: 'OpenBracketToken',
    [SyntaxKind.CloseBracketToken]: 'CloseBracketToken',
    [SyntaxKind.CommaToken]: 'CommaToken',
    [SyntaxKind.ColonToken]: 'ColonToken',
    [SyntaxKind.NullKeyword]: 'NullKeyword',
    [SyntaxKind.TrueKeyword]: 'TrueKeyword',
    [SyntaxKind.FalseKeyword]: 'FalseKeyword',
    [SyntaxKind.StringLiteral]: 'StringLiteral',
    [SyntaxKind.NumericLiteral]: 'NumericLiteral',
    [SyntaxKind.LineCommentTrivia]: 'LineCommentTrivia',
    [SyntaxKind.BlockCommentTrivia]: 'BlockCommentTrivia',
    [SyntaxKind.LineBreakTrivia]: 'LineBreakTrivia',
    [SyntaxKind.Trivia]: 'Trivia',
    [SyntaxKind.Unknown]: 'Unknown',
    [SyntaxKind.EOF]: 'EOF',
  };
  return names[kind] ?? `Token(${kind})`;
}

function isComment(kind: SyntaxKind): boolean {
  return kind === SyntaxKind.LineCommentTrivia || kind === SyntaxKind.BlockCommentTrivia;
}

// ── Parser ──

class Parser {
  private readonly text: string;
  private readonly scanner: JSONScanner;
  private token: SyntaxKind;

  constructor(text: string) {
    this.text = text;
    this.scanner = createScanner(text, false);
    // First scan is done in parse() so we can capture leading trivia via positions
    this.token = SyntaxKind.Unknown;
  }

  private get value(): string {
    return this.scanner.getTokenValue();
  }

  private get offset(): number {
    return this.scanner.getTokenOffset();
  }

  private next(): SyntaxKind {
    this.token = this.scanner.scan();
    return this.token;
  }

  private atEnd(): boolean {
    return this.token === SyntaxKind.EOF;
  }

  /** Skip over whitespace-only trivia tokens (non-comment). */
  private skipTrivia(): void {
    while (this.token === SyntaxKind.Trivia || this.token === SyntaxKind.LineBreakTrivia) {
      this.next();
    }
  }

  /** Expect the current token to be `kind`, then advance. */
  private expect(kind: SyntaxKind): void {
    if (this.token !== kind) {
      const name = this.atEnd() ? 'EOF' : tokenName(this.token);
      throw new Error(`Expected ${tokenName(kind)} but got ${name} at offset ${this.offset}`);
    }
    this.next();
  }

  /** Skip all non-semantic tokens (whitespace, line breaks, comments). */
  private skipAllTrivia(): void {
    while (!this.atEnd()) {
      if (
        this.token === SyntaxKind.Trivia ||
        this.token === SyntaxKind.LineBreakTrivia ||
        isComment(this.token)
      ) {
        this.next();
      } else {
        break;
      }
    }
  }

  /** Entry point: parse the full document, preserving top-level comments. */
  parse(): Document {
    // Scan the very first token
    this.token = this.scanner.scan();

    // ── Leading trivia: from offset 0 to the first semantic token ──
    this.skipAllTrivia();
    const leadingEnd = this.scanner.getTokenOffset();
    const leading = this.text.slice(0, leadingEnd);

    // ── Root value ──
    if (this.atEnd()) {
      // File has only comments with no JSON value
      return { leading, root: { kind: 'null' }, trailing: '' };
    }
    const root = this.readValue();

    // ── Trailing trivia (after root value) ──
    const trailingStart = this.scanner.getPosition();
    while (!this.atEnd()) {
      this.next();
    }
    const trailing = this.text.slice(trailingStart);

    return { leading, root, trailing };
  }

  /** Read any JSON value (string, number, boolean, null, object, array). */
  private readValue(): Value {
    this.skipTrivia();
    switch (this.token) {
      case SyntaxKind.StringLiteral: {
        const val = this.value; // decoded value (no quotes, unescaped)
        this.next();
        return { kind: 'string', value: val };
      }
      case SyntaxKind.NumericLiteral: {
        const val = this.value; // already a number as a string
        this.next();
        return { kind: 'number', value: Number(val) };
      }
      case SyntaxKind.TrueKeyword:
        this.next();
        return { kind: 'boolean', value: true };
      case SyntaxKind.FalseKeyword:
        this.next();
        return { kind: 'boolean', value: false };
      case SyntaxKind.NullKeyword:
        this.next();
        return { kind: 'null' };
      case SyntaxKind.OpenBraceToken:
        return this.readObject();
      case SyntaxKind.OpenBracketToken:
        return this.readArray();
      default: {
        const name = this.atEnd() ? 'EOF' : tokenName(this.token);
        throw new Error(`Unexpected token ${name} at offset ${this.offset}`);
      }
    }
  }

  /** Read `{ … }` with properties and associative comments. */
  private readObject(): Value {
    this.next(); // skip '{'

    const openComments: Comment[] = [];
    const props: Prop[] = [];
    let pending: Comment[] = [];
    let isFirstProp = true;

    while (!this.atEnd() && this.token !== SyntaxKind.CloseBraceToken) {
      // Skip whitespace and line breaks
      this.skipTrivia();

      // After skipping trivia we may be at the closing brace — re-check
      if ((this.token as SyntaxKind) === SyntaxKind.CloseBraceToken || this.atEnd()) break;

      // Collect comments
      if (isComment(this.token)) {
        pending.push({ text: this.value });
        this.next();
        continue;
      }

      // Skip commas
      if (this.token === SyntaxKind.CommaToken) {
        this.next();
        continue;
      }

      // At this point we should be at a string key
      if (this.token !== SyntaxKind.StringLiteral) {
        const name = tokenName(this.token);
        throw new Error(`Expected property key but got ${name} at offset ${this.offset}`);
      }

      // Comments before the FIRST property are object-level header comments.
      // Comments between properties are leading comments for the next property.
      if (isFirstProp) {
        openComments.push(...pending);
        pending = [];
        isFirstProp = false;
      }

      // Assign pending comments to this property
      const comments = pending;
      pending = [];

      // Read key (value is already decoded)
      const key = this.value;
      this.next();

      // Colon
      if ((this.token as SyntaxKind) !== SyntaxKind.ColonToken) {
        throw new Error(`Expected ':' at offset ${this.offset}`);
      }
      this.next();

      // Value
      const value = this.readValue();

      props.push({ comments, key, value });
    }

    // Remaining pending comments (after last property, before `}`) are close comments
    const closeComments = pending;

    this.expect(SyntaxKind.CloseBraceToken);

    return { kind: 'object', props, openComments, closeComments };
  }

  /** Read `[ … ]` with elements. */
  private readArray(): Value {
    this.next(); // skip '['

    const items: ArrayItem[] = [];
    let pending: Comment[] = [];

    while (!this.atEnd() && this.token !== SyntaxKind.CloseBracketToken) {
      // Skip whitespace and line breaks
      this.skipTrivia();

      // After skipping trivia we may be at the closing bracket — re-check
      if ((this.token as SyntaxKind) === SyntaxKind.CloseBracketToken || this.atEnd()) break;

      // Collect comments
      if (isComment(this.token)) {
        pending.push({ text: this.value });
        this.next();
        continue;
      }

      // Skip commas
      if (this.token === SyntaxKind.CommaToken) {
        this.next();
        continue;
      }

      // Read element value
      const comments = pending;
      pending = [];
      const value = this.readValue();
      items.push({ comments, value });
    }

    this.expect(SyntaxKind.CloseBracketToken);

    return { kind: 'array', items };
  }
}

/** Parse the full JSONC text into a Document (value + surrounding comments). */
function parseDocument(text: string): Document {
  const parser = new Parser(text);
  return parser.parse();
}

// ── Sorter ──

/** Recursively sort all object keys alphabetically and, optionally, array elements. */
function sortValue(val: Value, sortArrays: boolean): void {
  if (val.kind === 'object') {
    // Sort properties by key (A–Z). Comments stay attached to their property.
    val.props.sort((a, b) => a.key.localeCompare(b.key));
    for (const prop of val.props) {
      sortValue(prop.value, sortArrays);
    }
  } else if (val.kind === 'array') {
    if (sortArrays) {
      val.items.sort((a, b) => compareValues(a.value, b.value));
    }
    for (const item of val.items) {
      sortValue(item.value, sortArrays);
    }
  }
}

/**
 * Compare two values for sorting in arrays.
 * Order: null < boolean < number < string < object/array
 */
function compareValues(a: Value, b: Value): number {
  const typeOrder = (v: Value): number => {
    switch (v.kind) {
      case 'null':
        return 0;
      case 'boolean':
        return 1;
      case 'number':
        return 2;
      case 'string':
        return 3;
      default:
        return 4; // object, array
    }
  };

  const oa = typeOrder(a);
  const ob = typeOrder(b);
  if (oa !== ob) return oa - ob;

  // Same-kind comparison
  switch (a.kind) {
    case 'null':
      return 0;
    case 'boolean':
      if (a.value === (b as typeof a).value) return 0;
      return a.value ? 1 : -1;
    case 'number':
      return a.value - (b as typeof a).value;
    case 'string':
      return a.value.localeCompare((b as typeof a).value);
    default: {
      // object / array: compare by stringified form
      const sa = stringifyValue(a, '');
      const sb = stringifyValue(b, '');
      return sa.localeCompare(sb);
    }
  }
}

// ── Serializer ──

/**
 * Pretty-prints a Value tree with 2-space indentation.
 * Always uses multi-line format (one property per line).
 * Comments are emitted at their associated positions.
 */
function stringifyValue(val: Value, indent: string): string {
  switch (val.kind) {
    case 'string':
      return JSON.stringify(val.value);
    case 'number':
      return String(val.value);
    case 'boolean':
      return val.value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'object':
      return stringifyObject(val, indent);
    case 'array':
      return stringifyArray(val, indent);
  }
}

function stringifyObject(val: ObjectVal, indent: string): string {
  if (val.props.length === 0 && val.openComments.length === 0 && val.closeComments.length === 0) {
    return '{}';
  }

  const inner = indent + '  ';
  const lines: string[] = [];
  lines.push('{');

  // Open comments (before first property)
  for (const c of val.openComments) {
    lines.push(inner + c.text);
  }

  // Properties (use a trailing comma on all lines except the last)
  const propLines: string[] = [];
  for (const prop of val.props) {
    // Leading comments
    for (const c of prop.comments) {
      propLines.push(inner + c.text);
    }
    // Serialized key + value
    const keyStr = stringifyKey(prop.key);
    const valStr = stringifyValue(prop.value, inner);
    propLines.push(`${inner}${keyStr}: ${valStr}`);
  }
  for (let i = 0; i < propLines.length; i++) {
    const isLastProp = i === propLines.length - 1 && val.closeComments.length === 0;
    lines.push(isLastProp ? propLines[i] : propLines[i] + ',');
  }

  // Close comments (after last property)
  for (const c of val.closeComments) {
    lines.push(inner + c.text);
  }

  lines.push(indent + '}');
  return lines.join('\n');
}

function stringifyArray(val: ArrayVal, indent: string): string {
  if (val.items.length === 0) {
    return '[]';
  }

  const inner = indent + '  ';
  const lines: string[] = [];
  lines.push('[');

  // Elements (comma-separated, no trailing comma on last)
  const elemLines: string[] = [];
  for (const item of val.items) {
    // Leading comments
    for (const c of item.comments) {
      elemLines.push(inner + c.text);
    }
    // Value
    const valStr = stringifyValue(item.value, inner);
    elemLines.push(`${inner}${valStr}`);
  }
  for (let i = 0; i < elemLines.length; i++) {
    const isLast = i === elemLines.length - 1;
    lines.push(isLast ? elemLines[i] : elemLines[i] + ',');
  }

  lines.push(indent + ']');
  return lines.join('\n');
}

/** Pretty-prints a Document (value + surrounding comments). */
function stringifyDocument(doc: Document): string {
  return doc.leading + stringifyValue(doc.root, '') + doc.trailing;
}

/** Like JSON.stringify, but always uses double quotes for keys. */
function stringifyKey(key: string): string {
  return `"${key}"`;
}
