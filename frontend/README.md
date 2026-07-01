# EvalForge — Frontend (Next.js)

A single page: upload a dataset → evaluate → see the report.

## Folder layout
```
frontend/
  app/
    layout.tsx   # page shell + styling
    page.tsx     # the screen (upload + results) — start here
  package.json
```

## Run (Docker — from the project root)
```
docker compose up --build
```
Open http://localhost:3000 (the backend starts automatically).
