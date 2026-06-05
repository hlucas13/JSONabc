"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/glass-distortion.ts
  var require_glass_distortion = __commonJS({
    "src/glass-distortion.ts"() {
      "use strict";
      var GlassDistortion = {
        // Index of refraction of the glass (1.45 ≈ borosilicate / optical glass)
        IOR: 1.45,
        // Controls how steeply the convex surface rises from the outer edge.
        GLASS_THICKNESS: 0.72,
        // Bezel width relative to min(element_size) / 2.
        BEZEL_FRACTION: 0.38,
        _innerDist(px, py, cx, cy, hw, hh, r) {
          const qx = Math.abs(px - cx) - (hw - r);
          const qy = Math.abs(py - cy) - (hh - r);
          const outer = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - r;
          return -outer;
        },
        _neutralDataUrl() {
          const c = document.createElement("canvas");
          c.width = 2;
          c.height = 2;
          const ctx = c.getContext("2d");
          const id = ctx.createImageData(2, 2);
          for (let i = 0; i < 16; i += 4) {
            id.data[i] = id.data[i + 1] = id.data[i + 2] = 128;
            id.data[i + 3] = 255;
          }
          ctx.putImageData(id, 0, 0);
          return c.toDataURL("image/png");
        },
        build(width, height, borderRadius) {
          const W = Math.max(Math.ceil(width), 2);
          const H = Math.max(Math.ceil(height), 2);
          const R = Math.min(borderRadius, Math.min(W, H) / 2);
          const cx = W / 2;
          const cy = H / 2;
          const bezelW = Math.min(
            Math.min(W, H) * this.BEZEL_FRACTION * 0.5,
            R * 0.85
          );
          const canvas = document.createElement("canvas");
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext("2d", { willReadFrequently: false });
          const imgData = ctx.createImageData(W, H);
          const d = imgData.data;
          const mags = new Float32Array(W * H);
          const dxArr = new Float32Array(W * H);
          const dyArr = new Float32Array(W * H);
          let maxMag = 0;
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              const px = x + 0.5;
              const py = y + 0.5;
              const dist = this._innerDist(px, py, cx, cy, W / 2, H / 2, R);
              const i = y * W + x;
              if (dist <= 0 || dist >= bezelW) continue;
              const t = dist / bezelW;
              const slope = this.GLASS_THICKNESS * 0.5 / Math.sqrt(t + 1e-3);
              const sinT1 = slope / Math.sqrt(1 + slope * slope);
              const cosT1 = Math.sqrt(Math.max(0, 1 - sinT1 * sinT1));
              const sinT2 = sinT1 / this.IOR;
              const cosT2 = Math.sqrt(Math.max(0, 1 - sinT2 * sinT2));
              const tanT1 = sinT1 / (cosT1 + 1e-9);
              const tanT2 = sinT2 / (cosT2 + 1e-9);
              const mag = Math.abs(tanT1 - tanT2) * bezelW;
              mags[i] = mag;
              if (mag > maxMag) maxMag = mag;
              const nx = cx - px;
              const ny = cy - py;
              const len = Math.sqrt(nx * nx + ny * ny) + 1e-9;
              dxArr[i] = nx / len;
              dyArr[i] = ny / len;
            }
          }
          if (maxMag < 1e-3) maxMag = 1;
          for (let i = 0; i < W * H; i++) {
            const idx = i * 4;
            const mag = mags[i];
            if (mag > 0) {
              const n = mag / maxMag;
              d[idx] = Math.min(255, Math.max(0, 128 + dxArr[i] * n * 127 + 0.5 | 0));
              d[idx + 1] = Math.min(255, Math.max(0, 128 + dyArr[i] * n * 127 + 0.5 | 0));
            } else {
              d[idx] = 128;
              d[idx + 1] = 128;
            }
            d[idx + 2] = 128;
            d[idx + 3] = 255;
          }
          ctx.putImageData(imgData, 0, 0);
          return {
            dataUrl: canvas.toDataURL("image/png"),
            scale: maxMag,
            width: W,
            height: H
          };
        },
        _applyToDock(w, h) {
          const filter = document.getElementById("glass-distortion-dock");
          if (!filter) return;
          const feImg = filter.querySelector("feImage");
          const feDisp = filter.querySelector("feDisplacementMap");
          if (!feImg || !feDisp) return;
          const r = h / 2;
          const { dataUrl, scale } = this.build(w, h, r);
          feImg.setAttribute("href", dataUrl);
          feImg.setAttribute("width", String(Math.ceil(w)));
          feImg.setAttribute("height", String(Math.ceil(h)));
          feDisp.setAttribute("scale", scale.toFixed(2));
        },
        _applyToPanel() {
          const filter = document.getElementById("glass-distortion-panel");
          if (!filter) return;
          const feImg = filter.querySelector("feImage");
          const feDisp = filter.querySelector("feDisplacementMap");
          if (!feImg || !feDisp) return;
          const { dataUrl, scale, width } = this.build(580, 500, 20);
          feImg.setAttribute("href", dataUrl);
          feDisp.setAttribute("scale", (scale / width).toFixed(4));
        },
        initDock() {
          const dock = document.querySelector(".glass-dock");
          if (!dock) return;
          const neutral = this._neutralDataUrl();
          const dockFilter = document.getElementById("glass-distortion-dock");
          if (dockFilter) {
            const fi = dockFilter.querySelector("feImage");
            const fd = dockFilter.querySelector("feDisplacementMap");
            if (fi) fi.setAttribute("href", neutral);
            if (fd) fd.setAttribute("scale", "0");
          }
          const refresh = (w, h) => {
            this._applyToDock(w, h);
          };
          const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width > 4 && height > 4) refresh(width, height);
          });
          ro.observe(dock);
          const rect = dock.getBoundingClientRect();
          if (rect.width > 4 && rect.height > 4) refresh(rect.width, rect.height);
        },
        initPanel() {
          const neutral = this._neutralDataUrl();
          const panelFilter = document.getElementById("glass-distortion-panel");
          if (panelFilter) {
            const fi = panelFilter.querySelector("feImage");
            const fd = panelFilter.querySelector("feDisplacementMap");
            if (fi) fi.setAttribute("href", neutral);
            if (fd) fd.setAttribute("scale", "0");
          }
          this._applyToPanel();
        }
      };
      GlassDistortion.initDock();
      GlassDistortion.initPanel();
    }
  });

  // src/history-store.ts
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function saveSnapshot(content) {
    if (!content.trim()) return;
    const history = getHistory();
    if (history.length > 0 && history[0].content === content) return;
    const now = Date.now();
    history.unshift({
      id: now,
      ts: now,
      preview: content.replace(/\s+/g, " ").slice(0, 80).trim(),
      content
    });
    if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
  function deleteHistoryItem(id) {
    const history = getHistory().filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
  function formatHistoryDate(ts) {
    const d = new Date(ts);
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 6e4);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString(void 0, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }
  var HISTORY_KEY, HISTORY_MAX;
  var init_history_store = __esm({
    "src/history-store.ts"() {
      "use strict";
      HISTORY_KEY = "jsonabc-history";
      HISTORY_MAX = 25;
    }
  });

  // src/json-utils.ts
  function stripTrailingCommas(raw) {
    return raw.replace(/,\s*([}\]])/g, "$1");
  }
  function parseJson(raw) {
    const cleaned = stripTrailingCommas(raw);
    return JSON.parse(cleaned);
  }
  function compareValues(a, b) {
    if (a === null && b === null) return 0;
    if (a === null) return -1;
    if (b === null) return 1;
    const ta = typeof a;
    const tb = typeof b;
    if (ta === "boolean" && tb === "boolean") {
      if (a === b) return 0;
      return a ? 1 : -1;
    }
    if (ta === "number" && tb === "number")
      return a - b;
    if (ta === "string" && tb === "string")
      return a.localeCompare(b);
    if (ta === "object" && tb === "object") {
      const aIsArray = Array.isArray(a);
      const bIsArray = Array.isArray(b);
      if (aIsArray !== bIsArray) return aIsArray ? -1 : 1;
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    }
    return ta.localeCompare(tb);
  }
  function sortValue(val, sortArrays) {
    if (val === null || typeof val !== "object") return val;
    if (Array.isArray(val)) {
      const arr = val.map((v) => sortValue(v, sortArrays));
      if (sortArrays) {
        return [...arr].sort((a, b) => compareValues(a, b));
      }
      return arr;
    }
    const sorted = {};
    const keys = Object.keys(val).sort(
      (a, b) => a.localeCompare(b)
    );
    for (const k of keys) {
      sorted[k] = sortValue(val[k], sortArrays);
    }
    return sorted;
  }
  function formatJson(value) {
    return JSON.stringify(value, null, 2);
  }
  function processJson(raw, sortArrays) {
    if (!raw.trim()) {
      return { result: "", error: "Empty input" };
    }
    try {
      const parsed = parseJson(raw);
      const sorted = sortValue(parsed, sortArrays);
      return { result: formatJson(sorted) };
    } catch (err) {
      return {
        result: "",
        error: err.message
      };
    }
  }
  function formatOnly(raw) {
    if (!raw.trim()) {
      return { result: "", error: "Empty input" };
    }
    try {
      const parsed = parseJson(raw);
      return { result: formatJson(parsed) };
    } catch (err) {
      return {
        result: "",
        error: err.message
      };
    }
  }
  function countLines(text) {
    if (!text) return 0;
    return text.split("\n").length;
  }
  var init_json_utils = __esm({
    "src/json-utils.ts"() {
      "use strict";
    }
  });

  // src/ui/editor.ts
  function createEditor(el, readOnly, placeholder) {
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
        "Ctrl-S": () => {
        },
        "Cmd-S": () => {
        }
      }
    });
  }
  var init_editor = __esm({
    "src/ui/editor.ts"() {
      "use strict";
    }
  });

  // src/ui/liquid-toggle.ts
  function syncLiquidToggle(el, state) {
    el.setAttribute("aria-checked", String(state));
    el.style.setProperty("--complete", state ? "100" : "0");
  }
  function animateLiquidToggle(el, toState) {
    el.dataset.active = "true";
    gsap.to(el, {
      "--complete": toState ? 100 : 0,
      duration: 0.14,
      delay: 0.18,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.delayedCall(0.05, () => {
          delete el.dataset.active;
          el.setAttribute("aria-checked", String(toState));
        });
      }
    });
  }
  var init_liquid_toggle = __esm({
    "src/ui/liquid-toggle.ts"() {
      "use strict";
    }
  });

  // src/ui/menu.ts
  function initMenus(settingsMenu, sortMenu, hamburgerPanel, btnHamburger) {
    return { settingsMenu, sortMenu, hamburgerPanel, btnHamburger };
  }
  function closeAllMenus({
    settingsMenu,
    sortMenu,
    hamburgerPanel,
    btnHamburger
  }) {
    settingsMenu.classList.remove("visible");
    settingsMenu.setAttribute("inert", "");
    hamburgerPanel.classList.remove("visible");
    hamburgerPanel.setAttribute("inert", "");
    btnHamburger?.setAttribute("aria-expanded", "false");
    sortMenu.classList.remove("visible");
    sortMenu.setAttribute("inert", "");
  }
  function toggleSettingsMenu(elements, open) {
    elements.settingsMenu.classList.toggle("visible", open);
    if (open) {
      elements.settingsMenu.removeAttribute("inert");
    } else {
      elements.settingsMenu.setAttribute("inert", "");
    }
  }
  var init_menu = __esm({
    "src/ui/menu.ts"() {
      "use strict";
    }
  });

  // src/ui/modals.ts
  function initModals(historyModal, historyModalBackdrop, historyList, btnCloseHistory, btnClearHistory, helpModal, helpModalBackdrop, helpBody, btnCloseHelp, inputEditor, showToast2) {
    return {
      historyModal,
      historyModalBackdrop,
      historyList,
      btnCloseHistory,
      btnClearHistory,
      helpModal,
      helpModalBackdrop,
      helpBody,
      btnCloseHelp,
      inputEditor,
      showToast: showToast2
    };
  }
  function renderHistoryList(elements) {
    const history = getHistory();
    elements.historyList.innerHTML = "";
    if (!history.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = "No history yet. Paste some JSON and it will be saved here automatically.";
      elements.historyList.appendChild(empty);
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
        if (e.target.closest(".history-item-delete"))
          return;
        elements.inputEditor.setValue(item.content);
        closeHistoryModal(elements);
        elements.inputEditor.focus();
        elements.showToast("Version restored from history.", "success");
      });
      const delBtn = el.querySelector(
        ".history-item-delete"
      );
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!confirm("Delete this history entry?")) return;
        deleteHistoryItem(item.id);
        renderHistoryList(elements);
        elements.showToast("Entry deleted.", "info");
      });
      elements.historyList.appendChild(el);
    }
  }
  function openHistoryModal(elements) {
    renderHistoryList(elements);
    elements.historyModal.classList.add("visible");
    elements.historyModal.removeAttribute("inert");
    elements.btnCloseHistory.focus();
  }
  function closeHistoryModal(elements) {
    elements.historyModal.classList.remove("visible");
    elements.historyModal.setAttribute("inert", "");
  }
  function openHelpModal(elements) {
    buildHelpBody(elements.helpBody);
    elements.helpModal.classList.add("visible");
    elements.helpModal.removeAttribute("inert");
    elements.btnCloseHelp.focus();
  }
  function closeHelpModal(elements) {
    elements.helpModal.classList.remove("visible");
    elements.helpModal.setAttribute("inert", "");
  }
  function clearAllHistory(elements) {
    const history = getHistory();
    if (!history.length) {
      elements.showToast("No history to clear.", "info");
      return;
    }
    if (!confirm("Delete all history entries? This cannot be undone.")) return;
    clearHistory();
    renderHistoryList(elements);
    elements.showToast("History cleared.", "info");
  }
  function buildHelpBody(helpBody) {
    const section = (icon, title, body) => `<div class="help-section">
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
        <li><strong>Sort</strong> \u2014 recursively sorts all object keys alphabetically (A\u2013Z) and array values numerically (0\u20131). Available from the <strong>Actions</strong> menu or via <kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd>.</li>
        <li><strong>Format</strong> \u2014 pretty-prints the JSON without reordering keys. Useful for quick formatting. Also in the <strong>Actions</strong> menu.</li>
        <li><strong>Sort arrays</strong> \u2014 when enabled (via Settings), array element values are also sorted. Primitives (strings, numbers, booleans) are sorted naturally; objects inside arrays are sorted by their stringified representation.</li>
        <li><strong>Trailing commas</strong> \u2014 the parser strips trailing commas before processing, so JSON with a dangling comma at any level is accepted.</li>
      </ul>`
      ),
      section(
        iCopy,
        "Copying & Clearing",
        `<ul class="help-list">
        <li><strong>Copy</strong> \u2014 copies the output panel content to your clipboard. Falls back to <code>document.execCommand('copy')</code> if the Clipboard API is unavailable.</li>
        <li><strong>Clear</strong> \u2014 empties both editors (with confirmation dialog to prevent accidental data loss).</li>
      </ul>`
      ),
      section(
        iSettings,
        "Settings",
        `<ul class="help-list">
        <li><strong>Sort arrays</strong> \u2014 toggles sorting of array element values on or off.</li>
        <li><strong>Dark mode</strong> \u2014 toggles between light and dark colour schemes. Follows the system preference by default.</li>
        <li><strong>Frosted glass</strong> \u2014 switches the dock and panel glass effect between clear (subtle) and frosted (strong blur + milky tint).</li>
        <li><strong>Help &amp; Wiki</strong> \u2014 accessed from the bottom of the Settings menu. Contains detailed guidance on all features.</li>
        <li><strong>Preferences saved</strong> \u2014 dark mode and glass style are persisted in <code>localStorage</code> and restored on your next visit.</li>
      </ul>`
      ),
      section(
        iKeyboard,
        "Keyboard Shortcuts",
        `<ul class="help-list">
        <li><strong><kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd></strong> \u2014 sort the current JSON.</li>
        <li><strong><kbd>Escape</kbd></strong> \u2014 close the Actions menu, Settings, hamburger panel, history modal or help modal.</li>
        <li><strong>Click outside</strong> any menu or panel to close it.</li>
      </ul>`
      ),
      section(
        iHistory,
        "Local History",
        `<ul class="help-list">
        <li><strong>Auto-save</strong> \u2014 every time you paste or edit the input, a snapshot is saved locally.</li>
        <li><strong>Restore</strong> \u2014 click the <strong>History</strong> button in the dock to open the modal, then click any version to restore it to the input editor.</li>
        <li><strong>Delete</strong> \u2014 each entry has a delete button to remove it individually (with confirmation). Use <strong>Clear all</strong> to wipe the entire history (also confirmed).</li>
        <li><strong>Persistent</strong> \u2014 history is stored in <code>localStorage</code> and survives page refreshes.</li>
      </ul>`
      )
    ].join("");
  }
  var init_modals = __esm({
    "src/ui/modals.ts"() {
      "use strict";
      init_history_store();
    }
  });

  // src/ui/theme.ts
  function initTheme(iconThemeSettings, toggleTheme, toggleGlass, inputEditor, outputEditor) {
    return { iconThemeSettings, toggleTheme, toggleGlass, inputEditor, outputEditor };
  }
  function applyTheme(elements, dark, animate = false, persist = true) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    elements.iconThemeSettings.innerHTML = dark ? SVG_SUN : SVG_MOON;
    if (animate) {
      animateLiquidToggle(elements.toggleTheme, dark);
    } else {
      syncLiquidToggle(elements.toggleTheme, dark);
    }
    if (persist) {
      localStorage.setItem("jsonabc-theme", dark ? "dark" : "light");
    }
    elements.inputEditor.setOption("theme", "jsonabc");
    elements.outputEditor.setOption("theme", "jsonabc");
  }
  function applyGlassStyle(elements, frosted, animate = false, persist = true) {
    document.documentElement.dataset.glass = frosted ? "frosted" : "clear";
    if (animate) {
      animateLiquidToggle(elements.toggleGlass, frosted);
    } else {
      syncLiquidToggle(elements.toggleGlass, frosted);
    }
    if (persist) {
      localStorage.setItem("jsonabc-glass", frosted ? "frosted" : "clear");
    }
  }
  function detectSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var SVG_MOON_ATTRS, SVG_MOON, SVG_SUN;
  var init_theme = __esm({
    "src/ui/theme.ts"() {
      "use strict";
      init_liquid_toggle();
      SVG_MOON_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
      SVG_MOON = `<svg ${SVG_MOON_ATTRS}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      SVG_SUN = `<svg ${SVG_MOON_ATTRS}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    }
  });

  // src/ui/toast.ts
  function initToast(toast, toastMsg) {
    return { toast, toastMsg };
  }
  function showToast(elements, msg, type) {
    elements.toastMsg.textContent = msg;
    elements.toast.className = "toast";
    elements.toast.classList.add(type);
    elements.toast.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => elements.toast.classList.add("hidden"),
      3e3
    );
  }
  var toastTimer;
  var init_toast = __esm({
    "src/ui/toast.ts"() {
      "use strict";
      toastTimer = null;
    }
  });

  // src/main.ts
  var require_main = __commonJS({
    "src/main.ts"() {
      var import_glass_distortion = __toESM(require_glass_distortion());
      init_history_store();
      init_json_utils();
      init_editor();
      init_liquid_toggle();
      init_menu();
      init_modals();
      init_theme();
      init_toast();
      var iconThemeSettings = document.getElementById("icon-theme-settings");
      var btnSort = document.getElementById("btn-sort");
      var btnCopy = document.getElementById("btn-copy");
      var btnClear = document.getElementById("btn-clear");
      var btnSettings = document.getElementById(
        "btn-settings"
      );
      var settingsMenu = document.getElementById("settings-menu");
      var btnHamburger = document.getElementById("btn-hamburger");
      var hamburgerPanel = document.getElementById("hamburger-panel");
      var sortMenu = document.getElementById("sort-menu");
      var toast = document.getElementById("toast");
      var toastMsg = document.getElementById("toast-msg");
      var lineCountEl = document.getElementById("line-count");
      var iconSortArrays = document.getElementById("icon-sort-arrays");
      var toggleTheme = document.getElementById(
        "theme-toggle"
      );
      var toggleGlass = document.getElementById(
        "toggle-glass"
      );
      var sortArraysToggle = document.getElementById(
        "sort-arrays-toggle"
      );
      var toastEls = initToast(toast, toastMsg);
      var show = (msg, type) => showToast(toastEls, msg, type);
      var inputEditor = createEditor(
        document.getElementById("input-wrap"),
        false,
        "Paste your JSON here\u2026"
      );
      var outputEditor = createEditor(
        document.getElementById("output-wrap"),
        true,
        "Sorted result will appear here\u2026"
      );
      var menuEls = initMenus(settingsMenu, sortMenu, hamburgerPanel, btnHamburger);
      var modalEls = initModals(
        document.getElementById("history-modal"),
        document.getElementById("history-modal-backdrop"),
        document.getElementById("history-list"),
        document.getElementById("btn-close-history"),
        document.getElementById("btn-clear-history"),
        document.getElementById("help-modal"),
        document.getElementById("help-modal-backdrop"),
        document.getElementById("help-body"),
        document.getElementById("btn-close-help"),
        inputEditor,
        show
      );
      var themeEls = initTheme(
        iconThemeSettings,
        toggleTheme,
        toggleGlass,
        inputEditor,
        outputEditor
      );
      var isDark = false;
      var sortArraysEnabled = false;
      var inputChangeTimer = null;
      inputEditor.on("change", () => {
        if (inputChangeTimer) clearTimeout(inputChangeTimer);
        inputChangeTimer = setTimeout(() => {
          saveSnapshot(inputEditor.getValue());
        }, 800);
      });
      function handleProcessJSON() {
        const raw = inputEditor.getValue();
        const { result, error } = processJson(raw, sortArraysEnabled);
        if (error === "Empty input") {
          show("Paste some JSON to get started.", "info");
          outputEditor.setValue("");
          lineCountEl.textContent = "";
          return;
        }
        if (error) {
          show("\u2716 Error: " + error, "error");
          outputEditor.setValue("");
          lineCountEl.textContent = "";
          return;
        }
        outputEditor.setValue(result);
        lineCountEl.textContent = `${countLines(result)} lines`;
        show("\u2714 JSON sorted successfully!", "success");
      }
      function handleFormatOnly() {
        const raw = inputEditor.getValue();
        const { result, error } = formatOnly(raw);
        if (error === "Empty input") {
          show("Paste some JSON to format.", "info");
          outputEditor.setValue("");
          lineCountEl.textContent = "";
          return;
        }
        if (error) {
          show("\u2716 Error: " + error, "error");
          outputEditor.setValue("");
          lineCountEl.textContent = "";
          return;
        }
        outputEditor.setValue(result);
        lineCountEl.textContent = `${countLines(result)} lines`;
        show("\u2714 JSON formatted!", "success");
      }
      function copyResult() {
        const val = outputEditor.getValue();
        if (!val) {
          show("Nothing to copy.", "info");
          return;
        }
        navigator.clipboard.writeText(val).then(
          () => show("\u{1F4CB} Copied!", "success"),
          () => {
            const ta = document.createElement("textarea");
            ta.value = val;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            show("\u{1F4CB} Copied!", "success");
          }
        );
      }
      function clearAll() {
        if (!inputEditor.getValue().trim() && !outputEditor.getValue().trim()) {
          show("Nothing to clear.", "info");
          return;
        }
        if (!confirm("Clear both editors? This cannot be undone.")) return;
        inputEditor.setValue("");
        outputEditor.setValue("");
        lineCountEl.textContent = "";
        show("Cleared.", "info");
      }
      toggleTheme.addEventListener("click", () => {
        isDark = !isDark;
        applyTheme(themeEls, isDark, true);
      });
      toggleGlass.addEventListener("click", () => {
        applyGlassStyle(
          themeEls,
          document.documentElement.dataset.glass !== "frosted",
          true
        );
      });
      sortArraysToggle.addEventListener("click", () => {
        sortArraysEnabled = !sortArraysEnabled;
        animateLiquidToggle(sortArraysToggle, sortArraysEnabled);
        iconSortArrays.innerHTML = sortArraysEnabled ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4M17 19V5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l4-4 4 4M7 5v14"/><path d="M21 15l-4 4-4-4M17 19V5" opacity="0.3"/></svg>';
      });
      btnSettings.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSettingsMenu(menuEls, !settingsMenu.classList.contains("visible"));
      });
      btnSort.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllMenus(menuEls);
        sortMenu.classList.toggle("visible");
        sortMenu.toggleAttribute("inert");
      });
      document.getElementById("sort-menu-sort").addEventListener("click", () => {
        closeAllMenus(menuEls);
        handleProcessJSON();
      });
      document.getElementById("sort-menu-format").addEventListener("click", () => {
        closeAllMenus(menuEls);
        handleFormatOnly();
      });
      btnHamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = !hamburgerPanel.classList.contains("visible");
        if (isOpen) {
          closeAllMenus(menuEls);
          hamburgerPanel.classList.add("visible");
          hamburgerPanel.removeAttribute("inert");
        } else {
          hamburgerPanel.classList.remove("visible");
          hamburgerPanel.setAttribute("inert", "");
        }
        btnHamburger.setAttribute("aria-expanded", String(isOpen));
      });
      hamburgerPanel.querySelectorAll("[data-delegates]").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById(btn.dataset.delegates).click();
        });
      });
      document.addEventListener("click", (e) => {
        const target = e.target;
        const clickedMenu = settingsMenu.contains(target);
        const clickedBtn = target.closest("#btn-settings");
        const clickedHamburger = target.closest("#btn-hamburger");
        const clickedHamburgerPanel = hamburgerPanel.contains(target);
        const clickedSortBtn = target.closest("#btn-sort");
        const clickedSortMenu = sortMenu.contains(target);
        if (!clickedMenu && !clickedBtn) {
          settingsMenu.classList.remove("visible");
          settingsMenu.setAttribute("inert", "");
        }
        if (!clickedHamburger && !clickedHamburgerPanel) {
          hamburgerPanel.classList.remove("visible");
          hamburgerPanel.setAttribute("inert", "");
          btnHamburger.setAttribute("aria-expanded", "false");
        }
        if (!clickedSortBtn && !clickedSortMenu) {
          sortMenu.classList.remove("visible");
          sortMenu.setAttribute("inert", "");
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (modalEls.historyModal.classList.contains("visible")) {
            closeHistoryModal(modalEls);
          } else if (modalEls.helpModal.classList.contains("visible")) {
            closeHelpModal(modalEls);
          } else if (sortMenu.classList.contains("visible")) {
            sortMenu.classList.remove("visible");
            sortMenu.setAttribute("inert", "");
          } else if (hamburgerPanel.classList.contains("visible")) {
            hamburgerPanel.classList.remove("visible");
            hamburgerPanel.setAttribute("inert", "");
            btnHamburger.setAttribute("aria-expanded", "false");
          } else {
            settingsMenu.classList.remove("visible");
            settingsMenu.setAttribute("inert", "");
          }
        }
      });
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          handleProcessJSON();
        }
      });
      btnCopy.addEventListener("click", copyResult);
      btnClear.addEventListener("click", clearAll);
      var btnHistory = document.getElementById("btn-history");
      btnHistory.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllMenus(menuEls);
        openHistoryModal(modalEls);
      });
      modalEls.historyModalBackdrop.addEventListener(
        "click",
        () => closeHistoryModal(modalEls)
      );
      modalEls.btnCloseHistory.addEventListener(
        "click",
        () => closeHistoryModal(modalEls)
      );
      modalEls.btnClearHistory.addEventListener(
        "click",
        () => clearAllHistory(modalEls)
      );
      var btnHelp = document.getElementById("btn-help");
      btnHelp.addEventListener("click", () => {
        closeAllMenus(menuEls);
        openHelpModal(modalEls);
      });
      modalEls.helpModalBackdrop.addEventListener(
        "click",
        () => closeHelpModal(modalEls)
      );
      modalEls.btnCloseHelp.addEventListener("click", () => closeHelpModal(modalEls));
      function restorePrefs() {
        const savedTheme = localStorage.getItem("jsonabc-theme");
        isDark = savedTheme ? savedTheme === "dark" : detectSystemTheme();
        applyTheme(themeEls, isDark, false, false);
        const savedGlass = localStorage.getItem("jsonabc-glass");
        applyGlassStyle(themeEls, savedGlass === "frosted", false, false);
        syncLiquidToggle(sortArraysToggle, false);
      }
      restorePrefs();
      show("Ready. Paste your JSON and click Sort.", "info");
      setTimeout(() => {
        inputEditor.refresh();
        outputEditor.refresh();
      }, 100);
    }
  });
  require_main();
})();
