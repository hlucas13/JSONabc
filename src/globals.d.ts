// CodeMirror 5 (loaded from CDN)
declare var CodeMirror: {
  new (el: HTMLElement, options?: Record<string, unknown>): CodeMirror.Editor;
  (el: HTMLElement, options?: Record<string, unknown>): CodeMirror.Editor;
};

declare namespace CodeMirror {
  interface ScrollInfo {
    left: number;
    top: number;
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
  }

  interface Editor {
    setValue(s: string): void;
    getValue(): string;
    setOption(opt: string, val: unknown): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    toTextArea(): void;
    refresh(): void;
    getDoc(): Doc;
    focus(): void;
    setSize(w: number | string | null, h: number | string | null): void;
    getScrollInfo(): ScrollInfo;
    scrollTo(x: number | null, y: number): void;
    lineAtHeight(height: number): number;
    heightAtLine(line: number): number;
  }
  interface Doc {
    getValue(): string;
    setValue(s: string): void;
    getAllMarks(): { clear(): void }[];
    markText(
      from: { line: number; ch: number },
      to: { line: number; ch: number },
      opts: Record<string, unknown>,
    ): { clear(): void };
  }
}

// GSAP (loaded from CDN)
declare var gsap: {
  to(el: HTMLElement | object, vars: Record<string, unknown>): object;
  delayedCall(delay: number, fn: () => void): object;
};
