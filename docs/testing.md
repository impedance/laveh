# Testing

## Commands
- `npm test` — run all tests (vitest)
- `npx vitest run src/domain/import/` — import tests
- `npx vitest run src/domain/dashboard/` — dashboard tests
- `npx vitest run src/store/` — store tests

## Gates
- `make smoke` — structural + lint + test
- `make preflight` — structural + lint + typecheck + test
