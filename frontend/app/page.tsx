// page.tsx — the one screen: pick a file, evaluate, see the report + history.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Report from "./Report";

const API = "http://localhost:8000"; // the FastAPI backend

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [run, setRun] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [pastRuns, setPastRuns] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/runs`).then(r => r.json()).then(setPastRuns).catch(() => {});
  }, [run]);

  // Poll a run until it stops being "running", updating the UI each tick.
  async function poll(id: number) {
    const r = await fetch(`${API}/runs/${id}`).then(res => res.json());
    setRun(r);
    if (r.status === "running") setTimeout(() => poll(id), 2000);
    else { setStatus(""); setBusy(false); }
  }

  async function handleEvaluate() {
    if (!file) return;
    try {
      setBusy(true);
      setStatus("Uploading…");
      setRun(null);
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/datasets/upload`, { method: "POST", body: form });
      const ds = await res.json();
      if (!res.ok) { setStatus(ds.detail ?? "Upload failed."); setBusy(false); return; }

      setStatus("Evaluating…");
      const started = await fetch(`${API}/datasets/${ds.id}/run`, { method: "POST" }).then(r => r.json());
      poll(started.id);
    } catch {
      setStatus("Something went wrong — is the backend running on :8000?");
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="hero">
        <div className="badge"><span className="dot"></span> LLM-as-a-Judge</div>
        <h1>Eval<span className="accent">Forge</span></h1>
        <p className="subtitle">
          Upload a dataset of model responses, judge it with an LLM (DeepEval + Ragas),
          and get a shareable scored report — correctness, faithfulness, hallucinations and more.
        </p>
      </div>

      <div className="card">
        <div className="upload-row">
          <label className="btn btn-secondary">
            Choose file
            <input type="file" accept=".csv,.json" hidden
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <span className="file-name">{file ? file.name : "No file selected (CSV/JSON, each row needs a response)"}</span>
          <button className="btn btn-primary" onClick={handleEvaluate} disabled={!file || busy} style={{ marginLeft: "auto" }}>
            {busy ? "Running…" : "Evaluate"}
          </button>
        </div>
        {status && (
          <div className="status-line">
            {busy && <span className="spinner" />} {status}
          </div>
        )}
      </div>

      {run && <Report run={run} onUpdate={setRun} />}

      <h2 className="section-title">Run history</h2>
      {pastRuns.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No runs yet.</p>
      ) : (
        <ul className="history">
          {pastRuns.map((r: any) => (
            <li key={r.id}>
              <span>
                <Link href={`/runs/${r.id}`} className="run-id">{r.dataset_name}</Link>
                <span className="meta"> · Run #{r.id} · {new Date(r.created_at).toLocaleString()}</span>
              </span>
              {r.status === "done"
                ? <span className="pill done">{r.overall_score}/100</span>
                : <span className={`pill ${r.status}`}>{r.status}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
