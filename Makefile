# BEGIN AGENT HARNESS v0.6
ARTIFACTS_DIR ?= artifacts
STRICT ?= 0
QUIET ?= 0
FAIL_FAST ?= 0
PYTHON ?= python3
BLACKBOX_CMD ?=

.PHONY: smoke preflight lint typecheck test structural agent-smoke doctor
smoke: structural lint test

preflight: structural lint typecheck test

structural:
	@STRICT="$(STRICT)" bash tools/structural_check.sh

agent-smoke: smoke
	@set -eu; 	if [ -n "$(BLACKBOX_CMD)" ]; then 		mkdir -p "$(ARTIFACTS_DIR)"; 		bash -lc "$(BLACKBOX_CMD)"; 	else 		echo "NOTE: agent-smoke is not wired (BLACKBOX_CMD is empty)."; 		echo "Remediation: set BLACKBOX_CMD='...' or define your own agent-smoke target."; 		[ "$(STRICT)" = "1" ] && exit 2 || true; 	fi

doctor:
	@echo "Targets: smoke, agent-smoke (optional), preflight"; \
	echo "STRICT=$(STRICT)  QUIET=$(QUIET)  FAIL_FAST=$(FAIL_FAST)"; \
	echo "PYTHON=$(PYTHON)  ARTIFACTS_DIR=$(ARTIFACTS_DIR)"; \
	test -f AGENTS.md && echo "AGENTS.md: ok" || echo "AGENTS.md: missing"; \
	test -f docs/index.md && echo "docs/index.md: ok" || echo "docs/index.md: missing"; \
	test -f docs/testing.md && echo "docs/testing.md: ok" || echo "docs/testing.md: missing"; \
	test -f docs/harness_plan.md && echo "docs/harness_plan.md: ok" || echo "docs/harness_plan.md: missing"; \
	test -f .github/workflows/agent-harness.yml && echo ".github/workflows/agent-harness.yml: ok" || echo ".github/workflows/agent-harness.yml: missing"; \
	test -x tools/run_silent.sh && echo "tools/run_silent.sh: ok" || echo "tools/run_silent.sh: missing"

lint:
	@set -eu; \
	if [ -f pyproject.toml ] || [ -f requirements.txt ] || [ -f requirements-dev.txt ] || [ -f requirements-test.txt ] || [ -f poetry.lock ] || [ -f pdm.lock ] || [ -f uv.lock ]; then \
		if $(PYTHON) -m ruff --version >/dev/null 2>&1; then \
			if [ "$(QUIET)" = "1" ] && [ -x tools/run_silent.sh ]; then \
				tools/run_silent.sh "ruff check" $(PYTHON) -m ruff check .; \
			else \
				$(PYTHON) -m ruff check .; \
			fi; \
		else \
			echo "Remediation: install ruff or wire the existing Python linter."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi; \
	if [ -f package.json ]; then \
		if command -v npm >/dev/null 2>&1; then \
			if [ "$(QUIET)" = "1" ] && [ -x tools/run_silent.sh ]; then \
				tools/run_silent.sh "npm lint" npm run -s lint --if-present; \
			else \
				npm run -s lint --if-present; \
			fi; \
		else \
			echo "Remediation: npm is missing; wire the existing Node linter."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi; \
	if [ -f go.mod ]; then \
		if command -v golangci-lint >/dev/null 2>&1; then \
			golangci-lint run; \
		elif command -v go >/dev/null 2>&1; then \
			go vet ./...; \
		else \
			echo "Remediation: Go tooling is missing; wire the existing Go lint command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi

typecheck:
	@set -eu; \
	if [ -f pyproject.toml ] || [ -f requirements.txt ] || [ -f requirements-dev.txt ] || [ -f requirements-test.txt ] || [ -f poetry.lock ] || [ -f pdm.lock ] || [ -f uv.lock ]; then \
		if $(PYTHON) -m mypy --version >/dev/null 2>&1; then \
			if [ "$(QUIET)" = "1" ] && [ -x tools/run_silent.sh ]; then \
				tools/run_silent.sh "mypy" $(PYTHON) -m mypy .; \
			else \
				$(PYTHON) -m mypy .; \
			fi; \
		else \
			echo "Remediation: install mypy or wire the existing Python typecheck command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi; \
	if [ -f package.json ]; then \
		if command -v npm >/dev/null 2>&1; then \
			if [ "$(QUIET)" = "1" ] && [ -x tools/run_silent.sh ]; then \
				tools/run_silent.sh "npm typecheck" npm run -s typecheck --if-present; \
			else \
				npm run -s typecheck --if-present; \
			fi; \
		else \
			echo "Remediation: npm is missing; wire the existing Node typecheck command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi; \
	if [ -f go.mod ]; then \
		if command -v go >/dev/null 2>&1; then \
			go vet ./...; \
		else \
			echo "Remediation: Go tooling is missing; wire the existing Go typecheck command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi

test:
	@set -eu; \
	mkdir -p "$(ARTIFACTS_DIR)"; \
	if [ -f pyproject.toml ] || [ -f requirements.txt ] || [ -f requirements-dev.txt ] || [ -f requirements-test.txt ] || [ -f poetry.lock ] || [ -f pdm.lock ] || [ -f uv.lock ]; then \
		if $(PYTHON) -m pytest --version >/dev/null 2>&1; then \
			PYTEST_EXTRA_ARGS=""; \
			if [ "$(FAIL_FAST)" = "1" ]; then PYTEST_EXTRA_ARGS="--maxfail=1"; fi; \
			set +e; \
			if [ "$(QUIET)" = "1" ]; then \
				_PYTEST_OUT="$$(mktemp "$${TMPDIR:-/tmp}/pytest.XXXXXX")"; \
				$(PYTHON) -m pytest $$PYTEST_EXTRA_ARGS --junitxml="$(ARTIFACTS_DIR)/pytest.xml" > "$$_PYTEST_OUT" 2>&1; \
				rc=$$?; \
				if [ $$rc -eq 0 ]; then \
					printf "  ✓ pytest\n"; \
					rm -f "$$_PYTEST_OUT"; \
				elif [ $$rc -eq 5 ] && [ "$(STRICT)" != "1" ]; then \
					printf "  ✓ pytest (0 tests)\n"; \
					rm -f "$$_PYTEST_OUT"; \
				else \
					printf "  ✗ pytest\n" >&2; \
					cat "$$_PYTEST_OUT" >&2 || true; \
					rm -f "$$_PYTEST_OUT"; \
					exit $$rc; \
				fi; \
			else \
				$(PYTHON) -m pytest $$PYTEST_EXTRA_ARGS --junitxml="$(ARTIFACTS_DIR)/pytest.xml"; \
				rc=$$?; \
			fi; \
			set -e; \
			if [ $$rc -ne 0 ]; then \
				if [ $$rc -eq 5 ] && [ "$(STRICT)" != "1" ]; then \
					if [ "$(QUIET)" != "1" ]; then echo "NOTE: pytest collected 0 tests."; fi; \
				else \
					exit $$rc; \
				fi; \
			fi; \
		else \
			echo "Remediation: install pytest or wire the existing Python test command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi; \
	if [ -f package.json ]; then \
		if command -v npm >/dev/null 2>&1; then \
			if [ "$(QUIET)" = "1" ] && [ -x tools/run_silent.sh ]; then \
				tools/run_silent.sh "npm test" npm run -s test --if-present; \
			else \
				npm run -s test --if-present; \
			fi; \
		else \
			echo "Remediation: npm is missing; wire the existing Node test command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi; \
	if [ -f go.mod ]; then \
		if command -v go >/dev/null 2>&1; then \
			go test -json ./... > "$(ARTIFACTS_DIR)/go-test.json"; \
		else \
			echo "Remediation: Go tooling is missing; wire the existing Go test command."; \
			[ "$(STRICT)" = "1" ] && exit 2 || true; \
		fi; \
	fi
# END AGENT HARNESS
