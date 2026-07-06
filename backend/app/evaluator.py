# evaluator.py — turns one row into metric scores using an LLM-as-a-judge.
#
# Rows with a `context` are scored as RAG (Ragas: faithfulness, context
# recall/precision, answer relevancy). Rows without go through the general
# LLM judge (DeepEval G-Eval: correctness, relevance, completeness,
# conciseness). Bring your own key — set OPENAI_API_KEY (+ optional
# OPENAI_BASE_URL for any OpenAI-compatible provider, e.g. Groq) and
# JUDGE_MODEL. See .env.example.

import os
import threading

# Opt out of DeepEval's anonymous telemetry — this is a self-hosted tool.
# Must be set before importing deepeval.
os.environ.setdefault("DEEPEVAL_TELEMETRY_OPT_OUT", "YES")

import openai
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from openai import AsyncOpenAI
from ragas.embeddings import HuggingFaceEmbeddings
from ragas.llms import llm_factory
from ragas.metrics.collections import (
    AnswerRelevancy, ContextPrecision, ContextRecall, Faithfulness,
)
from tenacity import (RetryError, retry, retry_if_exception_type,
                      stop_after_attempt, wait_random_exponential)

# Provider errors worth retrying with backoff: rate limits (429) and 5xx.
# DeepEval/Ragas wrap their own exhausted retries in tenacity.RetryError.
_RETRY_EXC = (RetryError, openai.RateLimitError, openai.APIError,
              openai.APIConnectionError, openai.APITimeoutError)


@retry(reraise=True, retry=retry_if_exception_type(_RETRY_EXC),
       wait=wait_random_exponential(multiplier=1, max=60),
       stop=stop_after_attempt(8))
def _with_backoff(fn, *args, **kwargs):
    """Call a judge/metric fn, retrying with jittered backoff on 429/5xx.
    Jitter decorrelates parallel workers so they don't retry in lockstep."""
    return fn(*args, **kwargs)

JUDGE_MODEL = os.getenv("JUDGE_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Each metric is a plain-English rubric the judge reasons over.
# (name, criteria, params it is allowed to read).
_P = LLMTestCaseParams
_METRIC_DEFS = [
    ("correctness",
     "Is the actual output factually correct and consistent with the expected "
     "output, with no contradictions?",
     [_P.INPUT, _P.ACTUAL_OUTPUT, _P.EXPECTED_OUTPUT]),
    ("relevance",
     "Does the actual output directly address the input question?",
     [_P.INPUT, _P.ACTUAL_OUTPUT]),
    ("completeness",
     "Does the actual output cover the key information in the expected output "
     "needed to fully answer the input?",
     [_P.INPUT, _P.ACTUAL_OUTPUT, _P.EXPECTED_OUTPUT]),
    ("conciseness",
     "Is the actual output free of unnecessary or redundant content while still "
     "answering the input?",
     [_P.INPUT, _P.ACTUAL_OUTPUT]),
]

METRICS = [name for name, _, _ in _METRIC_DEFS]


def _require_key():
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError(
            "No judge API key. Set OPENAI_API_KEY (and JUDGE_MODEL) in .env "
            "— see .env.example. EvalForge is bring-your-own-key."
        )


def _build_llm_metrics():
    # Fresh GEval objects per call — GEval stores score/reason on itself, so
    # sharing instances across parallel rows would corrupt results.
    _require_key()
    return [
        GEval(name=name, criteria=criteria,
              evaluation_params=params, model=JUDGE_MODEL)
        for name, criteria, params in _METRIC_DEFS
    ]


def _evaluate_llm_row(row):
    test_case = LLMTestCase(
        input=row.question or "",
        actual_output=row.response or "",
        expected_output=row.expected_answer or "",
    )
    out = []
    for (name, _, _), metric in zip(_METRIC_DEFS, _build_llm_metrics()):
        _with_backoff(metric.measure, test_case)
        out.append((name, round(metric.score, 3), metric.reason))
    return out


# Built on first use and shared across rows. Safe to share: the embeddings
# model and LLM client are read-only for inference, and each .score() call
# returns its result rather than mutating the metric. A lock guards the lazy
# build so parallel rows don't race to construct it (or reload the model).
_rag_metrics = None
_rag_lock = threading.Lock()


def _get_rag_metrics():
    global _rag_metrics
    if _rag_metrics is None:
        with _rag_lock:
            if _rag_metrics is None:
                _require_key()
                client = AsyncOpenAI(
                    base_url=os.getenv("OPENAI_BASE_URL") or None,
                    api_key=os.getenv("OPENAI_API_KEY"),
                )
                llm = llm_factory(JUDGE_MODEL, provider="openai", client=client)
                embeddings = HuggingFaceEmbeddings(model=EMBEDDING_MODEL)
                _rag_metrics = {
                    "faithfulness": Faithfulness(llm=llm),
                    "context_recall": ContextRecall(llm=llm),
                    "context_precision": ContextPrecision(llm=llm),
                    "answer_relevancy": AnswerRelevancy(llm=llm, embeddings=embeddings),
                }
    return _rag_metrics


def _evaluate_rag_row(row):
    question = row.question or ""
    response = row.response or ""
    expected = row.expected_answer or ""
    contexts = [row.context]
    kwargs_by_metric = {
        "faithfulness": dict(user_input=question, response=response,
                              retrieved_contexts=contexts),
        "context_recall": dict(user_input=question, retrieved_contexts=contexts,
                                reference=expected),
        "context_precision": dict(user_input=question, reference=expected,
                                   retrieved_contexts=contexts),
        "answer_relevancy": dict(user_input=question, response=response),
    }
    out = []
    for name, metric in _get_rag_metrics().items():
        result = _with_backoff(metric.score, **kwargs_by_metric[name])
        # Most Ragas metrics are computed numerically and don't produce a
        # natural-language reason (unlike G-Eval) — say so plainly.
        reason = result.reason or f"Computed via Ragas {name} (no explanation for this metric)."
        out.append((name, round(result.value, 3), reason))
    return out


def evaluate_row(row):
    """Score every metric for one row -> list of (metric, score, reason)."""
    if row.context:
        return _evaluate_rag_row(row)
    return _evaluate_llm_row(row)
