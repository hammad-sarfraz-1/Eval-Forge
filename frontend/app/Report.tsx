// Report.tsx — renders a run's report. Shared by the home page (fresh eval)
// and /runs/[id] (a shareable link to a past run).
export default function Report({ run }: { run: any }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2>Overall score: {run.overall_score} / 100</h2>
      {run.hallucination_rate !== null && (
        <p>Hallucination rate: {run.hallucination_rate}% (rows failing faithfulness)</p>
      )}

      <h3>Failed cases ({run.failed_cases.length})</h3>
      {run.failed_cases.length === 0 ? <p>None.</p> : (
        <ul>
          {run.failed_cases.map((rs: any) => (
            <li key={rs.row_id}>Row {rs.row_id}: "{rs.question}" — avg {rs.avg_score}</li>
          ))}
        </ul>
      )}

      <h3>Best examples</h3>
      <ul>
        {run.best_examples.map((rs: any) => (
          <li key={rs.row_id}>Row {rs.row_id}: "{rs.question}" — avg {rs.avg_score}</li>
        ))}
      </ul>

      <h3>Worst examples</h3>
      <ul>
        {run.worst_examples.map((rs: any) => (
          <li key={rs.row_id}>Row {rs.row_id}: "{rs.question}" — avg {rs.avg_score}</li>
        ))}
      </ul>

      <h3>All results</h3>
      <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }} border={1}>
        <thead>
          <tr><th>Row</th><th>Metric</th><th>Score</th><th>Reason</th></tr>
        </thead>
        <tbody>
          {run.results.map((r: any, i: number) => (
            <tr key={i}>
              <td>{r.row_id}</td><td>{r.metric}</td><td>{r.score}</td><td>{r.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
