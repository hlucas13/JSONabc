# JSONabc

> A beautiful, zero-install JSON property sorter with a **Liquid Glass** aesthetic — alphabetical sorting (A–Z), trailing comma support, syntax highlighting, light/dark mode, frosted glass effects, and local history.

Sorts JSON object properties alphabetically and array values numerically. Designed as a progressive web app — no build step needed to run, just open `index.html` in any modern browser.

**Live:** [https://hlucas13.github.io/JSONabc](https://hlucas13.github.io/JSONabc)

---

## Features

- **Alphabetical sorting** — recursively sorts all object keys A–Z at any depth
- **Array sorting** — sorts array values 0–1; available as a separate option in the Actions menu
- **JSONC support** — accepts JSON with comments (`//` and `/* */`) and trailing commas; comments are preserved in the output
- **Syntax highlighting** — CodeMirror 5 with **Ayu** colour themes (Ayu Light / Ayu Dark)
- **Format only** — pretty-prints JSON without reordering keys
- **Actions menu** — the primary dock button opens a menu with **Sort** (properties A–Z), **Sort arrays** (properties + array values), and **Format**; Sort is also accessible via `Ctrl+Enter` / `Cmd+Enter`
- **Light / Dark mode** — persists preference in `localStorage`; follows system by default
- **Clear / Frosted glass** — two glass styles togglable from the settings menu
- **Copy to clipboard** — copies the sorted result with a single click
- **Local History** — every paste or edit is automatically saved to `localStorage` (up to 25 snapshots). Open the **History** modal from the dock to browse, restore, or delete any version
- **Keyboard shortcut** — `Ctrl+Enter` / `Cmd+Enter` to sort
- **Floating dock** — physics-based refraction using Snell's-law displacement maps; landscape shows more buttons (Copy, History, Clear), portrait collapses them into a **More** (⋯) hamburger panel
- **Liquid toggle** — gooey, animated switches with SVG goo filter and GSAP transitions
- **Glass toast** — pill-shaped notifications with backdrop blur and glass shine
- **Help & Wiki** — in-app modal within the **Settings** menu, with usage guidance, keyboard shortcuts and feature reference. Each help section has a card with surface background
- **Conventional commits** — Husky hooks enforce conventional commit messages (`commitlint`) and run Prettier + ESLint on every commit via `lint-staged`

## Project Architecture

```
JSONabc/
├── src/
│   ├── main.ts                ← Application orchestrator (wires together all subsystems)
│   ├── json-utils.ts          ← Pure JSON processing (parsing, sorting, comparison)
│   ├── json-utils.test.ts     ← Unit tests for json-utils
│   ├── jsonc-processor.ts     ← JSONC comment-preserving parser & serializer
│   ├── jsonc-processor.test.ts← Unit tests for jsonc-processor
│   ├── history-store.ts       ← localStorage persistence for paste/edit snapshots
│   ├── glass-distortion.ts    ← Snell's-law displacement map generator
│   ├── globals.d.ts           ← Type declarations (CodeMirror, GSAP)
│   └── ui/
│       ├── editor.ts          ← CodeMirror editor factory
│       ├── menu.ts            ← Menu management (settings, sort, hamburger)
│       ├── modals.ts          ← Modal management (history, help)
│       ├── theme.ts           ← Theme management (dark/light, frosted/clear glass)
│       ├── toast.ts           ← Toast notification system
│       └── liquid-toggle.ts   ← Liquid toggle animation helpers
├── .github/workflows/
│   └── ci.yml                 ← GitHub Actions CI (typecheck, lint, test, build)
├── .husky/
│   ├── commit-msg             ← commitlint conventional commit enforcement
│   └── pre-commit             ← lint-staged (Prettier + ESLint)
├── index.html                 ← HTML structure with Liquid Glass components
├── style.css                  ← Design tokens, glass system, CodeMirror theme, responsive, modals
├── build.js                   ← esbuild bundler (entry: src/main.ts → app.bundle.js)
├── vite.config.ts              ← Vite dev server + Vitest test configuration
├── eslint.config.js           ← ESLint flat config for TypeScript
├── .prettierrc                ← Prettier formatting rules
├── .editorconfig              ← Editor consistency settings
├── commitlint.config.js       ← Conventional commits config
├── package.json               ← Dependencies (TypeScript, esbuild, ESLint, Husky, Prettier, Vitest)
├── package-lock.json          ← Dependency lockfile
├── tsconfig.json              ← TypeScript configuration
├── LICENSE                    ← MIT
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

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run build`      | Bundle TypeScript with esbuild → `app.bundle.js` |
| `npm run test`       | Run unit tests with Vitest                       |
| `npm run test:watch` | Run tests in watch mode                          |
| `npm run typecheck`  | Type-check without emitting files                |
| `npm run lint`       | Run ESLint on `src/`                             |

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

## Liquid Glass

The UI chrome (dock, menus, modals, and toggles) is built around a physics-based Liquid Glass system, implemented in `src/glass-distortion.ts`.

The implementation follows the refraction principles described in **[Liquid Glass — CSS & SVG](https://kube.io/blog/liquid-glass-css-svg/)** by Kube:

- **Snell's law refraction** — each pixel of the glass surface displaces the background according to the angle of refraction derived from the surface normal, using an index of refraction of **1.45** (borosilicate glass).
- **Convex height profile** — the surface height function `h(t) = √t` models a curved glass lens that is thicker at the centre and tapers toward the rim.
- **SVG displacement maps** — a `<feImage>` + `<feDisplacementMap>` filter pipeline applies the computed per-pixel displacement at runtime, replacing the old turbulence-noise approach with deterministic, physics-consistent distortion.
- **Multi-layer glass** — each glass element has four layers: `glass-effect` (backdrop blur + SVG distortion), `glass-tint` (surface colour), `glass-shine` (inset edge specular), and `glass-content` (interactive children)
- **Progressive enhancement** — a `@supports (backdrop-filter: url(#x))` check unlocks the `backdrop-filter` compositing path on Chromium; all other browsers fall back to the base blur and tint layers.
- **Convex specular hierarchy** — glass surfaces carry a three-layer inset `box-shadow` stack: primary top-left arc highlight → full perimeter rim → counter-specular depth shadow, matching the light model expected from a convex glass element.
- **Design tokens** — all colours, spacing, and glass parameters are CSS custom properties, fully overridable per theme
- **WCAG AA contrast** — text colours are carefully chosen to meet WCAG 2.1 AA standards in both light and dark modes

## History persistence

The app saves up to 25 snapshots of the input editor content to `localStorage` under the key `jsonabc-history`. Snapshots are taken on every change with an 800 ms debounce. The **History** button in the dock opens a modal where you can:

- Click any entry to restore its content to the input editor
- Delete individual entries with the × button (with confirmation)
- Click **Clear all** to wipe the entire history (with confirmation)

## Deployment (GitHub Pages)

Deploy is fully automated via **GitHub Actions**. On every push to `main`, the workflow:

1. Runs type-check, lint, and tests
2. Builds `app.bundle.js` with esbuild
3. Deploys to GitHub Pages automatically

### First-time setup

In the repository Settings → Pages, set **Source** to **GitHub Actions**.

After that, every push to `main` triggers an automatic deploy.

### Manual deploy

You can also trigger a deploy manually from the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.

## Technology

- **TypeScript** + **esbuild** (fast, zero-config bundler)
- **CodeMirror 5** (JSON editor with syntax highlighting, line numbers, bracket matching, folding)
- **jsonc-parser** (comment-aware JSON scanning and parsing)
- **GSAP** (liquid toggle animations)
- **CSS custom properties** (design tokens with light/dark mode)
- **SVG filters** (displacement mapping via Snell's law for glass refraction)
- **localStorage** (theme, glass style, and history persistence)
- **Husky** + **commitlint** + **lint-staged** (conventional commits and pre-commit formatting)
- **No framework** — vanilla HTML, CSS and JavaScript

## Licence

MIT © [Homero Lucas do Prado](https://github.com/hlucas13)
