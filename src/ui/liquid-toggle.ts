// ── Liquid toggle animation helpers ──

export function syncLiquidToggle(el: HTMLElement, state: boolean): void {
  el.setAttribute('aria-checked', String(state));
  el.style.setProperty('--complete', state ? '100' : '0');
}

export function animateLiquidToggle(el: HTMLElement, toState: boolean): void {
  (el as { dataset: DOMStringMap }).dataset.active = 'true';
  gsap.to(el, {
    '--complete': toState ? 100 : 0,
    duration: 0.14,
    delay: 0.18,
    ease: 'power1.inOut',
    onComplete: () => {
      gsap.delayedCall(0.05, () => {
        delete (el as { dataset: DOMStringMap }).dataset.active;
        el.setAttribute('aria-checked', String(toState));
      });
    },
  });
}
