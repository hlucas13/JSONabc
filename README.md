# JSONabc

> A beautiful, zero-install JSON property sorter with a **Liquid Glass** aesthetic — alphabetical sorting (A–Z), trailing comma support, syntax highlighting, light/dark mode, frosted glass effects, and local history.

Sorts JSON object properties alphabetically and array values numerically. Designed as a progressive web app — no build step needed to run, just open `index.html` in any modern browser.

**Live:** [https://hlucas13.github.io/JSONabc](https://hlucas13.github.io/JSONabc)

---

## Features

- **Alphabetical sorting** — recursively sorts all object keys A–Z at any depth
- **Numerical sorting** — sorts numeric values 0–1 within arrays
- **Array toggle** — enable/disable sorting of array element values
- **Trailing commas** — accepts JSON with trailing commas at any nesting level
- **Syntax highlighting** — CodeMirror 5 with a custom JSON colour theme (light + dark)
- **Format only** — pretty-prints JSON without reordering keys
- **Actions menu** — the primary dock button opens a menu with **Sort** and **Format**; Sort is also accessible via `Ctrl+Enter` / `Cmd+Enter`
- **Light / Dark mode** — persists preference in `localStorage`; follows system by default
- **Clear / Frosted glass** — two glass styles togglable from the settings menu
- **Copy to clipboard** — copies the sorted result with a single click
- **Local History** — every paste or edit is automatically saved to `localStorage` (up to 25 snapshots). Open the **History** modal from the dock to browse, restore, or delete any version
- **Keyboard shortcut** — `Ctrl+Enter` / `Cmd+Enter` to sort
- **Floating dock** — physics-based refraction using Snell's-law displacement maps; landscape shows more buttons (Copy, History, Clear), portrait collapses them into a **More** (⋯) hamburger panel
- **Liquid toggle** — gooey, animated switches matching the FalaTina and Prisma.md design language
- **Glass toast** — pill-shaped notifications with backdrop blur and glass shine
- **Help & Wiki** — in-app modal within the **Settings** menu, with usage guidance, keyboard shortcuts and feature reference. Each help section has a card with surface background
- **Conventional commits** — Husky hooks enforce conventional commit messages (`commitlint`) and run Prettier + ESLint on every commit via `lint-staged`

## Project Architecture

```
JSONabc/
├── src/
│   ├── main.ts                ← Application logic (sorting, UI, events, help modal, history)
│   ├── history-store.ts        ← localStorage persistence for paste/edit snapshots
│   ├── glass-distortion.ts     ← Snell's-law displacement map generator
│   └── globals.d.ts            ← Type declarations (CodeMirror, GSAP)
├── .husky/
│   ├── commit-msg              ← commitlint conventional commit enforcement
│   └── pre-commit              ← lint-staged (Prettier + ESLint)
├── index.html                  ← HTML structure with Liquid Glass components
├── style.css                   ← Design tokens, glass system, CodeMirror theme, responsive, modals
├── build.js                    ← esbuild bundler (entry: src/main.ts → app.bundle.js)
├── eslint.config.js            ← ESLint flat config for TypeScript
├── .prettierrc                 ← Prettier formatting rules
├── commitlint.config.js        ← Conventional commits config
├── package.json                ← Dependencies (TypeScript, esbuild, ESLint, Husky, Prettier)
├── package-lock.json           ← Dependency lockfile
├── tsconfig.json               ← TypeScript configuration
├── LICENSE                     ← MIT
├── .gitignore
└── README.md
```

## Getting Started

```sh
npm install          # installs dev dependencies (TypeScript, esbuild, etc.)
npm run build        # compiles TypeScript → app.bundle.js
```

Then open `index.html` in your browser, or serve it with any HTTP server for full GitHub Pages compatibility:

```sh
npx serve .          # or python -m http.server, etc.
```

The app also works directly from `file://` protocol, though CodeMirror's fold-gutter addon performs better when served over HTTP.

## Commands

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run build`     | Bundle TypeScript with esbuild → `app.bundle.js` |
| `npm run typecheck` | Type-check without emitting files                |
| `npm run lint`      | Run ESLint on `src/`                             |

## Git Hooks

After running `npm install`, Husky automatically installs the following hooks:

- **commit-msg** — runs `commitlint` to enforce [Conventional Commits](https://www.conventionalcommits.org/) format
- **pre-commit** — runs `lint-staged` which executes Prettier and ESLint on staged files

Commit messages must follow the conventional format, e.g.:

```
feat: add local history modal
fix: handle edge case in JSON parser
docs: update README with new features
```

## Design System

JSONabc shares its **Liquid Glass** design language with [FalaTina](https://github.com/hlucas13/FalaTinaChart) and [Prisma.md](https://github.com/hlucas13/Prisma.md):

- **Physics-based refraction** — SVG displacement maps computed from Snell's law simulate convex glass bezels on the dock and modal panels
- **Multi-layer glass** — each glass element has four layers: `glass-effect` (backdrop blur + SVG distortion), `glass-tint` (surface colour), `glass-shine` (inset edge specular), and `glass-content` (interactive children)
- **Liquid toggles** — gooey, GSAP-animated switches with knockout masks and SVG goo filters
- **Design tokens** — all colours, spacing, and glass parameters are CSS custom properties, fully overridable per theme
- **WCAG AA contrast** — text colours are carefully chosen to meet WCAG 2.1 AA standards in both light and dark modes

## History persistence

The app saves up to 25 snapshots of the input editor content to `localStorage` under the key `jsonabc-history`. Snapshots are taken on every change with an 800 ms debounce. The **History** button in the dock opens a modal where you can:

- Click any entry to restore its content to the input editor
- Delete individual entries with the × button (with confirmation)
- Click **Clear all** to wipe the entire history (with confirmation)

## Deployment (GitHub Pages)

The repository is configured for GitHub Pages at `https://hlucas13.github.io/JSONabc`:

1. Push to the `main` branch
2. In the repository Settings → Pages, set **Source** to **Deploy from a branch**, branch `main`, folder `/ (root)`
3. The `index.html` at the root serves as the entry point

No build step is required for GitHub Pages — the pre-built `app.bundle.js` is committed to the repository. If you modify the TypeScript sources, run `npm run build` and commit the updated bundle.

## Technology

- **TypeScript** + **esbuild** (fast, zero-config bundler)
- **CodeMirror 5** (JSON editor with syntax highlighting, line numbers, bracket matching, folding)
- **GSAP** (liquid toggle animations)
- **CSS custom properties** (design tokens with light/dark mode)
- **SVG filters** (displacement mapping via Snell's law for glass refraction)
- **localStorage** (theme, glass style, and history persistence)
- **Husky** + **commitlint** + **lint-staged** (conventional commits and pre-commit formatting)
- **No framework** — vanilla HTML, CSS and JavaScript

## Licence

MIT © [Homero Lucas do Prado](https://github.com/hlucas13)
