// ── JSONabc — main application module ──
import "./glass-distortion";
import {
  clearHistory,
  deleteHistoryItem,
  formatHistoryDate,
  getHistory,
  saveSnapshot,
} from "./history-store";

// ── SVG icon paths (full SVG elements) ──
const SVG_SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

const SVG_MOON = `<svg ${SVG_SVG_ATTRS}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SVG_SUN = `<svg ${SVG_SVG_ATTRS}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

// ── DOM refs ──
const iconThemeSettings = document.getElementById("icon-theme-settings")!;
const btnSort = document.getElementById("btn-sort") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const btnClear = document.getElementById("btn-clear") as HTMLButtonElement;
const btnSettings = document.getElementById(
  "btn-settings",
) as HTMLButtonElement;
const settingsMenu = document.getElementById("settings-menu")!;
const btnHamburger = document.getElementById("btn-hamburger")!;
const hamburgerPanel = document.getElementById("hamburger-panel")!;
const sortMenu = document.getElementById("sort-menu")!;
const toast = document.getElementById("toast")!;
const toastMsg = document.getElementById("toast-msg")!;
const lineCountEl = document.getElementById("line-count")!;
const iconSortArrays = document.getElementById("icon-sort-arrays")!;

const toggleTheme = document.getElementById(
  "theme-toggle",
) as HTMLButtonElement;
const toggleGlass = document.getElementById(
  "toggle-glass",
) as HTMLButtonElement;
const sortArraysToggle = document.getElementById(
  "sort-arrays-toggle",
) as HTMLButtonElement;

// ── CodeMirror editors ──
function createEditor(
  el: HTMLElement,
  readOnly: boolean,
  placeholder: string,
): CodeMirror.Editor {
  return CodeMirror(el, {
    mode: { name: "javascript", json: true },
    theme: "jsonabc",
    readOnly: readOnly ? "nocursor" : false,
    placeholder,
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: false,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: {
      "Ctrl-S": () => {},
      "Cmd-S": () => {},
    },
  });
}

const inputEditor = createEditor(
  document.getElementById("input-wrap")!,
  false,
  "Paste your JSON here…",
);

// Save snapshot when input content changes (paste, type, etc.)
let inputChangeTimer: ReturnType<typeof setTimeout> | null = null;
inputEditor.on("change", () => {
  if (inputChangeTimer) clearTimeout(inputChangeTimer);
  inputChangeTimer = setTimeout(() => {
    saveSnapshot(inputEditor.getValue());
  }, 800);
});
const outputEditor = createEditor(
  document.getElementById("output-wrap")!,
  true,
  "Sorted result will appear here…",
);

// ── Core logic ──

function stripTrailingCommas(raw: string): string {
  return raw.replace(/,\s*([}\]])/g, "$1");
}

function parseJson(raw: string): unknown {
  const cleaned = stripTrailingCommas(raw);
  return JSON.parse(cleaned);
}

function compareValues(a: unknown, b: unknown): number {
  if (a === null && b === null) return 0;
  if (a === null) return -1;
  if (b === null) return 1;

  const ta = typeof a;
  const tb = typeof b;

  if (ta === "boolean" && tb === "boolean") return a ? 1 : -1;
  if (ta === "number" && tb === "number") return (a as number) - (b as number);
  if (ta === "string" && tb === "string")
    return (a as string).localeCompare(b as string);
  if (ta === "object" && tb === "object")
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
  return ta.localeCompare(tb);
}

function sortValue(val: unknown, sortArrays: boolean): unknown {
  if (val === null || typeof val !== "object") return val;

  if (Array.isArray(val)) {
    let arr = val.map((v) => sortValue(v, sortArrays));
    if (sortArrays) arr = arr.sort((a, b) => compareValues(a, b));
    return arr;
  }

  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(val as Record<string, unknown>).sort((a, b) =>
    a.localeCompare(b),
  )) {
    sorted[k] = sortValue((val as Record<string, unknown>)[k], sortArrays);
  }
  return sorted;
}

function processJSON(sortArrays: boolean): void {
  const raw = inputEditor.getValue();
  if (!raw.trim()) {
    showToast("Paste some JSON to get started.", "info");
    outputEditor.setValue("");
    updateLineCount("");
    return;
  }
  try {
    const parsed = parseJson(raw);
    const sorted = sortValue(parsed, sortArrays);
    const pretty = JSON.stringify(sorted, null, 2);
    outputEditor.setValue(pretty);
    updateLineCount(pretty);
    showToast("✔ JSON sorted successfully!", "success");
  } catch (err) {
    showToast("✖ Error: " + (err as Error).message, "error");
    outputEditor.setValue("");
    updateLineCount("");
  }
}

function formatOnly() {
  const raw = inputEditor.getValue();
  if (!raw.trim()) {
    showToast("Paste some JSON to format.", "info");
    outputEditor.setValue("");
    updateLineCount("");
    return;
  }
  try {
    const parsed = parseJson(raw);
    const pretty = JSON.stringify(parsed, null, 2);
    outputEditor.setValue(pretty);
    updateLineCount(pretty);
    showToast("✔ JSON formatted!", "success");
  } catch (err) {
    showToast("✖ Error: " + (err as Error).message, "error");
    outputEditor.setValue("");
    updateLineCount("");
  }
}

function copyResult(): void {
  const val = outputEditor.getValue();
  if (!val) {
    showToast("Nothing to copy.", "info");
    return;
  }
  navigator.clipboard.writeText(val).then(
    () => showToast("📋 Copied!", "success"),
    () => {
      const ta = document.createElement("textarea");
      ta.value = val;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("📋 Copied!", "success");
    },
  );
}

function clearAll(): void {
  if (!inputEditor.getValue().trim() && !outputEditor.getValue().trim()) {
    showToast("Nothing to clear.", "info");
    return;
  }
  if (!confirm("Clear both editors? This cannot be undone.")) return;
  inputEditor.setValue("");
  outputEditor.setValue("");
  updateLineCount("");
  showToast("Cleared.", "info");
}

function updateLineCount(text: string): void {
  lineCountEl.textContent = text ? `${text.split("\n").length} linhas` : "";
}

// ── Toast ──
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string, type: "success" | "error" | "info"): void {
  toastMsg.textContent = msg;
  toast.className = "toast";
  toast.classList.add(type);
  toast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ── Liquid Toggle helpers ──
function syncLiquidToggle(el: HTMLElement, state: boolean): void {
  el.setAttribute("aria-checked", String(state));
  el.style.setProperty("--complete", state ? "100" : "0");
}

function animateLiquidToggle(el: HTMLElement, toState: boolean): void {
  (el as HTMLElement & { dataset: DOMStringMap }).dataset.active = "true";
  gsap.to(el, {
    "--complete": toState ? 100 : 0,
    duration: 0.14,
    delay: 0.18,
    ease: "power1.inOut",
    onComplete: () => {
      gsap.delayedCall(0.05, () => {
        delete (el as HTMLElement & { dataset: DOMStringMap }).dataset.active;
        el.setAttribute("aria-checked", String(toState));
      });
    },
  });
}

// ── Theme ──
let isDark = false;

function applyTheme(dark: boolean, animate = false, persist = true): void {
  isDark = dark;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  iconThemeSettings.innerHTML = dark ? SVG_SUN : SVG_MOON;
  if (animate) animateLiquidToggle(toggleTheme, dark);
  else syncLiquidToggle(toggleTheme, dark);
  if (persist) localStorage.setItem("jsonabc-theme", dark ? "dark" : "light");
  inputEditor.setOption("theme", "jsonabc");
  outputEditor.setOption("theme", "jsonabc");
}

toggleTheme.addEventListener("click", () => applyTheme(!isDark, true));

// ── Glass style ──
function applyGlassStyle(
  frosted: boolean,
  animate = false,
  persist = true,
): void {
  document.documentElement.dataset.glass = frosted ? "frosted" : "clear";
  if (animate) animateLiquidToggle(toggleGlass, frosted);
  else syncLiquidToggle(toggleGlass, frosted);
  if (persist)
    localStorage.setItem("jsonabc-glass", frosted ? "frosted" : "clear");
}

toggleGlass.addEventListener("click", () => {
  applyGlassStyle(document.documentElement.dataset.glass !== "frosted", true);
});

// ── Sort arrays toggle ──
let sortArraysEnabled = false;

sortArraysToggle.addEventListener("click", () => {
  sortArraysEnabled = !sortArraysEnabled;
  animateLiquidToggle(sortArraysToggle, sortArraysEnabled);
  iconSortArrays.innerHTML = sortArraysEnabled
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4M17 19V5"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4M17 19V5" opacity="0.3"/></svg>';
});

// ── Settings menu ──
function closeAllMenus(): void {
  settingsMenu.classList.remove("visible");
  settingsMenu.setAttribute("inert", "");
  hamburgerPanel.classList.remove("visible");
  hamburgerPanel.setAttribute("inert", "");
  if (btnHamburger) btnHamburger.setAttribute("aria-expanded", "false");
  sortMenu.classList.remove("visible");
  sortMenu.setAttribute("inert", "");
}

function toggleSettingsMenu(open: boolean): void {
  settingsMenu.classList.toggle("visible", open);
  if (open) settingsMenu.removeAttribute("inert");
  else settingsMenu.setAttribute("inert", "");
}

btnSettings.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleSettingsMenu(!settingsMenu.classList.contains("visible"));
});

// ── Sort menu ──
btnSort.addEventListener("click", (e) => {
  e.stopPropagation();
  closeAllMenus();
  sortMenu.classList.toggle("visible");
  sortMenu.toggleAttribute("inert");
});

document.getElementById("sort-menu-sort")!.addEventListener("click", () => {
  closeAllMenus();
  processJSON(sortArraysEnabled);
});

document.getElementById("sort-menu-format")!.addEventListener("click", () => {
  closeAllMenus();
  formatOnly();
});

// ── Hamburger menu ──
btnHamburger.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = !hamburgerPanel.classList.contains("visible");
  if (open) {
    closeAllMenus();
    hamburgerPanel.classList.add("visible");
    hamburgerPanel.removeAttribute("inert");
  } else {
    hamburgerPanel.classList.remove("visible");
    hamburgerPanel.setAttribute("inert", "");
  }
  btnHamburger.setAttribute("aria-expanded", String(open));
});

// Delegate clicks from hamburger items to actual dock buttons
hamburgerPanel
  .querySelectorAll<HTMLElement>("[data-delegates]")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.delegates!)!.click();
    });
  });

document.addEventListener("click", (e) => {
  const target = e.target as Node;
  const clickedMenu = settingsMenu.contains(target);
  const clickedBtn = (target as HTMLElement).closest("#btn-settings");
  const clickedHamburger = (target as HTMLElement).closest("#btn-hamburger");
  const clickedHamburgerPanel = hamburgerPanel.contains(target);
  const clickedSortBtn = (target as HTMLElement).closest("#btn-sort");
  const clickedSortMenu = sortMenu.contains(target);
  if (!clickedMenu && !clickedBtn) {
    settingsMenu.classList.remove("visible");
    settingsMenu.setAttribute("inert", "");
  }
  if (!clickedHamburger && !clickedHamburgerPanel) {
    hamburgerPanel.classList.remove("visible");
    hamburgerPanel.setAttribute("inert", "");
    if (btnHamburger) btnHamburger.setAttribute("aria-expanded", "false");
  }
  if (!clickedSortBtn && !clickedSortMenu) {
    sortMenu.classList.remove("visible");
    sortMenu.setAttribute("inert", "");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (historyModal && historyModal.classList.contains("visible")) {
      closeHistoryModal();
    } else if (helpModal && helpModal.classList.contains("visible")) {
      closeHelpModal();
    } else if (sortMenu && sortMenu.classList.contains("visible")) {
      sortMenu.classList.remove("visible");
      sortMenu.setAttribute("inert", "");
    } else if (hamburgerPanel && hamburgerPanel.classList.contains("visible")) {
      hamburgerPanel.classList.remove("visible");
      hamburgerPanel.setAttribute("inert", "");
      if (btnHamburger) btnHamburger.setAttribute("aria-expanded", "false");
    } else {
      settingsMenu.classList.remove("visible");
      settingsMenu.setAttribute("inert", "");
    }
  }
});

// ── Keyboard shortcuts ──
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    processJSON(sortArraysEnabled);
  }
});

// ── Bind events ──
btnCopy.addEventListener("click", copyResult);
btnClear.addEventListener("click", clearAll);

// ── History modal ──
const historyModal = document.getElementById("history-modal")!;
const historyModalBackdrop = document.getElementById("history-modal-backdrop")!;
const btnCloseHistory = document.getElementById("btn-close-history")!;
const historyList = document.getElementById("history-list")!;
const btnClearHistory = document.getElementById("btn-clear-history")!;
const btnHistory = document.getElementById("btn-history")!;

function renderHistoryList(): void {
  const history = getHistory();
  historyList.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No history yet. Paste some JSON and it will be saved here automatically.";
    historyList.appendChild(empty);
    return;
  }
  for (const item of history) {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `<div class="history-item-content">
        <span class="history-item-time">${formatHistoryDate(item.ts)}</span>
        <span class="history-item-preview">${item.preview.replace(/</g, "&lt;")}</span>
      </div>
      <button class="history-item-delete" aria-label="Delete" type="button">&times;</button>`;
    el.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".history-item-delete")) return;
      inputEditor.setValue(item.content);
      closeHistoryModal();
      inputEditor.focus();
      showToast("Version restored from history.", "success");
    });
    const delBtn = el.querySelector(".history-item-delete") as HTMLButtonElement;
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!confirm("Delete this history entry?")) return;
      deleteHistoryItem(item.id);
      renderHistoryList();
      showToast("Entry deleted.", "info");
    });
    historyList.appendChild(el);
  }
}

function openHistoryModal(): void {
  renderHistoryList();
  historyModal.classList.add("visible");
  historyModal.removeAttribute("inert");
  btnCloseHistory.focus();
}

function closeHistoryModal(): void {
  historyModal.classList.remove("visible");
  historyModal.setAttribute("inert", "");
}

// ── Help modal ──
const helpModal = document.getElementById("help-modal")!;
const helpModalBackdrop = document.getElementById("help-modal-backdrop")!;
const btnCloseHelp = document.getElementById("btn-close-help")!;
const helpBody = document.getElementById("help-body")!;
const btnHelp = document.getElementById("btn-help")!;

function buildHelpBody(): void {
  const section = (icon: string, title: string, body: string) =>
    `<div class="help-section">
      <div class="help-section-hd">
        <span class="help-section-icon">${icon}</span>
        <h3 class="help-section-title">${title}</h3>
      </div>
      <div class="help-section-body">${body}</div>
    </div>`;

  const iSort = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4M17 19V5"/></svg>`;
  const iCopy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const iSettings = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`;
  const iKeyboard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="6" y1="16" x2="18" y2="16"/></svg>`;
  const iHistory = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  helpBody.innerHTML = [
    section(
      iSort,
      "Sorting",
      `<ul class="help-list">
        <li><strong>Sort</strong> — recursively sorts all object keys alphabetically (A–Z) and array values numerically (0–1). Available from the <strong>Actions</strong> menu or via <kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd>.</li>
        <li><strong>Format</strong> — pretty-prints the JSON without reordering keys. Useful for quick formatting. Also in the <strong>Actions</strong> menu.</li>
        <li><strong>Sort arrays</strong> — when enabled (via Settings), array element values are also sorted. Primitives (strings, numbers, booleans) are sorted naturally; objects inside arrays are sorted by their stringified representation.</li>
        <li><strong>Trailing commas</strong> — the parser strips trailing commas before processing, so JSON with a dangling comma at any level is accepted.</li>
      </ul>`,
    ),
    section(
      iCopy,
      "Copying & Clearing",
      `<ul class="help-list">
        <li><strong>Copy</strong> — copies the output panel content to your clipboard. Falls back to <code>document.execCommand('copy')</code> if the Clipboard API is unavailable.</li>
        <li><strong>Clear</strong> — empties both editors (with confirmation dialog to prevent accidental data loss).</li>
      </ul>`,
    ),
    section(
      iSettings,
      "Settings",
      `<ul class="help-list">
        <li><strong>Sort arrays</strong> — toggles sorting of array element values on or off.</li>
        <li><strong>Dark mode</strong> — toggles between light and dark colour schemes. Follows the system preference by default.</li>
        <li><strong>Frosted glass</strong> — switches the dock and panel glass effect between clear (subtle) and frosted (strong blur + milky tint).</li>
        <li><strong>Help &amp; Wiki</strong> — accessed from the bottom of the Settings menu. Contains detailed guidance on all features.</li>
        <li><strong>Preferences saved</strong> — dark mode and glass style are persisted in <code>localStorage</code> and restored on your next visit.</li>
      </ul>`,
    ),
    section(
      iKeyboard,
      "Keyboard Shortcuts",
      `<ul class="help-list">
        <li><strong><kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd></strong> — sort the current JSON.</li>
        <li><strong><kbd>Escape</kbd></strong> — close the Actions menu, Settings, hamburger panel, history modal or help modal.</li>
        <li><strong>Click outside</strong> any menu or panel to close it.</li>
      </ul>`,
    ),
    section(
      iHistory,
      "Local History",
      `<ul class="help-list">
        <li><strong>Auto-save</strong> — every time you paste or edit the input, a snapshot is saved locally.</li>
        <li><strong>Restore</strong> — click the <strong>History</strong> button in the dock to open the modal, then click any version to restore it to the input editor.</li>
        <li><strong>Delete</strong> — each entry has a delete button to remove it individually (with confirmation). Use <strong>Clear all</strong> to wipe the entire history (also confirmed).</li>
        <li><strong>Persistent</strong> — history is stored in <code>localStorage</code> and survives page refreshes.</li>
      </ul>`,
    ),
  ].join("");
}

function openHelpModal(): void {
  buildHelpBody();
  helpModal.classList.add("visible");
  helpModal.removeAttribute("inert");
  btnCloseHelp.focus();
}

function closeHelpModal(): void {
  helpModal.classList.remove("visible");
  helpModal.setAttribute("inert", "");
}

btnHelp.addEventListener("click", () => {
  closeAllMenus();
  openHelpModal();
});

btnHistory.addEventListener("click", (e) => {
  e.stopPropagation();
  closeAllMenus();
  openHistoryModal();
});

historyModalBackdrop.addEventListener("click", closeHistoryModal);
btnCloseHistory.addEventListener("click", closeHistoryModal);
btnClearHistory.addEventListener("click", () => {
  const history = getHistory();
  if (!history.length) {
    showToast("No history to clear.", "info");
    return;
  }
  if (!confirm("Delete all history entries? This cannot be undone.")) return;
  clearHistory();
  renderHistoryList();
  showToast("History cleared.", "info");
});

helpModalBackdrop.addEventListener("click", closeHelpModal);
btnCloseHelp.addEventListener("click", closeHelpModal);

// ── Restore preferences ──
function restorePrefs(): void {
  const savedTheme = localStorage.getItem("jsonabc-theme");
  if (savedTheme) {
    isDark = savedTheme === "dark";
  } else {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  applyTheme(isDark, false, false);

  const savedGlass = localStorage.getItem("jsonabc-glass");
  applyGlassStyle(savedGlass === "frosted", false, false);

  syncLiquidToggle(sortArraysToggle, false);
}

// ── Init ──
restorePrefs();
showToast('Ready. Paste your JSON and click Sort.', "info");

setTimeout(() => {
  inputEditor.refresh();
  outputEditor.refresh();
}, 100);
