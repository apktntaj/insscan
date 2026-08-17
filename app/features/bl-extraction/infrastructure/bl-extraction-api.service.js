/** Sends BL content to the server without exposing the Gemini API key. */
export async function extractBlViaApi(text, pdfFile) {
  const body = new FormData();
  body.append("file", pdfFile);
  body.append("text", text || "");

  const response = await fetch("/api/bl-extract", { method: "POST", body });
  const payload = await response.json().catch(() => null);
  if (payload) return payload;
  return {
    ok: false,
    error: { code: "API_ERROR", message: "File tidak bisa diproses. Coba lagi atau isi manual." },
  };
}
