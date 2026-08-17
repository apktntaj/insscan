/**
 * HS Finder API Route
 * Infrastructure Layer — Next.js App Router endpoint
 *
 * POST /api/hs-finder
 *
 * Supported actions:
 *   - "find"           → classify item description text into an HS code
 *   - "identify_photo" → identify item from a photo using Gemini Vision
 *
 * Error handling:
 *   - Technical errors are logged server-side with console.error() (Req 8.6)
 *   - Only user-facing Bahasa Indonesia messages are sent to the client (Req 8.5)
 *
 * @module api/hs-finder
 */

import { createClassificationKnowledgeService } from "@/app/features/hs-finder/infrastructure/services/classification-knowledge.service";
import { createHsFinderGeminiService } from "@/app/features/hs-finder/infrastructure/services/hs-finder-gemini.service";
import {
  createFindHsCodeUseCase,
  type HsFinderGeminiService,
} from "@core/hs-finder/use-cases/find-hs-code";
import { createHsFinderController } from "@/app/features/hs-finder/adapters/controllers/hs-finder.controller";

/** Allow two sequential Gemini calls plus chapter-note loading. */
export const maxDuration = 120;

// ─────────────────────────────────────────────
// Dependency wiring
// ─────────────────────────────────────────────

/**
 * Wire all dependencies at module load time.
 * createChapterNoteLoaderService() has a module-level cache so it is safe to call once.
 * createHsFinderGeminiService() validates the API key internally — if the key is
 * missing or invalid it returns a no-op service that produces GEMINI_UNAVAILABLE errors.
 */
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  // Log at startup so it is visible in server logs immediately (Req 8.6)
  console.error(
    "[hs-finder] GEMINI_API_KEY is not set. " +
      "All /api/hs-finder requests will return GEMINI_UNAVAILABLE until the key is configured."
  );
}

const classificationKnowledge = createClassificationKnowledgeService();
interface PhotoIdentificationService {
  identifyFromPhoto(
    imageBase64: string,
    mimeType: string,
  ): Promise<
    | { ok: true; data: string }
    | { ok: false; error: string }
  >;
}

const hsFinderGeminiService = createHsFinderGeminiService(
  geminiApiKey ?? "",
) as unknown as HsFinderGeminiService & PhotoIdentificationService;
const findHsCodeUseCase = createFindHsCodeUseCase({
  hsFinderGeminiService,
  classificationKnowledge,
});
const controller = createHsFinderController({ findHsCodeUseCase, hsFinderGeminiService });

// ─────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────

/**
 * Handles POST /api/hs-finder.
 *
 * Expected request body (JSON):
 *   - action: "find"           → { action, text, source, clarificationAnswers? }
 *   - action: "identify_photo" → { action, imageBase64, mimeType }
 *
 * Responses:
 *   - 200 { ok: true,  data: ... }       — success
 *   - 400 { ok: false, errorMessage: ... } — invalid action or validation error
 *   - 500 { ok: false, errorMessage: ... } — unexpected server error
 *
 * @param {Request} req - Next.js App Router Request
 * @returns {Response}
 */
export async function POST(req: Request): Promise<Response> {
  let body: Record<string, any>;

  try {
    body = await req.json();
  } catch (err) {
    console.error("[hs-finder] Failed to parse request body:", err);
    return Response.json(
      { ok: false, errorMessage: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const { action } = body ?? {};

  try {
    // ── Route by action ────────────────────────────────────────────────────
    if (action === "find") {
      const result = await controller.handleFindHsCode(body);

      if (!result.ok) {
        return Response.json(
          { ok: false, errorCode: result.errorCode, errorMessage: result.errorMessage },
          { status: 400 }
        );
      }

      return Response.json({ ok: true, data: result.data }, { status: 200 });
    }

    if (action === "identify_photo") {
      const result = await controller.handleIdentifyPhoto(body);

      if (!result.ok) {
        return Response.json(
          { ok: false, errorCode: result.errorCode, errorMessage: result.errorMessage },
          { status: 400 }
        );
      }

      return Response.json({ ok: true, data: result.data }, { status: 200 });
    }

    // ── Unknown action ─────────────────────────────────────────────────────
    return Response.json(
      {
        ok: false,
        errorMessage: `Aksi tidak dikenal: "${action}". Gunakan "find" atau "identify_photo".`,
      },
      { status: 400 }
    );
  } catch (err) {
    // Log full technical error server-side only (Req 8.6)
    console.error("[hs-finder] Unexpected error while handling action:", action, err);

    // Return generic user-facing message in Bahasa Indonesia (Req 8.5)
    return Response.json(
      {
        ok: false,
        errorMessage: "Ada masalah dengan sistem AI. Hubungi administrator.",
      },
      { status: 500 }
    );
  }
}
