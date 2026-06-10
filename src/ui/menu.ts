// ── Menu management (settings, sort, hamburger) ──

interface MenuElements {
  settingsMenu: HTMLElement;
  sortMenu: HTMLElement;
  hamburgerPanel: HTMLElement;
  btnHamburger: HTMLElement | null;
}

export function initMenus(
  settingsMenu: HTMLElement,
  sortMenu: HTMLElement,
  hamburgerPanel: HTMLElement,
  btnHamburger: HTMLElement | null,
): MenuElements {
  return { settingsMenu, sortMenu, hamburgerPanel, btnHamburger };
}

export function closeAllMenus({
  settingsMenu,
  sortMenu,
  hamburgerPanel,
  btnHamburger,
}: MenuElements): void {
  settingsMenu.classList.remove('visible');
  settingsMenu.setAttribute('inert', '');
  hamburgerPanel.classList.remove('visible');
  hamburgerPanel.setAttribute('inert', '');
  btnHamburger?.setAttribute('aria-expanded', 'false');
  sortMenu.classList.remove('visible');
  sortMenu.setAttribute('inert', '');
}

export function toggleSettingsMenu(elements: MenuElements, open: boolean): void {
  elements.settingsMenu.classList.toggle('visible', open);
  if (open) {
    elements.settingsMenu.removeAttribute('inert');
  } else {
    elements.settingsMenu.setAttribute('inert', '');
  }
}
