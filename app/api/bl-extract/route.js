import { createGeminiService } from "../../infrastructure/services/gemini.service";
import { createExtractBLWithGeminiUseCase } from "@core/use-cases/extract-bl-with-gemini";

export const maxDuration = 60;

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const serverUsageTracker = {
  canExtract: async () => ({ ok: true }),
  incrementUsage: async () => {},
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("file");
    const text = String(formData.get("text") || "");

    if (!(pdfFile instanceof File) || pdfFile.type !== "application/pdf") {
      return Response.json(
        { ok: false, error: { code: "INVALID_FILE", message: "File harus berformat PDF." } },
        { status: 400 }
      );
    }
    if (pdfFile.size > MAX_PDF_BYTES) {
      return Response.json(
        { ok: false, error: { code: "FILE_TOO_LARGE", message: "Ukuran PDF maksimum 10 MB." } },
        { status: 413 }
      );
    }

    const service = createGeminiService(process.env.GEMINI_API_KEY);
    const useCase = createExtractBLWithGeminiUseCase(service, serverUsageTracker);
    const result = await useCase.execute(text, pdfFile);
    return Response.json(result, { status: result.ok ? 200 : 502 });
  } catch (error) {
    console.error("[bl-extract] Unexpected extraction error:", error);
    return Response.json(
      { ok: false, error: { code: "API_ERROR", message: "File tidak bisa diproses. Coba lagi atau isi manual." } },
      { status: 500 }
    );
  }
}
