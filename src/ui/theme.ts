// ── Theme management (dark/light, frosted/clear glass) ──

import { animateLiquidToggle, syncLiquidToggle } from './liquid-toggle';

interface ThemeElements {
  iconThemeSettings: HTMLElement;
  toggleTheme: HTMLElement;
  toggleGlass: HTMLElement;
  inputEditor: CodeMirror.Editor;
  outputEditor: CodeMirror.Editor;
}

export function initTheme(
  iconThemeSettings: HTMLElement,
  toggleTheme: HTMLElement,
  toggleGlass: HTMLElement,
  inputEditor: CodeMirror.Editor,
  outputEditor: CodeMirror.Editor,
): ThemeElements {
  return { iconThemeSettings, toggleTheme, toggleGlass, inputEditor, outputEditor };
}

const SVG_MOON_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const SVG_MOON = `<svg ${SVG_MOON_ATTRS}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SVG_SUN = `<svg ${SVG_MOON_ATTRS}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

export function applyTheme(
  elements: ThemeElements,
  dark: boolean,
  animate = false,
  persist = true,
): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  elements.iconThemeSettings.innerHTML = dark ? SVG_SUN : SVG_MOON;

  if (animate) {
    animateLiquidToggle(elements.toggleTheme, dark);
  } else {
    syncLiquidToggle(elements.toggleTheme, dark);
  }

  if (persist) {
    localStorage.setItem('jsonabc-theme', dark ? 'dark' : 'light');
  }

  elements.inputEditor.setOption('theme', 'jsonabc');
  elements.outputEditor.setOption('theme', 'jsonabc');
}

export function applyGlassStyle(
  elements: ThemeElements,
  frosted: boolean,
  animate = false,
  persist = true,
): void {
  document.documentElement.dataset.glass = frosted ? 'frosted' : 'clear';

  if (animate) {
    animateLiquidToggle(elements.toggleGlass, frosted);
  } else {
    syncLiquidToggle(elements.toggleGlass, frosted);
  }

  if (persist) {
    localStorage.setItem('jsonabc-glass', frosted ? 'frosted' : 'clear');
  }
}

export function detectSystemTheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
