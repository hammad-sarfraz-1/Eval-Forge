# EvalForge

Upload a dataset (with responses) → judge it → get a scored report.

## Layout
```
eval-forge/
  docker-compose.yml
  Dockerfile.backend     # backend image
  requirements.txt       # backend Python deps
  Makefile               # backend shortcuts
  sample.csv             # tiny dataset to test with
  backend/app/*.py       # FastAPI source code (only)
  frontend/              # Next.js app
```

## Run everything (one command)
```
docker compose up --build
```
- Frontend: http://localhost:3000  (upload `sample.csv`, hit Evaluate)
- API docs: http://localhost:8000/docs

Backend-only shortcuts (from root): `make up` · `make logs` · `make shell` · `make clean` · `make help`.

The judge is currently a STUB (text overlap, no API key needed) — see `backend/app/evaluator.py`.
