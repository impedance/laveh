# Testing

## Commands
- `npm test` — run all tests (vitest)
- `npx vitest run src/domain/budget/` — budget tests
- `npx vitest run src/domain/import/` — import tests
- `npx vitest run src/domain/categorization/` — categorization tests
- `npx vitest run src/store/` — store tests
- `npx vitest run src/domain/dashboard/` — dashboard tests (legacy)

## Gates
- `make smoke` — structural + lint + test
- `make preflight` — structural + lint + typecheck + test

(End of file — total 12 lines)
