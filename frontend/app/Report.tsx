// Report.tsx — renders a run's report. Shared by the home page (fresh eval)
// and /runs/[id] (a shareable link to a past run).
"use client";
import { useState } from "react";

const API = "http://localhost:8000";

function ExampleList({ rows }: { rows: any[] }) {
  return (
    <ul className="ex-list">
      {rows.map((rs: any) => (
        <li key={rs.row_id}>
          <span className="sc">{rs.avg_score}</span>
          <span className="rid">Row {rs.row_id}</span> — {rs.question || <em>(no question)</em>}
        </li>
      ))}
    </ul>
  );
}

export default function Report({ run, onUpdate }: { run: any; onUpdate?: (run: any) => void }) {
  const [busy, setBusy] = useState(false);

  // Re-run the whole evaluation on this same run, then poll until it finishes.
  async function retry() {
    if (!onUpdate) return;
    setBusy(true);
    try {
      const started = await fetch(`${API}/runs/${run.id}/retry`, { method: "POST" }).then(r => r.json());
      onUpdate(started);
      const poll = async () => {
        const r = await fetch(`${API}/runs/${run.id}`).then(res => res.json());
        onUpdate(r);
        if (r.status === "running") setTimeout(poll, 2000);
      };
      poll();
    } finally {
      setBusy(false);
    }
  }

  const RetryButton = onUpdate ? (
    <button className="retry-btn" onClick={retry} disabled={busy || run.status === "running"}>
      {run.status === "running" ? "Running…" : busy ? "Retrying…" : "Retry run"}
    </button>
  ) : null;

  if (run.status === "error")
    return <div className="card" style={{ borderColor: "var(--bad)" }}>
      <strong style={{ color: "var(--bad)" }}>Evaluation failed</strong>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>{run.error}</p>
      {RetryButton}
    </div>;

  if (run.status === "running")
    return <div className="card status-line"><span className="spinner" /> Evaluating… scores appear here when the run finishes.</div>;

  return (
    <>
      <div className="card">
        <div className="score">
          <div><span className="num">{run.overall_score}</span><span className="den"> / 100</span></div>
          <div className="label">Overall score</div>
          {RetryButton}
        </div>
        <div className="stats">
          <div className="stat">
            <div className="k">Hallucination rate</div>
            <div className="v">{run.hallucination_rate === null ? "—" : `${run.hallucination_rate}%`}</div>
          </div>
          <div className="stat">
            <div className="k">Failed cases</div>
            <div className="v">{run.failed_cases.length}</div>
          </div>
          <div className="stat">
            <div className="k">Rows evaluated</div>
            <div className="v">{new Set(run.results.map((r: any) => r.row_id)).size}</div>
          </div>
        </div>
      </div>

      {run.failed_cases.length > 0 && (
        <div className="card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Failed cases ({run.failed_cases.length})</h3>
          <ExampleList rows={run.failed_cases} />
        </div>
      )}

      <div className="card">
        <h3 className="section-title" style={{ marginTop: 0 }}>Best examples</h3>
        <ExampleList rows={run.best_examples} />
        <h3 className="section-title">Worst examples</h3>
        <ExampleList rows={run.worst_examples} />
      </div>

      <div className="card">
        <h3 className="section-title" style={{ marginTop: 0 }}>All results ({run.rows.length} rows)</h3>
        {run.rows.map((row: any) => {
          const metrics = run.results.filter((r: any) => r.row_id === row.row_id);
          return (
            <details className="row-block" key={row.row_id}>
              <summary>
                <span className="rid">#{row.row_id}</span>
                <span className="q">{row.question || <em>(no question)</em>}</span>
                <span className="chips">
                  {metrics.map((m: any) => (
                    <span key={m.metric} className={`chip ${m.score >= 0.5 ? "ok" : "bad"}`} title={m.metric}>
                      {m.metric.replace(/_/g, " ")} {m.score}
                    </span>
                  ))}
                </span>
                <span className={`verdict ${row.passed ? "ok" : "bad"}`}>{row.passed ? "PASS" : "FAIL"}</span>
              </summary>
              <div className="reasons">
                {metrics.map((m: any) => (
                  <div className="reason-row" key={m.metric}>
                    <span className={`metric ${m.score >= 0.5 ? "ok" : "bad"}`}>{m.metric.replace(/_/g, " ")} · {m.score}</span>
                    <p className="reason">{m.reason}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
