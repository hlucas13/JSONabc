// ── Toast notification system ──

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export interface ToastElements {
  toast: HTMLElement;
  toastMsg: HTMLElement;
}

export type ToastType = 'success' | 'error' | 'info';

export function initToast(toast: HTMLElement, toastMsg: HTMLElement): ToastElements {
  return { toast, toastMsg };
}

export function showToast(elements: ToastElements, msg: string, type: ToastType): void {
  elements.toastMsg.textContent = msg;
  elements.toast.className = 'toast';
  elements.toast.classList.add(type);
  elements.toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.add('hidden'), 3000);
}
