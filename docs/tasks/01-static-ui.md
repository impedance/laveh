# Work Plan: Phase 1 — Static UI (HTML Mock → React Components)

> **Status: Done**

## 0) Orientation
- Read: `tasks/02-home-screen-ux.md` (component specs), `tasks/05-visual-phases-delivery.md` §18-19 (visual design, project structure), `denezhka_dark_dashboard_mock.html` (reference render)
- Anchor context: `docs/index.md` → Component paths: `src/components/cards/*`, `src/components/layout/*`, `src/pages/HomePage.tsx`
- Dependency: **Phase 0 completed** (Vite + React + TS + Tailwind dev server working).
- Current state: `denezhka_dark_dashboard_mock.html` has a full static dark dashboard. `src/app/App.tsx` renders a placeholder.

## 1) Outcome
- Goal: Replicate the dark dashboard mock exactly in React components, using hardcoded mock data. No store, no calculations, no routing.
- Success criteria:
  - `npx vite` renders the same 7 dashboard cards as `denezhka_dark_dashboard_mock.html`.
  - Visual parity: colors, radii, spacing, font sizes match the mock.
  - Layout matches iPhone 430px centered card layout. Desktop shows centered phone-width dashboard.
  - `npm run typecheck` passes.
  - `npm run lint` passes.
  - `make preflight` passes.

## 2) Scope
- In scope:
  - Layout shell: `AppLayout.tsx` (max-w-[430px] mx-auto, min-h-screen, dark bg).
  - StatusBar mock (time, battery).
  - App header ("Денежка", subtitle, avatar).
  - All 7 dashboard cards per `tasks/02-home-screen-ux.md` §9:
    - `FreeMoneyHeroCard.tsx`
    - `UpcomingObligationsCard.tsx`
    - `SafeDailyPaceCard.tsx`
    - `MoneyGuardCard.tsx`
    - `PrimaryGoalCard.tsx`
    - `RecurringExpensesCard.tsx`
  - `BottomNavigation.tsx` (4 tabs: Главная, Операции, План, Импорт — static highlights, no routing).
  - Hardcoded mock data file: `src/mock/dashboardData.ts` — exact numbers from HTML mock.
  - `HomePage.tsx` — composes all cards with mock data.
- Out of scope:
  - Zustand store, `persist` middleware.
  - Excel import, categorization, backup.
  - Dashboard calculation logic (`calculateDashboard.ts`).
  - Routing (React Router) — all cards render on one page.
  - PWA manifest, service worker.
  - Any form interactions, user input, editing.
- Assumptions / open questions:
  - Assumption: Tailwind dark theme CSS variables are already defined from Phase 0 (`src/index.css`).
  - Assumption: Inter font is loaded in `index.html` from Phase 0.

## 3) Change surface + safety
- Entry points: `src/app/App.tsx`, `src/pages/HomePage.tsx`
- Files/modules (all new or modified):
  - `src/app/App.tsx` (modify: import HomePage)
  - `src/app/routes.tsx` (no-op, leave empty)
  - `src/pages/HomePage.tsx` (new)
  - `src/components/layout/AppLayout.tsx` (new)
  - `src/components/layout/BottomNavigation.tsx` (new)
  - `src/components/cards/FreeMoneyHeroCard.tsx` (new)
  - `src/components/cards/UpcomingObligationsCard.tsx` (new)
  - `src/components/cards/SafeDailyPaceCard.tsx` (new)
  - `src/components/cards/MoneyGuardCard.tsx` (new)
  - `src/components/cards/PrimaryGoalCard.tsx` (new)
  - `src/components/cards/RecurringExpensesCard.tsx` (new)
  - `src/mock/dashboardData.ts` (new)
- Invariants/contracts to preserve:
  - `npm run typecheck` and `npm run lint` must keep passing.
  - No data persistence — components accept props, don't read/write localStorage.
  - Card components must accept typed props matching eventual `DashboardViewModel` structure from `tasks/03-data-and-calculations.md`.
- Main risks + mitigation:
  - Risk: Tailwind classes in mock use raw CSS with `style` attributes → mitigation: extract to Tailwind utility classes wherever possible, keep `style` only for dynamic values (e.g., progress width).
  - Risk: SVG circular progress ring in SafeDailyPaceCard is complex to reproduce → mitigation: use a simple CSS circular progress (conic-gradient or SVG with stroke-dasharray).

## 4) Implementation steps
1. Create `src/mock/dashboardData.ts` with a typed mock object matching the values from `denezhka_dark_dashboard_mock.html`.
2. Create `src/components/layout/AppLayout.tsx` — dark background wrapper, `max-w-[430px] mx-auto min-h-screen bg-[#090d12]`.
3. Create `src/components/cards/FreeMoneyHeroCard.tsx` — amount, mode badge, supporting metrics lines.
4. Create `src/components/cards/UpcomingObligationsCard.tsx` — summary block + 3 obligation rows.
5. Create `src/components/cards/SafeDailyPaceCard.tsx` — circular progress ring, amounts.
6. Create `src/components/cards/MoneyGuardCard.tsx` — single action card with CTA button.
7. Create `src/components/cards/PrimaryGoalCard.tsx` — progress bar, milestone, amount.
8. Create `src/components/cards/RecurringExpensesCard.tsx` — 3 category rows with progress bars.
9. Create `src/components/layout/BottomNavigation.tsx` — 4 static tabs with icons/emojis from mock.
10. Create `src/pages/HomePage.tsx` — composes all cards inside AppLayout with data from mock file.
11. Update `src/app/App.tsx` — render `<HomePage />`.
12. Compare `npx vite` output side-by-side with `denezhka_dark_dashboard_mock.html` in browser. Tweak Tailwind classes until visual parity is achieved.
13. Run `npm run typecheck && npm run lint` — fix any errors.
14. Run `make preflight` — verify all gates pass.

## 5) Validation
- Fast gate: `npm run typecheck` → expected: exit 0.
- Task-specific checks:
  - Visual: open `npx vite` in browser, compare to `denezhka_dark_dashboard_mock.html` — all 7 cards present, colors match, layout centered at 430px.
  - `npm run lint` → expected: exit 0, no warnings.
- Pareto blackbox: Not applicable for static UI phase — visual check is cheapest and highest-signal.
- Rollback:
  - Revert: `src/app/App.tsx` back to placeholder. Delete all new files in `src/components/`, `src/pages/`, `src/mock/`.
  - Rollback verification: `npx vite` still shows placeholder.

## 6) DOD
- All 7 dashboard cards render from React components matching the HTML mock.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `make preflight` passes.
- All new files committed with message `feat: static dashboard UI from HTML mock`.

## 7) Final verdict
- Ready for implementation: **yes**
