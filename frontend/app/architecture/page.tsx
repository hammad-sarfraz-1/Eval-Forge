// architecture/page.tsx — how EvalForge is built, in the DDRPRIV diagram style.
import type { ReactNode } from "react";

// ─── inline Lucide-style icons (no CDN dependency) ───
const PATHS: Record<string, ReactNode> = {
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></>,
  branch: <><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  scale: <><path d="M12 3v18" /><path d="M5 7h14" /><path d="m5 7-3 6h6z" /><path d="m19 7-3 6h6z" /><path d="M7 21h10" /></>,
  cpu: <><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M19 9h3M19 14h3M2 9h3M2 14h3" /></>,
  retry: <><path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9 9 0 0 0 6.36-2.64L21 16" /><path d="M21 21v-5h-5" /></>,
  chart: <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  server: <><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  box: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
};
function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PATHS[name]}</svg>
  );
}
const Down = () => <div className="arrow-v" />;

export default function Architecture() {
  return (
    <main>
      <div className="hero arch-hero">
        <div className="badge"><span className="dot" /> System design</div>
        <h1>How <span className="accent">EvalForge</span> works</h1>
        <p className="subtitle">
          A self-hostable LLM-as-a-judge: upload the responses your app already produced,
          score them with DeepEval and Ragas using your own key, and get a shareable report.
          Here is how a dataset travels from upload to a scored, shareable run.
        </p>
      </div>

      {/* ─── TECH STACK ─── */}
      <section className="arch-section">
        <div className="tech-split">
          <div className="tech-col">
            <h3><Icon name="code" size={20} /> Evaluation Engine</h3>
            <p className="blurb">The brain: routes each row to the right judge and turns scores into a report.</p>
            <div className="tech-tags">
              {["Python", "DeepEval (G-Eval)", "Ragas", "sentence-transformers", "Groq / OpenAI-compatible", "tenacity"].map(t => <span key={t} className="tech-tag">{t}</span>)}
            </div>
          </div>
          <div className="tech-col">
            <h3><Icon name="server" size={20} /> App &amp; Infrastructure</h3>
            <p className="blurb">The plumbing: async API, a shareable UI, and one command to self-host.</p>
            <div className="tech-tags">
              {["FastAPI", "Uvicorn", "SQLAlchemy", "SQLite", "Next.js", "TypeScript", "Docker Compose"].map(t => <span key={t} className="tech-tag">{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIFECYCLE DIAGRAM ─── */}
      <section className="arch-section">
        <div className="head">
          <h2><span className="num">1</span> End-to-End Evaluation Lifecycle</h2>
          <p>How an uploaded dataset flows through validation, the async runner, the two judge paths, and back to a shareable report.</p>
        </div>

        <div className="diagram">
          <div className="diag-box"><Icon name="monitor" /><strong>User Browser</strong><span>Uploads a CSV / JSON of responses</span></div>
          <Down />

          <div className="diag-group">
            <span className="diag-group-title">FastAPI + SQLAlchemy · Docker</span>

            <div className="diag-box highlight" style={{ width: 260 }}>
              <Icon name="shield" /><strong>Upload + Validation</strong>
              <span>≤ 5 MB · ≤ 1000 rows · every row needs a <code>response</code></span>
            </div>
            <Down />
            <div className="diag-box" style={{ width: 260 }}>
              <Icon name="database" /><strong>SQLite</strong>
              <span>Dataset · Rows · Runs · Results</span>
            </div>
            <Down />

            <div className="diag-group">
              <span className="diag-group-title">Background Runner · async</span>
              <div className="diag-box highlight" style={{ width: 280 }}>
                <Icon name="retry" /><strong>ThreadPoolExecutor ×4</strong>
                <span className="jargon">bounded concurrency + jittered backoff</span>
                <span>POST returns instantly (<code>status=running</code>); judge calls retry on 429/5xx</span>
              </div>
              <Down />
              <div className="diag-box" style={{ width: 280 }}>
                <Icon name="branch" /><strong>evaluate_row router</strong>
                <span>row has <code>context</code> → RAG · otherwise → LLM</span>
              </div>
              <Down />
              <div className="diag-row">
                <div className="diag-box highlight" style={{ width: 250 }}>
                  <Icon name="search" /><strong>Ragas (RAG)</strong>
                  <span>faithfulness · context recall / precision · answer relevancy</span>
                </div>
                <div className="diag-box highlight" style={{ width: 250 }}>
                  <Icon name="scale" /><strong>DeepEval G-Eval (LLM)</strong>
                  <span>correctness · relevance · completeness · conciseness</span>
                </div>
              </div>
              <Down />
              <div className="diag-box highlight" style={{ width: 320 }}>
                <Icon name="cpu" /><strong>Groq — Llama 3.3 70B</strong>
                <span className="jargon">BYO key · OpenAI-compatible</span>
                <span>LLM judge + local sentence-transformers embeddings</span>
              </div>
            </div>
          </div>

          <Down />
          <div className="diag-box" style={{ width: 300 }}>
            <Icon name="chart" /><strong>Report</strong>
            <span>overall score · hallucination rate · failed cases · best / worst</span>
          </div>
          <Down />
          <div className="diag-box highlight" style={{ width: 300 }}>
            <Icon name="monitor" /><strong>Next.js UI</strong>
            <span>polls status, then a stable shareable link at <code>/runs/&#123;id&#125;</code></span>
          </div>
        </div>
      </section>

      {/* ─── JUDGING ─── */}
      <section className="arch-section">
        <div className="head">
          <h2><span className="num">2</span> Two judges, one contract</h2>
          <p>EvalForge scores outputs you already produced — it never calls your app. Each row carries its own <code>response</code>; the evaluator just decides how to grade it.</p>
        </div>

        <div className="story-card">
          <h4><Icon name="branch" size={18} /> Routing: RAG vs. plain LLM</h4>
          <p>A single check in <code>evaluate_row</code> looks at whether the row has a <code>context</code>. If it does, the row is graded as retrieval-augmented generation with <strong>Ragas</strong> — faithfulness, context recall, context precision, answer relevancy. If not, it goes to <strong>DeepEval&apos;s G-Eval</strong> for correctness, relevance, completeness and conciseness. Same input shape, two rubrics.</p>
        </div>
        <div className="story-card">
          <h4><Icon name="chart" size={18} /> From scores to a report</h4>
          <p>Every metric returns a 0–1 score. A row <strong>passes only if every metric clears 0.5</strong> — averaging is deliberately avoided, so a strong answer-relevancy score can&apos;t mask a failed faithfulness check (a real hallucination). The report then surfaces the overall score, the hallucination rate (% of rows failing faithfulness), the failed cases, and the best / worst examples.</p>
        </div>
      </section>

      {/* ─── ROBUSTNESS ─── */}
      <section className="arch-section">
        <div className="head">
          <h2><span className="num">3</span> Robustness: surviving real datasets</h2>
          <p>A judge-heavy run of hundreds of rows will hammer a provider&apos;s rate limit. EvalForge is built so that never turns into a crash.</p>
        </div>

        <div className="story-card">
          <h4><Icon name="retry" size={18} /> Background runs + bounded concurrency</h4>
          <p><code>POST /datasets/&#123;id&#125;/run</code> returns immediately with <code>status=running</code> and schedules the work as a background task; the UI polls <code>GET /runs/&#123;id&#125;</code> until it&apos;s <code>done</code> or <code>error</code>. Judge calls run through a <code>ThreadPoolExecutor</code> capped at 4, so a 1000-row dataset doesn&apos;t burst the provider all at once.</p>
        </div>
        <div className="story-card">
          <h4><Icon name="check" size={18} /> Jittered retry &amp; clean failure</h4>
          <p>Each judge call is wrapped in <strong>tenacity</strong> with jittered exponential backoff on 429 / 5xx — the jitter decorrelates the four workers so they don&apos;t retry in lockstep. G-Eval metrics are rebuilt per row for thread-safety; the shared Ragas metrics get a lock-guarded lazy init. If a run genuinely fails, it surfaces as <code>status=error</code> with a message — never a 500.</p>
        </div>
        <div className="story-card">
          <h4><Icon name="box" size={18} /> One command to self-host</h4>
          <p>A single multi-stage <code>Dockerfile</code> builds both the <code>backend</code> and <code>frontend</code> targets; <code>docker compose up --build</code> brings up the whole stack. Bring your own key via <code>.env</code> — any OpenAI-compatible provider (Groq, OpenAI, local vLLM/Ollama) works.</p>
        </div>
      </section>
    </main>
  );
}
