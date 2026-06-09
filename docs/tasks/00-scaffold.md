# Work Plan: Phase 0 — Project Scaffolding

> **Status: Done**

## 0) Orientation
- Read: `AGENTS.md`, `docs/index.md`, `tasks/01-product-and-stack.md` (stack decisions), `tasks/05-visual-phases-delivery.md` (project structure)
- Anchor context: `docs/index.md` — Code Map, Typing Surfaces. Existing HTML mock: `denezhka_dark_dashboard_mock.html`.
- Current state: **no `src/` exists, no `package.json`, no configs**. The agent harness (`make smoke`, `make preflight`) passes only as a no-op because no language toolchain is wired yet.

## 1) Outcome
- Goal: Scaffold a working Vite + React + TypeScript + Tailwind dev server that compiles and renders a placeholder page.
- Success criteria:
  - `npm install` completes without errors.
  - `npx tsc --noEmit` passes (typecheck).
  - `npx vite build` produces a dist/ bundle.
  - `npx vite` serves the app on localhost.
  - `npm run lint` runs ESLint and passes.
  - `npm run typecheck` runs tsc --noEmit and passes.
  - `npm run test` runs `vitest run` (0 tests is ok, exits 0).
  - `make smoke` reports lint/test passing (not no-op).
  - `make preflight` reports typecheck passing (not no-op).

## 2) Scope
- In scope:
  - `npm init` + install: `react`, `react-dom`, `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `zustand`, `xlsx`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint`, `vite-plugin-pwa`, `workbox-precaching`, `workbox-routing`
  - `tsconfig.json` (strict, `src/` rootDir, `dist/` outDir)
  - `vite.config.ts` (React plugin, Tailwind plugin, PWA plugin commented out for now)
  - `tailwind.config.ts` (dark theme tokens from mock: colors, radii, font)
  - `eslint.config.js` (flat config, TS rules)
  - `src/app/App.tsx` — minimal "Денежка" placeholder
  - `src/app/routes.tsx` — empty placeholder
  - `src/main.tsx` — ReactDOM.createRoot entry
  - `index.html` — Vite entry with `<div id="root">`, Inter font from Google Fonts
  - `src/index.css` — `@tailwind base/components/utilities` + dark theme CSS variables
  - `package.json` scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`
  - `vitest.config.ts` — merged with vite config
  - `vitest.setup.ts` — empty placeholder
- Out of scope:
  - Any dashboard UI beyond `"Денежка"` placeholder.
  - Zustand store, persist middleware, data types.
  - Excel parsing, PWA manifest, service worker registration.
  - Backup/restore.
  - Actual test files (0 tests is OK).
  - Ejecting or migrating to another build tool.
- Assumptions / open questions:
  - Assumption: Node.js >= 20 and npm are available in the environment.
  - Assumption: `@tailwindcss/vite` is the Tailwind v4 plugin; if incompatible, fall back to `tailwindcss` + `postcss` + `autoprefixer` (v3 flow).

## 3) Change surface + safety
- Entry points: `index.html`, `src/main.tsx`, `src/app/App.tsx`
- Files/modules (all new):
  - `package.json`, `package-lock.json`
  - `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`
  - `vitest.config.ts`, `vitest.setup.ts`
  - `index.html`
  - `src/main.tsx`, `src/app/App.tsx`, `src/app/routes.tsx`
  - `src/index.css`
  - `.gitignore` (append `node_modules/`, `dist/`)
- Invariants/contracts to preserve:
  - Agent harness targets (`make smoke`, `make preflight`) must NOT regress — they switch from no-op to actual runs.
  - `make smoke STRICT=1` must succeed after Phase 0.
  - All task files (`tasks/01-05`) remain untouched — they are specifications, not plans.
- Main risks + mitigation:
  - Risk: Tailwind v4 vs v3 API mismatch → mitigation: start with Tailwind v3 (`tailwindcss`, `postcss`, `autoprefixer`) as it's more stable and the mock uses standard utility classes.
  - Risk: ESLint flat config vs legacy config confusion → mitigation: use `typescript-eslint` recommended config for flat config.

## 4) Implementation steps
1. `npm init -y` in project root.
2. Install devDependencies: `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint`
3. Install dependencies: `react`, `react-dom`, `zustand`, `xlsx`, `vite-plugin-pwa`, `workbox-precaching`, `workbox-routing`
4. Create `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022", "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "module": "ESNext", "moduleResolution": "bundler",
       "jsx": "react-jsx", "strict": true,
       "esModuleInterop": true, "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true, "isolatedModules": true,
       "noEmit": true,
       "baseUrl": ".", "paths": { "@/*": ["src/*"] }
     },
     "include": ["src"]
   }
   ```
5. Create `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
   });
   ```
6. Create `tailwind.config.ts` using color tokens from `denezhka_dark_dashboard_mock.html`.
7. Create `postcss.config.js`: `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`
8. Create `eslint.config.js` with `typescript-eslint` flat config.
9. Create `vitest.config.ts` extending vite config.
10. Create `vitest.setup.ts` (empty).
11. Write `index.html` with `<div id="root">`, Inter font, `<script src="/src/main.tsx">`.
12. Write `src/index.css` with Tailwind directives and dark theme CSS vars.
13. Write `src/main.tsx` — React 18 createRoot.
14. Write `src/app/App.tsx` — placeholder `<div>Денежка</div>`.
15. Write `src/app/routes.tsx` — empty placeholder export.
16. Update `package.json` scripts: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`, `"lint": "eslint src/ --max-warnings 0"`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`
17. Append `node_modules/` and `dist/` to `.gitignore`.
18. Run `npm install`.
19. Run `make smoke` — verify lint/test targets run (not no-op).
20. Run `make preflight` — verify typecheck target runs (not no-op).

## 5) Validation
- Fast gate: `npm run typecheck` → expected: exit 0, no errors.
- Task-specific checks:
  - `npx vite build` → expected: produces `dist/index.html`, no errors.
  - `npm run lint` → expected: exit 0, no warnings.
  - `npm run test` → expected: exit 0 (0 tests, vitest defaults to exit 0 with no test files).
  - `make smoke STRICT=1` → expected: exit 0.
  - `make preflight STRICT=1` → expected: exit 0.
- Rollback:
  - Files to revert: all newly created files (package.json, configs, src/, index.html).
  - Rollback verification: `make smoke` must still exit 0 as no-op (no `package.json` found).

## 6) DOD
- `npm run typecheck` passes (exit 0).
- `npm run lint` passes (exit 0).
- `npm run test` passes (0 tests, exit 0).
- `npx vite build` succeeds.
- `make smoke STRICT=1` passes.
- `make preflight STRICT=1` passes.
- All new files committed with message `feat: scaffold Vite + React + TS + Tailwind project`.

## 7) Final verdict
- Ready for implementation: **yes**
