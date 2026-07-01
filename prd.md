# EvalForge — MVP PRD (v0.1)

## Goal

A dead-simple, self-hostable, open-source tool to evaluate LLM and RAG outputs with an LLM-as-a-judge and produce a shareable report. **Bring your own API key.**

---

## Problem

Teams ship AI features and judge quality by hand — slow, inconsistent, unreproducible. EvalForge turns "does this output look good?" into a score with reasons.

---

## Target Users

AI/ML engineers, data scientists, and indie builders who want a quick, self-hosted quality check without wiring up a heavy platform.

---

## Core Flow

```
Upload dataset (with responses) → LLM-as-a-Judge (BYO key) → Scored report
```

EvalForge evaluates outputs **you already produced** — it does not call your app. Each row carries the actual `response`.

```json
{ "question": "...", "context": "...", "expected_answer": "...", "response": "..." }
```

---

## MVP Scope

### Included

1. **Dataset upload** — CSV / JSON, with responses included.
2. **LLM evaluation** — correctness, relevance, completeness, conciseness.
3. **RAG evaluation** — faithfulness, context recall/precision, answer relevancy (Ragas).
4. **LLM-as-a-Judge** — BYO API key; user picks the judge model.
5. **Report** — overall score, hallucination/faithfulness rate, failed cases, best/worst examples. Shareable link.
6. **Run history** — store model, judge, dataset, scores, timestamp per run.

### Cut from MVP (and why)

- **Agent & multi-agent evaluation** — heaviest, least-proven; needs trace ingestion. Biggest scope risk. → later.
- **Benchmarking (Prompt A/B, Model A/B)** — upload-only means the user must generate both sets themselves; weak until generation exists. → later.
- **Dataset versioning & tagging** — nice-to-have, not core to first value. → later.
- **Regression detection** — baseline undefined; needs run history first. → later.
- **Free-tier inference at scale** — judge-heavy runs blow free rate/token limits. Replaced with BYO-key.

---

## Scoring

Per metric `0–1` (+ pass/fail + reason). Overall = weighted mean → `0–100`.

```json
{ "metric": "faithfulness", "score": 0.85, "passed": true, "reason": "Supported but omitted two details." }
```

---

## Tech Stack

- **Frontend:** Next.js + TypeScript + shadcn/ui + Tailwind
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Eval:** DeepEval (LLM metrics, G-Eval) + Ragas (RAG metrics)
- **Embeddings:** local sentence-transformers (in-process; no vector DB)
- **LLM:** BYO key — any provider (Groq / OpenAI / Anthropic); judge model is user-selected
- **Deploy:** Docker / docker-compose (one command to self-host)

---

## Limits (MVP)

- ≤ 1,000 rows, ≤ 5 MB per dataset.
- Async runs; bounded concurrency; retry-with-backoff on rate limits.
- Single-tenant self-host; optional shared token (no multi-user RBAC).

---

## How it gets noticed

One sharp wedge, not feature breadth: **trivial self-host (one `docker compose up`) + a clean, public, shareable report.** Pick a beachhead — RAG eval is the most defensible. Earn attention with polish on the single loop, then expand.

> Likely v0.2 wedge: **CI-gating** (CLI + GitHub Action that fails the build on a score drop) — the most defensible angle once run history + regression baseline exist.

---

## Success Criteria

1. Upload a dataset (with responses).
2. Run an LLM or RAG evaluation with your own key.
3. Get a shareable scored report.
