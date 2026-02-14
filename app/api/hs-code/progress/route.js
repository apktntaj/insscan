/**
 * HS Code Progress API Route
 * Infrastructure Layer - Next.js API endpoint
 *
 * @description Streams serial HS code fetch progress as NDJSON.
 */

import { hsCodeController } from "../../../adapters/controllers/hs-code.controller";
import { toResultRow } from "../../../adapters/presenters/hs-code.presenter";

const encoder = new TextEncoder();
export const maxDuration = 60;

function toNdjsonLine(payload) {
  return `${JSON.stringify(payload)}\n`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const hsCodes = Array.isArray(body)
      ? body.map((item) => String(item?.hs_code ?? ""))
      : [];

    const stream = new ReadableStream({
      async start(controller) {
        const push = (payload) => {
          controller.enqueue(encoder.encode(toNdjsonLine(payload)));
        };

        try {
          push({
            event: "start",
            total: hsCodes.length,
          });

          const result = await hsCodeController.handleFetchRequest(hsCodes, {
            onProgress(progress) {
              const { result: progressResult, ...meta } = progress;
              push({
                event: "progress",
                ...meta,
                row: toResultRow(progressResult),
              });
            },
          });

          push({
            event: "complete",
            data: result.data,
          });
        } catch (error) {
          console.error("HS Code progress stream error:", error);
          push({
            event: "error",
            message: "Internal server error",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("HS Code progress API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
