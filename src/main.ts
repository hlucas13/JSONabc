// ── JSONabc — main application module (orchestrator) ──
// This file wires together the modular UI, theme, and JSON-processing subsystems.

import './glass-distortion';
import { saveSnapshot } from './history-store';
import { countLines } from './json-utils';
import { formatJsonc, processJsonc } from './jsonc-processor';
import { createEditor } from './ui/editor';
import { closeAllMenus, initMenus, toggleSettingsMenu } from './ui/menu';
import {
  clearAllHistory,
  closeHelpModal,
  closeHistoryModal,
  initModals,
  openHelpModal,
  openHistoryModal,
} from './ui/modals';
import { applyGlassStyle, applyTheme, detectSystemTheme, initTheme } from './ui/theme';
import { initToast, showToast, type ToastType } from './ui/toast';

// ── DOM refs ──
const iconThemeSettings = document.getElementById('icon-theme-settings')!;
const btnSort = document.getElementById('btn-sort') as HTMLButtonElement;
const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;
const settingsMenu = document.getElementById('settings-menu')!;
const btnHamburger = document.getElementById('btn-hamburger')!;
const hamburgerPanel = document.getElementById('hamburger-panel')!;
const sortMenu = document.getElementById('sort-menu')!;
const toast = document.getElementById('toast')!;
const toastMsg = document.getElementById('toast-msg')!;
const lineCountEl = document.getElementById('line-count')!;
const toggleTheme = document.getElementById('theme-toggle') as HTMLButtonElement;
const toggleGlass = document.getElementById('toggle-glass') as HTMLButtonElement;

// ── Initialize subsystems ──
const toastEls = initToast(toast, toastMsg);
const show = (msg: string, type: ToastType) => showToast(toastEls, msg, type);

const inputEditor = createEditor(
  document.getElementById('input-wrap')!,
  false,
  'Paste your JSON here…',
);

const outputEditor = createEditor(
  document.getElementById('output-wrap')!,
  true,
  'Sorted result will appear here…',
);

const menuEls = initMenus(settingsMenu, sortMenu, hamburgerPanel, btnHamburger);

const modalEls = initModals(
  document.getElementById('history-modal')!,
  document.getElementById('history-modal-backdrop')!,
  document.getElementById('history-list')!,
  document.getElementById('btn-close-history')!,
  document.getElementById('btn-clear-history')!,
  document.getElementById('help-modal')!,
  document.getElementById('help-modal-backdrop')!,
  document.getElementById('help-body')!,
  document.getElementById('btn-close-help')!,
  inputEditor,
  show,
);

const themeEls = initTheme(iconThemeSettings, toggleTheme, toggleGlass, inputEditor, outputEditor);

// ── State ──
let isDark = false;
let inputChangeTimer: ReturnType<typeof setTimeout> | null = null;

// ── Editor change → auto-save snapshot ──
inputEditor.on('change', () => {
  if (inputChangeTimer) clearTimeout(inputChangeTimer);
  inputChangeTimer = setTimeout(() => {
    saveSnapshot(inputEditor.getValue());
  }, 800);
});

// ── Core actions ──
function handleProcessJSON(sortArrays: boolean): void {
  const raw = inputEditor.getValue();
  const { result, error } = processJsonc(raw, sortArrays);

  if (error === 'Empty input') {
    show('Paste some JSON to get started.', 'info');
    outputEditor.setValue('');
    lineCountEl.textContent = '';
    return;
  }

  if (error) {
    show('✖ Error: ' + error, 'error');
    outputEditor.setValue('');
    lineCountEl.textContent = '';
    return;
  }

  outputEditor.setValue(result);
  lineCountEl.textContent = `${countLines(result)} lines`;
  show('✔ JSON sorted successfully!', 'success');
}

function handleFormatOnly(): void {
  const raw = inputEditor.getValue();
  const { result, error } = formatJsonc(raw);

  if (error === 'Empty input') {
    show('Paste some JSON to format.', 'info');
    outputEditor.setValue('');
    lineCountEl.textContent = '';
    return;
  }

  if (error) {
    show('✖ Error: ' + error, 'error');
    outputEditor.setValue('');
    lineCountEl.textContent = '';
    return;
  }

  outputEditor.setValue(result);
  lineCountEl.textContent = `${countLines(result)} lines`;
  show('✔ JSON formatted!', 'success');
}

function copyResult(): void {
  const val = outputEditor.getValue();
  if (!val) {
    show('Nothing to copy.', 'info');
    return;
  }
  navigator.clipboard.writeText(val).then(
    () => show('📋 Copied!', 'success'),
    () => {
      // Fallback for older browsers (e.g. HTTP context where Clipboard API is unavailable)
      try {
        const ta = document.createElement('textarea');
        ta.value = val;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        show('📋 Copied!', 'success');
      } catch {
        show('✖ Failed to copy. Try selecting the text manually.', 'error');
      }
    },
  );
}

function clearAll(): void {
  if (!inputEditor.getValue().trim() && !outputEditor.getValue().trim()) {
    show('Nothing to clear.', 'info');
    return;
  }
  if (!confirm('Clear both editors? This cannot be undone.')) return;
  inputEditor.setValue('');
  outputEditor.setValue('');
  lineCountEl.textContent = '';
  show('Cleared.', 'info');
}

// ── Event bindings ──

// Theme
toggleTheme.addEventListener('click', () => {
  isDark = !isDark;
  applyTheme(themeEls, isDark, true);
});

// Glass style
toggleGlass.addEventListener('click', () => {
  applyGlassStyle(themeEls, document.documentElement.dataset.glass !== 'frosted', true);
});

// Sort arrays toggle — removed, now in Actions menu as two separate options

// Settings menu
// Settings menu
btnSettings.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllMenus(menuEls);
  toggleSettingsMenu(menuEls, !settingsMenu.classList.contains('visible'));
});

// Sort menu
btnSort.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllMenus(menuEls);
  sortMenu.classList.toggle('visible');
  sortMenu.toggleAttribute('inert');
});

document.getElementById('sort-menu-sort')!.addEventListener('click', () => {
  closeAllMenus(menuEls);
  handleProcessJSON(false);
});

document.getElementById('sort-menu-sort-arrays')!.addEventListener('click', () => {
  closeAllMenus(menuEls);
  handleProcessJSON(true);
});

document.getElementById('sort-menu-format')!.addEventListener('click', () => {
  closeAllMenus(menuEls);
  handleFormatOnly();
});

// Hamburger menu
btnHamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !hamburgerPanel.classList.contains('visible');
  if (isOpen) {
    closeAllMenus(menuEls);
    hamburgerPanel.classList.add('visible');
    hamburgerPanel.removeAttribute('inert');
  } else {
    hamburgerPanel.classList.remove('visible');
    hamburgerPanel.setAttribute('inert', '');
  }
  btnHamburger.setAttribute('aria-expanded', String(isOpen));
});

// Delegate hamburger items to dock buttons
hamburgerPanel.querySelectorAll<HTMLElement>('[data-delegates]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.delegates!)!.click();
  });
});

// Click outside to close menus
document.addEventListener('click', (e) => {
  const target = e.target as Node;
  const clickedMenu = settingsMenu.contains(target);
  const clickedBtn = (target as HTMLElement).closest('#btn-settings');
  const clickedHamburger = (target as HTMLElement).closest('#btn-hamburger');
  const clickedHamburgerPanel = hamburgerPanel.contains(target);
  const clickedSortBtn = (target as HTMLElement).closest('#btn-sort');
  const clickedSortMenu = sortMenu.contains(target);

  if (!clickedMenu && !clickedBtn) {
    settingsMenu.classList.remove('visible');
    settingsMenu.setAttribute('inert', '');
  }
  if (!clickedHamburger && !clickedHamburgerPanel) {
    hamburgerPanel.classList.remove('visible');
    hamburgerPanel.setAttribute('inert', '');
    btnHamburger.setAttribute('aria-expanded', 'false');
  }
  if (!clickedSortBtn && !clickedSortMenu) {
    sortMenu.classList.remove('visible');
    sortMenu.setAttribute('inert', '');
  }
});

// Escape key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalEls.historyModal.classList.contains('visible')) {
      closeHistoryModal(modalEls);
    } else if (modalEls.helpModal.classList.contains('visible')) {
      closeHelpModal(modalEls);
    } else if (sortMenu.classList.contains('visible')) {
      sortMenu.classList.remove('visible');
      sortMenu.setAttribute('inert', '');
    } else if (hamburgerPanel.classList.contains('visible')) {
      hamburgerPanel.classList.remove('visible');
      hamburgerPanel.setAttribute('inert', '');
      btnHamburger.setAttribute('aria-expanded', 'false');
    } else {
      settingsMenu.classList.remove('visible');
      settingsMenu.setAttribute('inert', '');
    }
  }
});

// Keyboard shortcut: Ctrl+Enter / Cmd+Enter to sort
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleProcessJSON(false);
  }
});

// Dock buttons
btnCopy.addEventListener('click', copyResult);
btnClear.addEventListener('click', clearAll);

// History modal
const btnHistory = document.getElementById('btn-history')!;
btnHistory.addEventListener('click', (e: MouseEvent) => {
  e.stopPropagation();
  closeAllMenus(menuEls);
  openHistoryModal(modalEls);
});

modalEls.historyModalBackdrop.addEventListener('click', () => closeHistoryModal(modalEls));
modalEls.btnCloseHistory.addEventListener('click', () => closeHistoryModal(modalEls));
modalEls.btnClearHistory.addEventListener('click', () => clearAllHistory(modalEls));

// Help modal
const btnHelp = document.getElementById('btn-help')!;
btnHelp.addEventListener('click', () => {
  closeAllMenus(menuEls);
  openHelpModal(modalEls);
});

modalEls.helpModalBackdrop.addEventListener('click', () => closeHelpModal(modalEls));
modalEls.btnCloseHelp.addEventListener('click', () => closeHelpModal(modalEls));

// ── Restore preferences ──
function restorePrefs(): void {
  const savedTheme = localStorage.getItem('jsonabc-theme');
  isDark = savedTheme ? savedTheme === 'dark' : detectSystemTheme();
  applyTheme(themeEls, isDark, false, false);

  const savedGlass = localStorage.getItem('jsonabc-glass');
  applyGlassStyle(themeEls, savedGlass === 'frosted', false, false);

  // Clean up removed feature
  localStorage.removeItem('jsonabc-sync-scroll');
}

// ── Init ──
restorePrefs();
show('Ready. Paste your JSON and click Sort.', 'info');

setTimeout(() => {
  inputEditor.refresh();
  outputEditor.refresh();
}, 100);
