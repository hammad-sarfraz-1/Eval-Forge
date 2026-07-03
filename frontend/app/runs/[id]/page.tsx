// runs/[id]/page.tsx — a stable, shareable URL for one past run's report.
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Report from "../../Report";

const API = "http://localhost:8000";

export default function RunPage() {
  const params = useParams();
  const [run, setRun] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/runs/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setRun)
      .catch(() => setError("Run not found — is the backend running on :8000?"));
  }, [params.id]);

  return (
    <main>
      <h1>EvalForge — Run #{params.id}</h1>
      {error && <p>{error}</p>}
      {run && <Report run={run} />}
    </main>
  );
}
