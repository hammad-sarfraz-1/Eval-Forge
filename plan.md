# EvalForge — Build Plan (v0.1)

Goal: ship the one loop — **upload dataset (with responses) → judge → shareable report**, BYO API key, one-command Docker. Build in order; each milestone has a **Verify** check before moving on.

---

## Current state (M0 — done)

Scaffold runs end-to-end with a **stub judge** (text overlap, no key).

- Backend: FastAPI + SQLite (`backend/app/`), tables Dataset · Row · Run · Result.
- Frontend: Next.js single page (upload → evaluate → table).
- Infra: `Dockerfile.backend`, `docker-compose.yml`, `Makefile` at root.

**Verify:** `docker compose up --build` → open :3000 → upload `sample.csv` → see scores.

---

## M1 — Real LLM judge (BYO key)

Replace the stub in `backend/app/evaluator.py`.

- Read API key + judge model from env (`.env` / compose `environment`); add `.env.example`.
- Use **DeepEval G-Eval** for the LLM metrics (correctness, relevance, completeness, conciseness) → each returns score `0–1` + reason.
- Keep `evaluate_row(row)` signature so `main.py` is untouched.

**Verify:** run on `sample.csv` with a real key → scores track answer quality, reasons are specific (not "[stub]").

---

## M2 — RAG evaluation (Ragas)

- If a row has `context`, run **Ragas**: faithfulness, context recall, context precision, answer relevancy.
- Embeddings via local **sentence-transformers** (in-process; no vector DB).
- Route per row: has `context` → RAG metrics; else → LLM metrics.

**Verify:** a row with context produces the 4 RAG metrics; a row without context produces the 4 LLM metrics.

---

## M3 — Reports

In the run response + report page, add beyond Overall Score:

- **Hallucination rate** = % of rows failing faithfulness.
- **Failed cases** = rows with score below a pass threshold.
- **Best / worst examples**.

**Verify:** report shows overall score, hallucination rate, failed list, best/worst.

---

## M4 — Run history + shareable report

- Backend: `GET /runs` (list), confirm `GET /runs/{id}` (already there).
- Frontend: a runs list + a stable report URL (`/runs/{id}`) anyone can open.

**Verify:** past runs are listed; pasting a report URL in a new tab reopens it.

---

## M5 — Robustness & limits

- Validate upload: reject if no `response` column/field; cap **≤ 1,000 rows**, **≤ 5 MB**.
- Run as a **background task**; bounded concurrency (~4) on judge calls.
- **Retry with backoff** on provider 429/5xx; surface a clear error to the UI.

**Verify:** oversized/invalid files are rejected with a clear message; a 1,000-row run completes without tripping rate limits.

---

## M6 — Tests & ship

- `pytest`: upload parsing (CSV/JSON), score aggregation, endpoints (happy + error paths).
- Polish README + `.env.example`.

**Verify:** `pytest` green; fresh checkout → `docker compose up` → full loop works.

---

## Deferred (post-v0.1)

- Agent & multi-agent evaluation (needs trace ingestion).
- Benchmarking (Prompt A/B, Model A/B).
- Dataset versioning & tagging.
- **Regression detection** — baseline definition still undecided (previous run vs pinned vs threshold); decide before building.

**v0.2 wedge:** CI-gating — a CLI + GitHub Action that fails the build on a score drop. The differentiator that gets the product noticed.
