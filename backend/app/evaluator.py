# evaluator.py — turns one row into metric scores using an LLM-as-a-judge.
#
# Uses DeepEval's G-Eval: an LLM scores each metric 0–1 and writes a reason.
# Bring your own key — set OPENAI_API_KEY (+ optional OPENAI_BASE_URL for any
# OpenAI-compatible provider, e.g. Groq) and JUDGE_MODEL. See .env.example.

import os

# Opt out of DeepEval's anonymous telemetry — this is a self-hosted tool.
# Must be set before importing deepeval.
os.environ.setdefault("DEEPEVAL_TELEMETRY_OPT_OUT", "YES")

from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

JUDGE_MODEL = os.getenv("JUDGE_MODEL", "gpt-4o-mini")

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

# Built on first use so the app can start (and serve uploads) with no key;
# the key is only required when you actually run an evaluation.
_metrics = None


def _get_metrics():
    global _metrics
    if _metrics is None:
        if not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError(
                "No judge API key. Set OPENAI_API_KEY (and JUDGE_MODEL) in .env "
                "— see .env.example. EvalForge is bring-your-own-key."
            )
        _metrics = [
            GEval(name=name, criteria=criteria,
                  evaluation_params=params, model=JUDGE_MODEL)
            for name, criteria, params in _METRIC_DEFS
        ]
    return _metrics


def evaluate_row(row):
    """Score every metric for one row -> list of (metric, score, reason)."""
    test_case = LLMTestCase(
        input=row.question or "",
        actual_output=row.response or "",
        expected_output=row.expected_answer or "",
    )
    out = []
    for (name, _, _), metric in zip(_METRIC_DEFS, _get_metrics()):
        metric.measure(test_case)
        out.append((name, round(metric.score, 3), metric.reason))
    return out
