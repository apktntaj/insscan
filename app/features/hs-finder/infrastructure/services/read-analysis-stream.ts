import {
  makeProductFactsAnalysis,
  type ProductFactsAnalysis,
} from "@core/hs-finder/domain/product-facts";

/** Reads and validates the terminal event from the product-facts NDJSON response. */
export async function readAnalysisStream(
  response: Response,
): Promise<ProductFactsAnalysis> {
  if (!response.ok) {
    throw new Error(`Analisis gagal (${response.status}).`);
  }
  if (!response.body) {
    throw new Error("Respons analisis tidak memiliki stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      const parsed: unknown = JSON.parse(line);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed) ||
        !("event" in parsed) ||
        typeof parsed.event !== "string"
      ) {
        throw new Error("Respons analisis tidak valid.");
      }

      if (parsed.event === "error") {
        const errorMessage = "errorMessage" in parsed ? parsed.errorMessage : undefined;
        throw new Error(
          typeof errorMessage === "string"
            ? errorMessage
            : "Detail barang belum dapat dianalisis. Silakan coba lagi.",
        );
      }
      if (parsed.event === "complete") {
        const data = "data" in parsed ? parsed.data : null;
        const rawFacts = (
          typeof data === "object" &&
          data !== null &&
          !Array.isArray(data)
        )
          ? data as Record<string, unknown>
          : null;
        const analysis = makeProductFactsAnalysis(rawFacts);
        if (!analysis.ok) {
          throw new Error("Respons analisis tidak valid.");
        }
        return analysis.data;
      }
    }

    if (done) break;
  }

  throw new Error("Stream analisis berakhir tanpa hasil.");
}
