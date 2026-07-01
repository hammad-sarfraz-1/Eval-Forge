# main.py — the FastAPI app: connects the HTTP routes to the DB + evaluator.
import csv
import io
import json

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, evaluator
from .database import engine, get_db, Base

# Create the SQLite tables on startup (no migration tool needed for a basic app).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EvalForge API")

# Allow the Next.js frontend (localhost:3000) to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _parse_upload(filename: str, raw: bytes) -> list[dict]:
    """Read CSV or JSON bytes into a list of row dicts."""
    text = raw.decode("utf-8")
    if filename.endswith(".json"):
        data = json.loads(text)
        return data if isinstance(data, list) else [data]
    if filename.endswith(".csv"):
        return list(csv.DictReader(io.StringIO(text)))
    raise HTTPException(400, "Please upload a .csv or .json file")


@app.post("/datasets/upload", response_model=schemas.DatasetOut)
def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a dataset. Each row should have a 'response' to be judged."""
    rows = _parse_upload(file.filename, file.file.read())

    dataset = models.Dataset(name=file.filename)
    db.add(dataset)
    db.flush()  # assigns dataset.id before we attach rows to it

    for r in rows:
        db.add(models.Row(
            dataset_id=dataset.id,
            question=r.get("question"),
            context=r.get("context"),
            expected_answer=r.get("expected_answer"),
            response=r.get("response"),
        ))
    db.commit()
    return schemas.DatasetOut(id=dataset.id, name=dataset.name, row_count=len(rows))


@app.post("/datasets/{dataset_id}/run", response_model=schemas.RunOut)
def run_evaluation(dataset_id: int, db: Session = Depends(get_db)):
    """Evaluate every row in a dataset, store the scores, return the report."""
    rows = db.query(models.Row).filter(models.Row.dataset_id == dataset_id).all()
    if not rows:
        raise HTTPException(404, "Dataset not found or empty")

    run = models.Run(dataset_id=dataset_id, overall_score=0.0)
    db.add(run)
    db.flush()  # assigns run.id

    scores = []
    for row in rows:
        for metric, score, reason in evaluator.evaluate_row(row):
            scores.append(score)
            db.add(models.Result(
                run_id=run.id, row_id=row.id,
                metric=metric, score=score, reason=reason,
            ))

    # Overall = average of all metric scores, scaled to 0–100.
    run.overall_score = round(100 * sum(scores) / len(scores), 1)
    db.commit()
    db.refresh(run)
    return run


@app.get("/runs/{run_id}", response_model=schemas.RunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    """Fetch a finished run (the shareable report)."""
    run = db.get(models.Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return run
