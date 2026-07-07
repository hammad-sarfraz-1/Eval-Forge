# schemas.py — the shape of the JSON the API sends back (Pydantic models).
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DatasetOut(BaseModel):
    id: int
    name: str
    row_count: int


class ResultOut(BaseModel):
    row_id: int
    metric: str
    score: float
    reason: str

    class Config:
        from_attributes = True  # allow building this from an ORM object


class RowSummary(BaseModel):
    """One row's average score, for the failed/best/worst lists."""
    row_id: int
    question: Optional[str]
    response: Optional[str]
    avg_score: float
    passed: bool


class RunListItem(BaseModel):
    """One row in the run history list — no per-metric detail."""
    id: int
    dataset_id: int
    dataset_name: str
    overall_score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RunOut(BaseModel):
    id: int
    dataset_id: int
    dataset_name: str
    overall_score: float
    status: str                     # running | done | error
    error: Optional[str] = None
    hallucination_rate: Optional[float]  # % of RAG rows failing faithfulness
    rows: List[RowSummary]               # every row's summary (for grouped results)
    failed_cases: List[RowSummary]
    best_examples: List[RowSummary]
    worst_examples: List[RowSummary]
    results: List[ResultOut]

    class Config:
        from_attributes = True
