.PHONY: e2e e2e-api e2e-browser e2e-browser-headless e2e-install e2e-browsers e2e-up e2e-down e2e-skip-llm

E2E_DIR = e2e
PYTEST   = $(E2E_DIR)/.venv/bin/pytest
PW       = $(E2E_DIR)/.venv/bin/playwright

e2e-install:
	cd $(E2E_DIR) && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt -q

e2e-browsers:
	$(PW) install chromium

e2e-up:
	docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --build

e2e-down:
	docker compose down

e2e-api:
	cd $(E2E_DIR) && SKIP_LLM_TESTS=true $(PYTEST) api/ -v -m api --tb=short

e2e-browser:
	cd $(E2E_DIR) && $(PYTEST) browser/ -v -m browser --tb=short --headed

e2e-browser-headless:
	cd $(E2E_DIR) && $(PYTEST) browser/ -v -m browser --tb=short

e2e:
	cd $(E2E_DIR) && $(PYTEST) api/ browser/ -v --tb=short -m "api or browser"

e2e-skip-llm:
	cd $(E2E_DIR) && SKIP_LLM_TESTS=true $(PYTEST) api/ browser/ -v --tb=short -m "api or browser"
