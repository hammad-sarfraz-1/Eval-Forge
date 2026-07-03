// page.tsx — the one screen: pick a file, evaluate, see the report.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Report from "./Report";

const API = "http://localhost:8000"; // the FastAPI backend

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [run, setRun] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [pastRuns, setPastRuns] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/runs`).then(r => r.json()).then(setPastRuns).catch(() => {});
  }, [run]);

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

      {run && <Report run={run} />}

      <section style={{ marginTop: 40 }}>
        <h2>Past runs</h2>
        {pastRuns.length === 0 ? <p>No runs yet.</p> : (
          <ul>
            {pastRuns.map((r: any) => (
              <li key={r.id}>
                <Link href={`/runs/${r.id}`}>Run #{r.id}</Link>
                {" — "}{r.overall_score}/100 — dataset {r.dataset_id} — {new Date(r.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
