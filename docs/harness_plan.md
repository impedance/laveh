# Harness Plan

- Harness version: 0.6
- Detected stacks: Vite + React + TypeScript + Tailwind + Zustand (planned, not yet scaffolded)

## Current Tooling
- Lint: none (planned: eslint)
- Typecheck: none (planned: tsc --noEmit)
- Tests: none (planned: vitest)
- CI: .github/workflows/agent-harness.yml (structural only)

## Fill First
- Code map paths: src/app/App.tsx, src/app/routes.tsx, src/domain/dashboard/calculateDashboard.ts, src/domain/import/parseWorkbook.ts, src/store/types.ts
- Task router rows: see docs/index.md Task Router section
- Change contracts: localStorage-first (Zustand persist), no backend in MVP, credit balance excluded from Cash Balance, JSON backup required early
- Test selection matrix: npx vitest run (see docs/index.md Test Selection Matrix)
- Known pitfalls: localStorage loss on Safari, credit balance exclusion, zero-code state (harness will report missing tooling until Phase 1 scaffolding)

## Pareto Setup Checklist
- Keep `AGENTS.md` short and point to `docs/index.md`.
- Put navigation in `docs/index.md`, not in `AGENTS.md`.
- Put verification rules in `docs/testing.md`.
- Add `docs/agent-notes.md` only if there are real project-specific pitfalls.
- Run `make smoke`, then `make preflight`.
