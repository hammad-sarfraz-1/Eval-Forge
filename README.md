# EvalForge

**LLM-as-a-judge for your model's outputs.** Upload a dataset of responses → an LLM grades every one → get a shareable, single-screen report with scores, reasons, hallucination rate, and failing cases.

## How it works

Each row is routed to one of two judges automatically:

- **Rows with a `context`** → **RAG path** (Ragas): `faithfulness`, `context_recall`, `context_precision`, `answer_relevancy`.
- **Rows without a `context`** → **LLM path** (DeepEval G-Eval): `correctness`, `relevance`, `completeness`, `conciseness`.

Scores are 0–1. A row **passes only if every metric clears 0.5** — so one strong score can't mask a real failure (e.g. a hallucination). Faithfulness failures drive the reported **hallucination rate**.

Judge calls run with bounded concurrency and retry/backoff, so large datasets don't burst the provider's rate limit. Each run writes a per-run log to `backend/logs/run_<id>.log`.

## Bring your own key

EvalForge is BYO-key — any OpenAI-compatible provider works. Copy `.env.example` → `.env` and set:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=...          # OpenAI, Groq, Anthropic, OpenRouter, local vLLM/Ollama…
JUDGE_MODEL=...
```

Optional — trim metrics to cut cost/latency (unset = all):
```
LLM_METRICS=correctness,relevance
RAG_METRICS=faithfulness,answer_relevancy
```

## Run everything (one command)

```
docker compose up --build
```
- Frontend: http://localhost:3000  (upload `sample.csv`, hit Evaluate)
- API docs: http://localhost:8000/docs

Shortcuts (from root): `make up` (both services) · `make logs` · `make shell` · `make clean` · `make help`.

## Dataset format

CSV or JSON. Every row needs a non-empty `response`. `question`, `expected_answer`, and `context` are optional; `context` decides RAG vs LLM scoring. Limits: 5 MB, 1000 rows.

```csv
question,context,expected_answer,response
What is the capital of Japan?,Japan's capital is Tokyo.,Tokyo,The capital of Japan is Tokyo.
What is 5 times 6?,,30,30
```

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/datasets/upload` | Upload a CSV/JSON dataset |
| POST | `/datasets/{id}/run` | Kick off an evaluation (runs in background) |
| GET  | `/runs` | Run history |
| GET  | `/runs/{id}` | Full report (poll until `status` is `done`/`error`) |
| POST | `/runs/{id}/retry` | Re-run the whole evaluation in place |

## Layout

```
eval-forge/
  docker-compose.yml       # backend + frontend
  Dockerfile               # multi-target (backend / frontend)
  requirements.txt         # backend Python deps
  Makefile                 # dev shortcuts
  .env.example             # judge config (BYO key)
  sample.csv               # tiny dataset to test with
  backend/app/*.py         # FastAPI: main, evaluator, models, schemas, database
  frontend/                # Next.js app (single-screen dashboard report)
```

## Stack

FastAPI · SQLite (SQLAlchemy) · DeepEval · Ragas · sentence-transformers (local embeddings) · Next.js · Docker.
