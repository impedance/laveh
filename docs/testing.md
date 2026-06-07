# Testing Guide

## Goals
- Keep default checks fast enough for agent iteration.
- Prefer offline-by-default verification; gate real external calls behind an explicit opt-in (e.g. `INTEGRATION=1`).
- Wire existing project tooling first; do not introduce new test frameworks just for the harness.

## Default commands
- `make smoke` - fastest verification loop
- `make agent-smoke` - optional black-box checks (if wired)
- `make preflight` - broader verification loop

## Test Selection Matrix
- **Docs/harness only:** `make smoke && make preflight`
- **Small isolated code change:** run the nearest focused test first, then `make preflight`
- **Core/shared behavior:** run focused tests plus `make preflight`
- **External integration:** run only when explicitly opted in by repo docs or user request

## Notes
- Optional flags:
  - `QUIET=1` - reduce successful tool output to one-line summaries where supported.
  - `FAIL_FAST=1` - stop after the first failure where the target supports it.
  - `STRICT=1` - make optional harness recommendations fail instead of warning.
- Put CI/debug output in `artifacts/`.
- If host-mode is supported, document it here.
