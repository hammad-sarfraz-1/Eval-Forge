// layout.tsx — wraps every page. Just basic page styling here.
export const metadata = { title: "EvalForge" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", maxWidth: 760, margin: "40px auto", padding: 16 }}>
        {children}
      </body>
    </html>
  );
}
