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
    let stop = false;
    const load = () => {
      fetch(`${API}/runs/${params.id}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
          if (stop) return;
          setRun(data);
          if (data.status === "running") setTimeout(load, 2000);  // keep polling
        })
        .catch(() => setError("Run not found — is the backend running on :8000?"));
    };
    load();
    return () => { stop = true; };
  }, [params.id]);

  return (
    <main>
      <h1>EvalForge — Run #{params.id}</h1>
      {error && <p>{error}</p>}
      {run && <Report run={run} />}
    </main>
  );
}
