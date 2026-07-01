// page.tsx — the one screen: pick a file, evaluate, see the report.
"use client";
import { useState } from "react";

const API = "http://localhost:8000"; // the FastAPI backend

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [run, setRun] = useState<any>(null);
  const [status, setStatus] = useState("");

  async function handleEvaluate() {
    if (!file) return;
    try {
      // 1) upload the dataset
      setStatus("Uploading…");
      const form = new FormData();
      form.append("file", file);
      const ds = await fetch(`${API}/datasets/upload`, { method: "POST", body: form }).then(r => r.json());

      // 2) run the evaluation on it
      setStatus("Evaluating…");
      const result = await fetch(`${API}/datasets/${ds.id}/run`, { method: "POST" }).then(r => r.json());

      setRun(result);
      setStatus("");
    } catch {
      setStatus("Something went wrong — is the backend running on :8000?");
    }
  }

  return (
    <main>
      <h1>EvalForge</h1>
      <p>Upload a CSV/JSON dataset (each row needs a <code>response</code>).</p>

      <input type="file" accept=".csv,.json" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <button onClick={handleEvaluate} disabled={!file} style={{ marginLeft: 8 }}>
        Evaluate
      </button>
      {status && <p>{status}</p>}

      {run && (
        <section style={{ marginTop: 24 }}>
          <h2>Overall score: {run.overall_score} / 100</h2>
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
      )}
    </main>
  );
}
