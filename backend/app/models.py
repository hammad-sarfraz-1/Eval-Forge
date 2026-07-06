# models.py — database tables, written as Python classes (SQLAlchemy ORM).
from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Dataset(Base):
    """An uploaded file of test cases."""
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    rows = relationship("Row", back_populates="dataset")


class Row(Base):
    """One test case. 'response' is the output we judge (you upload it)."""
    __tablename__ = "rows"
    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    question = Column(Text)
    context = Column(Text)
    expected_answer = Column(Text)
    response = Column(Text)
    dataset = relationship("Dataset", back_populates="rows")


class Run(Base):
    """One evaluation of a dataset."""
    __tablename__ = "runs"
    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    overall_score = Column(Float)  # 0–100
    status = Column(String, default="running")  # running | done | error
    error = Column(Text, nullable=True)         # message when status == error
    created_at = Column(DateTime, default=datetime.utcnow)
    results = relationship("Result", back_populates="run")


class Result(Base):
    """One metric score for one row, inside a run."""
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    run_id = Column(Integer, ForeignKey("runs.id"))
    row_id = Column(Integer, ForeignKey("rows.id"))
    metric = Column(String)  # e.g. "correctness"
    score = Column(Float)    # 0–1
    reason = Column(Text)
    run = relationship("Run", back_populates="results")
