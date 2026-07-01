# schemas.py — the shape of the JSON the API sends back (Pydantic models).
from typing import List

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


class RunOut(BaseModel):
    id: int
    dataset_id: int
    overall_score: float
    results: List[ResultOut]

    class Config:
        from_attributes = True
