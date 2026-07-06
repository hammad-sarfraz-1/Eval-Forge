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

  // Poll a run until it stops being "running", updating the UI each tick.
  async function poll(id: number) {
    const r = await fetch(`${API}/runs/${id}`).then(res => res.json());
    setRun(r);
    if (r.status === "running") setTimeout(() => poll(id), 2000);
    else setStatus("");
  }

  async function handleEvaluate() {
    if (!file) return;
    try {
      // 1) upload the dataset
      setStatus("Uploading…");
      setRun(null);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/datasets/upload`, { method: "POST", body: form });
      const ds = await res.json();
      if (!res.ok) {  // validation rejected the file — show the reason
        setStatus(ds.detail ?? "Upload failed.");
        return;
      }

      // 2) kick off the evaluation (returns immediately, status "running")
      setStatus("Evaluating…");
      const started = await fetch(`${API}/datasets/${ds.id}/run`, { method: "POST" }).then(r => r.json());
      poll(started.id);
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
                {" — "}{r.status === "done" ? `${r.overall_score}/100` : r.status} — dataset {r.dataset_id} — {new Date(r.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
