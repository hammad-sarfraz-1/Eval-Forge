// layout.tsx — wraps every page: fonts, global styles, nav and footer.
import "./globals.css";

export const metadata = { title: "EvalForge — LLM-as-a-Judge" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav>
          <div className="nav-inner">
            <a href="/" className="brand" style={{ textDecoration: "none" }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="#D97757" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 17l6 6 14-15" />
              </svg>
              <span className="brand-name">Eval<span className="accent">Forge</span></span>
            </a>
            <div className="nav-links">
              <a href="/">New Eval</a>
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API Docs</a>
            </div>
          </div>
        </nav>
        {children}
        <footer>
          <div className="tagline">EVALFORGE · LLM-AS-A-JUDGE · DEEPEVAL · RAGAS · FASTAPI · NEXT.JS · DOCKER</div>
        </footer>
      </body>
    </html>
  );
}
