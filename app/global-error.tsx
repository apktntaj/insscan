"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="id">
      <body>
        <main style={{ margin: "4rem auto", maxWidth: "36rem", padding: "1.5rem", textAlign: "center" }}>
          <h1>Terjadi gangguan pada Pesisir</h1>
          <p>Silakan coba memuat ulang aplikasi.</p>
          <button type="button" onClick={() => retry()}>
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
