/**
 * HS Finder Controller
 * Interface Adapters Layer
 *
 * Handles two request types for the HS Finder feature:
 *   - handleFindHsCode: validate text input → build ItemDescription → run classification use case
 *   - handleIdentifyPhoto: validate photo → send to Gemini Vision → return item description text
 *
 * All methods return an ApiResponse shape — no throws.
 *
 * @module adapters/controllers/hs-finder
 */

import { makeItemDescription } from "@core/entities/hs-finder.js";

// ─────────────────────────────────────────────
// Constants — photo validation
// ─────────────────────────────────────────────

/** Supported MIME types for photo upload (Req 2.1) */
const SUPPORTED_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Max base64 length corresponding to 5 MB of binary data.
 * base64 encoding inflates size by ~4/3, so: 5 * 1024 * 1024 * (4/3) ≈ 6_981_506
 * Using a rounded conservative cap: 5 MB × 4/3 = 6_710_887
 *
 * Req 2.2: limit photo size to 5 MB
 */
const MAX_PHOTO_BASE64_LENGTH = Math.ceil(5 * 1024 * 1024 * (4 / 3));

// ─────────────────────────────────────────────
// Error Registry (user-facing messages)
// ─────────────────────────────────────────────

const ERROR_MESSAGES = {
  INPUT_TOO_SHORT: "Deskripsi barang terlalu singkat.",
  INPUT_TOO_LONG: "Deskripsi terlalu panjang (maksimum 2.000 karakter).",
  PHOTO_TOO_LARGE: "Foto terlalu besar (maksimum 5MB).",
  PHOTO_UNSUPPORTED_FORMAT: "Format foto tidak didukung. Gunakan JPEG, PNG, atau WEBP.",
  PHOTO_UNIDENTIFIABLE:
    "Foto tidak dapat diidentifikasi. Coba foto yang lebih jelas atau ketik deskripsi barang secara manual.",
  NO_CANDIDATE_CHAPTERS:
    "Deskripsi barang tidak cukup jelas untuk mengidentifikasi bab HS yang relevan. Coba tambahkan detail material, fungsi, atau bentuk barang.",
  GEMINI_UNAVAILABLE: "Ada masalah dengan sistem AI. Hubungi administrator.",
  GEMINI_TIMEOUT: "Koneksi AI terputus. Silakan coba lagi.",
  GEMINI_INVALID_RESPONSE: "Respons AI tidak valid. Silakan coba lagi.",
};

/**
 * Maps an error code to the corresponding user-facing Bahasa Indonesia message.
 * Falls back to GEMINI_UNAVAILABLE for unknown codes.
 *
 * @param {string} errorCode
 * @returns {string}
 *
 * @example
 * getErrorMessage("PHOTO_TOO_LARGE")
 * // => "Foto terlalu besar (maksimum 5MB)."
 *
 * @example
 * getErrorMessage("UNKNOWN_CODE")
 * // => "Ada masalah dengan sistem AI. Hubungi administrator."
 */
function getErrorMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.GEMINI_UNAVAILABLE;
}

/**
 * Builds an error ApiResponse from an error code.
 *
 * @param {string} errorCode
 * @returns {{ ok: false, errorCode: string, errorMessage: string }}
 *
 * @example
 * makeErrorResponse("PHOTO_TOO_LARGE")
 * // => { ok: false, errorCode: "PHOTO_TOO_LARGE", errorMessage: "Foto terlalu besar (maksimum 5MB)." }
 */
function makeErrorResponse(errorCode) {
  return { ok: false, errorCode, errorMessage: getErrorMessage(errorCode) };
}

// ─────────────────────────────────────────────
// createHsFinderController (factory)
// ─────────────────────────────────────────────

/**
 * Creates the HS Finder controller with injected dependencies.
 *
 * @param {Object} deps
 * @param {{ execute: (input: { itemDescription: import('../../core/entities/hs-finder').ItemDescription }) => Promise<import('../../core/use-cases/find-hs-code').FindHsCodeResult> }} deps.findHsCodeUseCase
 *   - Use case for classifying an item description into a HS code
 * @param {{ identifyFromPhoto: (imageBase64: string, mimeType: string) => Promise<{ ok: boolean, data?: string, error?: string }> }} deps.hsFinderGeminiService
 *   - Gemini service for photo identification
 * @returns {{ handleFindHsCode: Function, handleIdentifyPhoto: Function }}
 *
 * @example
 * const controller = createHsFinderController({ findHsCodeUseCase, hsFinderGeminiService });
 * const res = await controller.handleFindHsCode({ text: "laptop 14 inci", source: "text" });
 * // => { ok: true, data: { hsCode: "847130", ... } }
 *
 * @example
 * const controller = createHsFinderController({ findHsCodeUseCase, hsFinderGeminiService });
 * const res = await controller.handleIdentifyPhoto({ imageBase64: "...", mimeType: "image/jpeg" });
 * // => { ok: true, data: { itemDescription: "Laptop 14 inci dengan casing aluminium..." } }
 */
export function createHsFinderController({ findHsCodeUseCase, hsFinderGeminiService }) {
  // ─────────────────────────────────────────────
  // handleFindHsCode
  // ─────────────────────────────────────────────

  /**
   * Validates the request body, builds an ItemDescription via the entity factory,
   * runs the FindHsCode use case, and returns an ApiResponse.
   *
   * Input validation (Req 1.2, 1.3, 1.4, 1.5) is delegated to makeItemDescription()
   * which trims whitespace and enforces min 3 / max 2000 character constraints.
   *
   * @param {{ text: string, source: "text" | "photo" }} requestBody
   * @returns {Promise<{ ok: true, data: import('../../core/entities/hs-finder').ClassificationResult } | { ok: false, errorCode: string, errorMessage: string }>}
   *
   * @example
   * await controller.handleFindHsCode({ text: "laptop 14 inci prosesor Intel", source: "text" })
   * // => { ok: true, data: { hsCode: "847130", description: "...", reasoningPath: [...], coverageMap: {...} } }
   *
   * @example
   * await controller.handleFindHsCode({ text: "ok", source: "text" })
   * // => { ok: false, errorCode: "INPUT_TOO_SHORT", errorMessage: "Deskripsi barang terlalu singkat." }
   */
  async function handleFindHsCode(requestBody) {
    const { text, source } = requestBody ?? {};

    // Guard: text must be a string
    if (typeof text !== "string") {
      return makeErrorResponse("INPUT_TOO_SHORT");
    }

    // Guard: source must be valid
    const validSources = new Set(["text", "photo"]);
    const normalizedSource = validSources.has(source) ? source : "text";

    // Validate + normalise via entity factory (Req 1.2 – 1.5)
    const itemDescResult = makeItemDescription(text, normalizedSource);

    if (!itemDescResult.ok) {
      // Map entity error message to the nearest error code
      const errorCode = itemDescResult.error.includes("terlalu singkat")
        ? "INPUT_TOO_SHORT"
        : "INPUT_TOO_LONG";
      return makeErrorResponse(errorCode);
    }

    const itemDescription = itemDescResult.data;

    // Run use case
    const useCaseResult = await findHsCodeUseCase.execute({ itemDescription });

    if (!useCaseResult.ok) {
      // Use case already provides errorCode and errorMessage
      return {
        ok: false,
        errorCode: useCaseResult.errorCode,
        errorMessage: useCaseResult.errorMessage ?? getErrorMessage(useCaseResult.errorCode),
      };
    }

    return { ok: true, data: useCaseResult.data };
  }

  // ─────────────────────────────────────────────
  // handleIdentifyPhoto
  // ─────────────────────────────────────────────

  /**
   * Validates the photo (format and size), sends it to Gemini Vision for item
   * identification, and returns the text description.
   *
   * Photo is validated before any network call:
   *   - mimeType must be image/jpeg, image/png, or image/webp (Req 2.1, 2.4)
   *   - imageBase64 length must not exceed ~6.7 MB (5 MB × 4/3) (Req 2.2, 2.3)
   *
   * @param {{ imageBase64: string, mimeType: string }} requestBody
   * @returns {Promise<{ ok: true, data: { itemDescription: string } } | { ok: false, errorCode: string, errorMessage: string }>}
   *
   * @example
   * await controller.handleIdentifyPhoto({ imageBase64: "<valid base64>", mimeType: "image/jpeg" })
   * // => { ok: true, data: { itemDescription: "Laptop 14 inci dengan casing aluminium..." } }
   *
   * @example
   * await controller.handleIdentifyPhoto({ imageBase64: "<base64>", mimeType: "image/gif" })
   * // => { ok: false, errorCode: "PHOTO_UNSUPPORTED_FORMAT", errorMessage: "Format foto tidak didukung. Gunakan JPEG, PNG, atau WEBP." }
   */
  async function handleIdentifyPhoto(requestBody) {
    const { imageBase64, mimeType } = requestBody ?? {};

    // Guard: fields must be strings
    if (typeof imageBase64 !== "string" || typeof mimeType !== "string") {
      return makeErrorResponse("PHOTO_UNSUPPORTED_FORMAT");
    }

    // Validate format (Req 2.1, 2.4)
    if (!SUPPORTED_PHOTO_MIME_TYPES.has(mimeType.toLowerCase())) {
      return makeErrorResponse("PHOTO_UNSUPPORTED_FORMAT");
    }

    // Validate size via base64 length proxy (Req 2.2, 2.3)
    if (imageBase64.length > MAX_PHOTO_BASE64_LENGTH) {
      return makeErrorResponse("PHOTO_TOO_LARGE");
    }

    // Delegate to Gemini Vision
    const identifyResult = await hsFinderGeminiService.identifyFromPhoto(imageBase64, mimeType);

    if (!identifyResult.ok) {
      const errorCode = identifyResult.error ?? "GEMINI_UNAVAILABLE";
      return makeErrorResponse(errorCode);
    }

    return { ok: true, data: { itemDescription: identifyResult.data } };
  }

  return { handleFindHsCode, handleIdentifyPhoto };
}
