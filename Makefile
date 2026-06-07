# BEGIN AGENT HARNESS v0.6 — Node-only project (Vite + React + TypeScript)
ARTIFACTS_DIR ?= artifacts
STRICT ?= 0
QUIET ?= 0
FAIL_FAST ?= 0
BLACKBOX_CMD ?=

.PHONY: smoke preflight lint typecheck test structural agent-smoke doctor anchors-lint anchors-audit anchors-suggest anchors-apply
smoke: structural lint test

preflight: structural lint typecheck test

structural:
	@STRICT="$(STRICT)" bash tools/structural_check.sh

agent-smoke: smoke
	@set -eu; \
	if [ -n "$(BLACKBOX_CMD)" ]; then \
		mkdir -p "$(ARTIFACTS_DIR)"; \
		bash -lc "$(BLACKBOX_CMD)"; \
	else \
		echo "NOTE: agent-smoke is not wired (BLACKBOX_CMD is empty)."; \
		echo "Remediation: set BLACKBOX_CMD='...' or define your own agent-smoke target."; \
		[ "$(STRICT)" = "1" ] && exit 2 || true; \
	fi

doctor:
	@echo "Targets: smoke, agent-smoke (optional), preflight"; \
	echo "STRICT=$(STRICT)  QUIET=$(QUIET)  FAIL_FAST=$(FAIL_FAST)"; \
	echo "ARTIFACTS_DIR=$(ARTIFACTS_DIR)"; \
	test -f AGENTS.md && echo "AGENTS.md: ok" || echo "AGENTS.md: missing"; \
	test -f docs/index.md && echo "docs/index.md: ok" || echo "docs/index.md: missing"

anchors-lint:
	python3 /home/spec/.codex/skills/aicode-anchor-nav/tools/lint_aicode.py

anchors-audit:
	python3 /home/spec/.codex/skills/aicode-anchor-nav/tools/aicode_anchor_author.py audit

anchors-suggest:
	python3 /home/spec/.codex/skills/aicode-anchor-nav/tools/aicode_anchor_author.py suggest

anchors-apply:
	python3 /home/spec/.codex/skills/aicode-anchor-nav/tools/aicode_anchor_author.py apply --plan $(ANCHOR_PLAN)

lint:
	@npm run -s lint --if-present

typecheck:
	@npm run -s typecheck --if-present

test:
	@mkdir -p "$(ARTIFACTS_DIR)" && npm run -s test --if-present
# END AGENT HARNESS
