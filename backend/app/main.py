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


PASS_THRESHOLD = 0.5  # a row/metric below this counts as failed


def _build_report(db: Session, run: models.Run) -> schemas.RunOut:
    """Assemble the full report (hallucination rate, failed/best/worst) for a run."""
    results = db.query(models.Result).filter(models.Result.run_id == run.id).all()

    by_row = {}
    for r in results:
        by_row.setdefault(r.row_id, []).append(r)

    row_summaries = []
    faithfulness_scores = []
    for row_id, row_results in by_row.items():
        row = db.get(models.Row, row_id)
        scores = [r.score for r in row_results]
        avg_score = round(sum(scores) / len(scores), 3)
        # A row only passes if EVERY metric clears the threshold — averaging
        # would let a strong score (e.g. answer_relevancy) mask a real
        # failure on another (e.g. faithfulness = a hallucination).
        passed = all(s >= PASS_THRESHOLD for s in scores)
        row_summaries.append(schemas.RowSummary(
            row_id=row_id, question=row.question, response=row.response,
            avg_score=avg_score, passed=passed,
        ))
        faithfulness_scores += [r.score for r in row_results if r.metric == "faithfulness"]

    hallucination_rate = None
    if faithfulness_scores:
        failing = sum(1 for s in faithfulness_scores if s < PASS_THRESHOLD)
        hallucination_rate = round(100 * failing / len(faithfulness_scores), 1)

    ranked = sorted(row_summaries, key=lambda rs: rs.avg_score, reverse=True)

    return schemas.RunOut(
        id=run.id,
        dataset_id=run.dataset_id,
        overall_score=run.overall_score,
        hallucination_rate=hallucination_rate,
        failed_cases=[rs for rs in row_summaries if not rs.passed],
        best_examples=ranked[:3],
        worst_examples=ranked[-3:][::-1],
        results=[schemas.ResultOut.model_validate(r) for r in results],
    )


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
    return _build_report(db, run)


@app.get("/runs", response_model=list[schemas.RunListItem])
def list_runs(db: Session = Depends(get_db)):
    """List past runs, most recent first (run history)."""
    return db.query(models.Run).order_by(models.Run.created_at.desc()).all()


@app.get("/runs/{run_id}", response_model=schemas.RunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    """Fetch a finished run (the shareable report)."""
    run = db.get(models.Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return _build_report(db, run)
