// ── Local history — storage helpers ──

const HISTORY_KEY = 'jsonabc-history';
const HISTORY_MAX = 25;

export function getHistory(): { id: number; ts: number; preview: string; content: string }[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSnapshot(content: string): void {
  if (!content.trim()) return;
  const history = getHistory();
  if (history.length > 0 && history[0].content === content) return;
  const now = Date.now();
  history.unshift({
    id: now,
    ts: now,
    preview: content.replace(/\s+/g, ' ').slice(0, 80).trim(),
    content,
  });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function deleteHistoryItem(id: number): void {
  const history = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function formatHistoryDate(ts: number): string {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
