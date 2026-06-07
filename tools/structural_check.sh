#!/usr/bin/env bash
set -euo pipefail

STRICT="${STRICT:-0}"

fail() {
  local rule="$1"
  local problem="$2"
  local why="$3"
  local fix="$4"
  local docs="$5"
  cat <<EOF
Rule: ${rule}
Problem: ${problem}
Why: ${why}
Fix: ${fix}
Docs: ${docs}
Command: make smoke (then make preflight)
EOF
  exit 2
}

warn_or_fail() {
  local rule="$1"
  local problem="$2"
  local why="$3"
  local fix="$4"
  local docs="$5"
  if [ "${STRICT}" = "1" ]; then
    fail "$rule" "$problem" "$why" "$fix" "$docs"
  fi
  cat <<EOF
Rule: ${rule}
Problem: ${problem}
Why: ${why}
Fix: ${fix}
Docs: ${docs}
Command: make smoke (then make preflight)
NOTE: non-fatal because STRICT!=1
EOF
}

require_file() {
  local rule="$1"
  local path="$2"
  local why="$3"
  local fix="$4"
  local docs="$5"
  [ -f "$path" ] || fail "$rule" "$path is missing." "$why" "$fix" "$docs"
}

require_grep() {
  local rule="$1"
  local pattern="$2"
  local path="$3"
  local why="$4"
  local fix="$5"
  local docs="$6"
  grep -Eq "$pattern" "$path" || fail "$rule" "$path is missing required content: $pattern" "$why" "$fix" "$docs"
}

require_file "AGENTS_MD_MISSING" "AGENTS.md" "Agents need a stable entrypoint." "Create AGENTS.md with the harness bootstrap." "AGENTS.md"
require_file "DOCS_INDEX_MISSING" "docs/index.md" "Agents need a system-of-record map." "Create docs/index.md with Code Map, Typing Surfaces, and Test Map." "docs/index.md"
require_file "MAKEFILE_MISSING" "Makefile" "Agents need consistent verification commands." "Create a Makefile with smoke and preflight targets." "Makefile"
require_file "STRUCTURAL_CHECK_MISSING" "tools/structural_check.sh" "The harness needs mechanical guardrails." "Add tools/structural_check.sh from the harness bootstrap." "tools/structural_check.sh"
require_file "WORKFLOW_MISSING" ".github/workflows/agent-harness.yml" "CI must run the same verification loop." "Add .github/workflows/agent-harness.yml from the harness bootstrap." ".github/workflows/agent-harness.yml"

# Recommended docs: warn by default, fail in STRICT=1
if [ ! -f docs/testing.md ]; then
  warn_or_fail     "DOCS_TESTING_MISSING"     "docs/testing.md is missing."     "Agents won't know offline rules, fast loops, and where artifacts go."     "Create docs/testing.md (keep it short)."     "docs/testing.md"
fi

require_grep "MAKE_SMOKE_TARGET_MISSING" '^smoke:' Makefile "Fast verification would be undefined." "Add a smoke target to Makefile." "Makefile"
require_grep "MAKE_PREFLIGHT_TARGET_MISSING" '^preflight:' Makefile "Full verification would be undefined." "Add a preflight target to Makefile." "Makefile"
require_grep "MAKE_LINT_TARGET_MISSING" '^lint:' Makefile "Lint wiring must be explicit." "Add a lint target to Makefile." "Makefile"
require_grep "MAKE_TYPECHECK_TARGET_MISSING" '^typecheck:' Makefile "Typecheck wiring must be explicit." "Add a typecheck target to Makefile." "Makefile"
require_grep "MAKE_TEST_TARGET_MISSING" '^test:' Makefile "Test wiring must be explicit." "Add a test target to Makefile." "Makefile"
require_grep "MAKE_STRUCTURAL_TARGET_MISSING" '^structural:' Makefile "Structural checks must be runnable." "Add a structural target to Makefile." "Makefile"

require_grep "AGENTS_SMOKE_MISSING" 'make smoke' AGENTS.md "Agents must know the fast verification loop." "Mention make smoke in AGENTS.md." "AGENTS.md"
require_grep "AGENTS_PREFLIGHT_MISSING" 'make preflight' AGENTS.md "Agents must know the full verification loop." "Mention make preflight in AGENTS.md." "AGENTS.md"
require_grep "AGENTS_INDEX_MISSING" 'docs/index.md' AGENTS.md "Agents need a pointer to the repo map." "Reference docs/index.md in AGENTS.md." "AGENTS.md"

require_grep "DOCS_CODE_MAP_MISSING" '^## Code Map' docs/index.md "Agents need to navigate the codebase." "Add a Code Map section to docs/index.md." "docs/index.md"
require_grep "DOCS_TYPING_MISSING" '^## Typing Surfaces' docs/index.md "Agents need typed boundary guidance." "Add a Typing Surfaces section to docs/index.md." "docs/index.md"
require_grep "DOCS_TEST_MAP_MISSING" '^## Test Map' docs/index.md "Agents need verification guidance." "Add a Test Map section to docs/index.md." "docs/index.md"


# Pareto agent guidance: warn by default, fail only in STRICT=1.
for section in "Task Router" "Change Contracts" "Test Selection Matrix" "Known Pitfalls"; do
  if ! grep -Eq "^## ${section}" docs/index.md; then
    warn_or_fail       "DOCS_INDEX_${section// /_}_MISSING"       "docs/index.md is missing ## ${section}."       "Agents need quick routing, contracts, focused tests, and project pitfalls."       "Add a short ## ${section} section to docs/index.md."       "docs/index.md"
  fi
done

# Placeholders are allowed during init, but should be eliminated before handoff.
if [ "${STRICT}" = "1" ]; then
  if grep -q "<paths>" AGENTS.md; then
    fail "AGENTS_PLACEHOLDERS" "AGENTS.md still contains <paths> placeholders." "Agents will guess boundaries and touch wrong code." "Fill in the Repo map section with real paths." "AGENTS.md"
  fi
  if grep -q "<paths>" docs/index.md; then
    fail "DOCS_INDEX_PLACEHOLDERS" "docs/index.md still contains <paths> placeholders." "Agents will guess navigation and tests." "Fill in Code Map / Test Map with real paths/commands." "docs/index.md"
  fi
fi

exit 0
