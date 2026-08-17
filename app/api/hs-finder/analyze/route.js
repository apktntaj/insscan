import { createHsFinderGeminiService } from "../../../infrastructure/services/hs-finder-gemini.service.js";
import { createAnalyzeProductFactsUseCase } from "@core/use-cases/analyze-product-facts.js";

export const maxDuration = 60;

const productFactsGateway = createHsFinderGeminiService(process.env.GEMINI_API_KEY);
const analyzeProductFacts = createAnalyzeProductFactsUseCase({ productFactsGateway });
const encoder = new TextEncoder();

function eventChunk(event, payload = {}) {
  return encoder.encode(`${JSON.stringify({ event, ...payload })}\n`);
}

function normalizeAnswers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 3).flatMap((item) => {
    if (typeof item?.question !== "string" || typeof item?.answer !== "string") return [];
    const question = item.question.trim().slice(0, 300);
    const answer = item.answer.trim().slice(0, 1000);
    return question && answer ? [{ question, answer }] : [];
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, errorMessage: "Permintaan tidak valid." }, { status: 400 });
  }

  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (description.length < 3 || description.length > 2000) {
    return Response.json(
      { ok: false, errorMessage: "Deskripsi harus berisi 3 sampai 2.000 karakter." },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(eventChunk("analysis_started"));
      try {
        const result = await analyzeProductFacts.execute({
          description,
          previousFacts: body?.previousFacts ?? null,
          answers: normalizeAnswers(body?.answers),
        });

        if (!result.ok) {
          controller.enqueue(eventChunk("error", {
            errorCode: result.error,
            errorMessage: result.error === "GEMINI_TIMEOUT"
              ? "Analisis detail barang memerlukan waktu terlalu lama. Silakan coba lagi."
              : "Detail barang belum dapat dianalisis. Silakan coba lagi.",
          }));
          return;
        }

        controller.enqueue(eventChunk("facts_extracted", { facts: result.data.facts }));
        if (result.data.missingFacts.length) {
          controller.enqueue(eventChunk("missing_facts_found", {
            missingFacts: result.data.missingFacts,
          }));
        }
        if (result.data.questions.length) {
          controller.enqueue(eventChunk("questions_ready", {
            questions: result.data.questions,
          }));
        }
        controller.enqueue(eventChunk("complete", { data: result.data }));
      } catch (error) {
        console.error("[hs-finder/analyze] Unexpected product-facts error:", error);
        controller.enqueue(eventChunk("error", {
          errorCode: "PRODUCT_FACTS_UNAVAILABLE",
          errorMessage: "Detail barang belum dapat dianalisis. Silakan coba lagi.",
        }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
