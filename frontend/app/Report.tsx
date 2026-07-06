// Report.tsx — renders a run's report. Shared by the home page (fresh eval)
// and /runs/[id] (a shareable link to a past run).
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

export default function Report({ run }: { run: any }) {
  if (run.status === "error")
    return <div className="card" style={{ borderColor: "var(--bad)" }}>
      <strong style={{ color: "var(--bad)" }}>Evaluation failed</strong>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>{run.error}</p>
    </div>;

  if (run.status === "running")
    return <div className="card status-line"><span className="spinner" /> Evaluating… scores appear here when the run finishes.</div>;

  return (
    <>
      <div className="card">
        <div className="score">
          <div><span className="num">{run.overall_score}</span><span className="den"> / 100</span></div>
          <div className="label">Overall score</div>
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
        <h3 className="section-title" style={{ marginTop: 0 }}>All results</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Row</th><th>Metric</th><th>Score</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {run.results.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.row_id}</td>
                  <td className="metric">{r.metric}</td>
                  <td>{r.score}</td>
                  <td className="reason">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
