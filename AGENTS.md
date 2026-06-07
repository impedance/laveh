# AGENTS.md

<!-- AICODE-NOTE: NAV/AGENT_RESPONSE when the user requests it, respond in Russian -->
- Chat responses to the user: Russian.
- Repository files and documentation language: English (`README.md`, `docs/`, AICODE anchors, code comments unless file conventions require otherwise).

## 1) What this repo is
Morgan Finance — local-first iPhone PWA for personal cashflow hygiene. Dark dashboard shows free money until next income, upcoming obligations, safe daily pace, and credit card payoff goal. Vite + React + TypeScript + Tailwind + Zustand(persist) + SheetJS. No backend in MVP. Manual Excel import from T-Bank.

System-of-record map: `docs/index.md`.

## 2) Fast commands (run these first)
- Smoke: `make smoke`
- Agent smoke (optional): `make agent-smoke`
- Preflight: `make preflight`
- Strict smoke: `make smoke STRICT=1`
- Harness info (optional): `make doctor`

## 3) Non-negotiable invariants
- Wire existing tooling first; do not migrate the stack just to satisfy the harness.
- Keep default verification offline and deterministic unless the repo documents an opt-in integration path.
- Never commit secrets or generated credentials.

## 4) Repo map
- Entrypoints: `src/app/App.tsx`, `src/app/routes.tsx`
- Core domain logic: `src/domain/dashboard/calculateDashboard.ts`, `src/domain/categorization/applyRules.ts`
- Boundaries / DTOs / config: `src/store/types.ts`, `src/domain/dashboard/types.ts`
- Adapters (I/O): `src/domain/import/parseWorkbook.ts`, `src/domain/import/deduplicateTransactions.ts`

## 5) AICODE anchor skills (read + write)

Anchors (`AICODE-NOTE:`, `AICODE-TODO:`, `AICODE-QUESTION:`) — лёгкий способ сохранять контекст между сессиями агента.

### aicode-anchor-nav (read) — `skill("aicode-anchor-nav")`
- Загружать **в начале каждой задачи**: получает task-scoped контекст через `make anchors-context TASK="<task>"` или компактный обзор `make anchors-nav`.
- `make anchors-lint` — валидация формата и целостности якорей.
- `rg -n "AICODE-(NOTE|TODO|QUESTION):"` — fallback ручной поиск.
- Файл конфигурации: `.aicode-nav.json`.

### aicode-anchor-author (write) — `skill("aicode-anchor-author")`
- **suggest** (`make anchors-suggest TASK="<task>"`) read-only: предложить релевантные anchor-изменения.
- **audit** (`make anchors-audit`) read-only: аудит текущих якорей.
- **apply** (`make anchors-apply ANCHOR_PLAN=<plan-file>`): применить изменения из план-файла.
- Добавлять 1–3 анкера за обычную задачу, удалять stale при завершении.

### Когда использовать в планах
- `AICODE-NOTE:` — зафиксировать архитектурное решение, неочевидную зависимость, причину выбора.
- `AICODE-TODO:` — отметить незавершённую работу, известный баг, следующий шаг.
- `AICODE-QUESTION:` — зафиксировать открытый вопрос на будущее.
- В начале плана секции указывать: `<!-- AICODE-NOTE: relevant anchors from <file> -->`

## 5a) AICODE anchor workflow

### Session boot checklist
1. Read `AGENTS.md`
2. Read `README.md` (repo map)
3. Run `skill("aicode-anchor-nav")` for task context
4. If task wording is not yet clear, run `make anchors-nav` or `rg -n "AICODE-(NOTE|TODO|QUESTION):"`
5. Read `docs/index.md` + relevant task docs

### Anchor rules
- Allowed prefixes only: `AICODE-NOTE:`, `AICODE-TODO:`, `AICODE-QUESTION:`
- Anchor body language: English (ASCII only). Do not use non-ASCII characters in `AICODE-*:` lines.
- Keep anchor lines grep-friendly and self-contained.
- Before adding anchors, search existing ones to avoid duplicates.
- Placement default: prefer anchors in `src/` files near code logic; use in docs only for key repo-level entry points.
- Use `AICODE-NOTE:` for durable navigation points, invariants, or implementation facts.
- Use `AICODE-TODO:` only for unresolved local work next to the code.
- Use `AICODE-QUESTION:` only for active uncertainty that should not be silently guessed away.
- If a heading or existing comment already makes the location easy to navigate, do not add an anchor.
- When a change completes a nearby `AICODE-TODO:`, remove it.
- When a change resolves a nearby `AICODE-QUESTION:`, convert it to `AICODE-NOTE:decision:`.
- Delete stale anchors that no longer improve navigation or safe editing.

### Minimum done with anchors
- Review nearby anchors in every changed logic area.
- Update/remove affected anchors.
- Close stale `AICODE-TODO:` when the current change resolves them.
- Resolve touched `AICODE-QUESTION:` when the answer becomes known.
- Run `npm run lint && npm run typecheck && npm run test` after implementation.

## 6) How to finish a task
- Make the change.
- Run `make smoke`.
- (If relevant) run `make agent-smoke`.
- Run `make preflight`.
- Summarize what changed and the commands you ran.
