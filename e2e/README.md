# InsightDB AI — E2E Tests

End-to-end tests for the full InsightDB AI stack. Two suites:

| Suite | Tool | Target |
|---|---|---|
| **API** | `pytest` + `httpx` | `http://localhost:8000` |
| **Browser** | `playwright` + `pytest-playwright` | `http://localhost:5173` |

---

## Prerequisites

The full stack must be running:

```bash
docker compose up --build
```

---

## Setup (one time)

```bash
cd e2e
pip install -r requirements.txt
playwright install chromium
```

Or with Make:

```bash
make e2e-install
make e2e-browsers
```

---

## Running Tests

### API E2E only (fast, no browser)

```bash
make e2e-api
```

### Browser E2E only (Playwright + Chromium)

```bash
make e2e-browser          # headed (see the browser)
make e2e-browser-headless # headless (CI-friendly)
```

### All E2E (skip LLM-dependent tests)

```bash
make e2e-skip-llm
```

### All E2E including LLM tests (requires Ollama running)

```bash
make e2e
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:8000` | Backend API URL |
| `E2E_FRONTEND_URL` | `http://localhost:5173` | Frontend URL |
| `SKIP_LLM_TESTS` | `false` | Set to `true` to skip slow LLM tests |

---

## Test Markers

| Marker | Description |
|---|---|
| `api` | API-level tests (httpx) |
| `browser` | Browser-level tests (Playwright) |
| `slow` | Slow tests requiring a live LLM |

Run only specific markers:

```bash
cd e2e
pytest -m api -v
pytest -m "browser and not slow" -v
```
