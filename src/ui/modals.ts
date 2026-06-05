// ── Modal management (history, help) ──

import {
    clearHistory,
    deleteHistoryItem,
    formatHistoryDate,
    getHistory,
} from '../history-store';

interface ModalElements {
    historyModal: HTMLElement;
    historyModalBackdrop: HTMLElement;
    historyList: HTMLElement;
    btnCloseHistory: HTMLElement;
    btnClearHistory: HTMLElement;
    helpModal: HTMLElement;
    helpModalBackdrop: HTMLElement;
    helpBody: HTMLElement;
    btnCloseHelp: HTMLElement;
    inputEditor: CodeMirror.Editor;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function initModals(
    historyModal: HTMLElement,
    historyModalBackdrop: HTMLElement,
    historyList: HTMLElement,
    btnCloseHistory: HTMLElement,
    btnClearHistory: HTMLElement,
    helpModal: HTMLElement,
    helpModalBackdrop: HTMLElement,
    helpBody: HTMLElement,
    btnCloseHelp: HTMLElement,
    inputEditor: CodeMirror.Editor,
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void
): ModalElements {
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
        showToast,
    };
}

function renderHistoryList(elements: ModalElements): void {
    const history = getHistory();
    elements.historyList.innerHTML = '';

    if (!history.length) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.textContent =
            'No history yet. Paste some JSON and it will be saved here automatically.';
        elements.historyList.appendChild(empty);
        return;
    }

    for (const item of history) {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `<div class="history-item-content">
        <span class="history-item-time">${formatHistoryDate(item.ts)}</span>
        <span class="history-item-preview">${item.preview.replace(/</g, '&lt;')}</span>
      </div>
      <button class="history-item-delete" aria-label="Delete" type="button">&times;</button>`;

        el.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('.history-item-delete'))
                return;
            elements.inputEditor.setValue(item.content);
            closeHistoryModal(elements);
            elements.inputEditor.focus();
            elements.showToast('Version restored from history.', 'success');
        });

        const delBtn = el.querySelector(
            '.history-item-delete'
        ) as HTMLButtonElement;
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!confirm('Delete this history entry?')) return;
            deleteHistoryItem(item.id);
            renderHistoryList(elements);
            elements.showToast('Entry deleted.', 'info');
        });

        elements.historyList.appendChild(el);
    }
}

export function openHistoryModal(elements: ModalElements): void {
    renderHistoryList(elements);
    elements.historyModal.classList.add('visible');
    elements.historyModal.removeAttribute('inert');
    elements.btnCloseHistory.focus();
}

export function closeHistoryModal(elements: ModalElements): void {
    elements.historyModal.classList.remove('visible');
    elements.historyModal.setAttribute('inert', '');
}

export function openHelpModal(elements: ModalElements): void {
    buildHelpBody(elements.helpBody);
    elements.helpModal.classList.add('visible');
    elements.helpModal.removeAttribute('inert');
    elements.btnCloseHelp.focus();
}

export function closeHelpModal(elements: ModalElements): void {
    elements.helpModal.classList.remove('visible');
    elements.helpModal.setAttribute('inert', '');
}

export function clearAllHistory(elements: ModalElements): void {
    const history = getHistory();
    if (!history.length) {
        elements.showToast('No history to clear.', 'info');
        return;
    }
    if (!confirm('Delete all history entries? This cannot be undone.')) return;
    clearHistory();
    renderHistoryList(elements);
    elements.showToast('History cleared.', 'info');
}

function buildHelpBody(helpBody: HTMLElement): void {
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
            'Sorting',
            `<ul class="help-list">
        <li><strong>Sort</strong> — recursively sorts all object keys alphabetically (A–Z) and array values numerically (0–1). Available from the <strong>Actions</strong> menu or via <kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd>.</li>
        <li><strong>Format</strong> — pretty-prints the JSON without reordering keys. Useful for quick formatting. Also in the <strong>Actions</strong> menu.</li>
        <li><strong>Sort arrays</strong> — when enabled (via Settings), array element values are also sorted. Primitives (strings, numbers, booleans) are sorted naturally; objects inside arrays are sorted by their stringified representation.</li>
        <li><strong>Trailing commas</strong> — the parser strips trailing commas before processing, so JSON with a dangling comma at any level is accepted.</li>
      </ul>`
        ),
        section(
            iCopy,
            'Copying & Clearing',
            `<ul class="help-list">
        <li><strong>Copy</strong> — copies the output panel content to your clipboard. Falls back to <code>document.execCommand('copy')</code> if the Clipboard API is unavailable.</li>
        <li><strong>Clear</strong> — empties both editors (with confirmation dialog to prevent accidental data loss).</li>
      </ul>`
        ),
        section(
            iSettings,
            'Settings',
            `<ul class="help-list">
        <li><strong>Sort arrays</strong> — toggles sorting of array element values on or off.</li>
        <li><strong>Dark mode</strong> — toggles between light and dark colour schemes. Follows the system preference by default.</li>
        <li><strong>Frosted glass</strong> — switches the dock and panel glass effect between clear (subtle) and frosted (strong blur + milky tint).</li>
        <li><strong>Help &amp; Wiki</strong> — accessed from the bottom of the Settings menu. Contains detailed guidance on all features.</li>
        <li><strong>Preferences saved</strong> — dark mode and glass style are persisted in <code>localStorage</code> and restored on your next visit.</li>
      </ul>`
        ),
        section(
            iKeyboard,
            'Keyboard Shortcuts',
            `<ul class="help-list">
        <li><strong><kbd>Ctrl+Enter</kbd> / <kbd>Cmd+Enter</kbd></strong> — sort the current JSON.</li>
        <li><strong><kbd>Escape</kbd></strong> — close the Actions menu, Settings, hamburger panel, history modal or help modal.</li>
        <li><strong>Click outside</strong> any menu or panel to close it.</li>
      </ul>`
        ),
        section(
            iHistory,
            'Local History',
            `<ul class="help-list">
        <li><strong>Auto-save</strong> — every time you paste or edit the input, a snapshot is saved locally.</li>
        <li><strong>Restore</strong> — click the <strong>History</strong> button in the dock to open the modal, then click any version to restore it to the input editor.</li>
        <li><strong>Delete</strong> — each entry has a delete button to remove it individually (with confirmation). Use <strong>Clear all</strong> to wipe the entire history (also confirmed).</li>
        <li><strong>Persistent</strong> — history is stored in <code>localStorage</code> and survives page refreshes.</li>
      </ul>`
        ),
    ].join('');
}
