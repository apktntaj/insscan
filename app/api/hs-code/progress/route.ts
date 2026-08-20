/**
 * HS Code Progress API Route
 * Delivery Layer - Next.js API endpoint
 *
 * @description Streams Cek LARTAS progress as NDJSON.
 */

import { controller as cekLartas } from
  "@/app/features/cek-lartas/composition/cek-lartas.composition";
import { toResultRow } from
  "@/app/features/cek-lartas/adapters/presenters/cek-lartas.presenter";
import type { Progress } from "@core/cek-lartas/check";

const presentResultRow = toResultRow as (
  result: Progress["result"],
) => unknown;
const encoder = new TextEncoder();
export const maxDuration = 60;

function toNdjsonLine(payload: Record<string, unknown>): string {
  return `${JSON.stringify(payload)}\n`;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json();
    const hsCodes = Array.isArray(body)
      ? body.map((item: { hs_code?: unknown }) => String(item?.hs_code ?? ""))
      : [];

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const push = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(toNdjsonLine(payload)));
        };

        try {
          push({
            event: "start",
            total: hsCodes.length,
          });

          const result = await cekLartas.handle(
            hsCodes,
            (progress: Progress) => {
              const { result: progressResult, ...meta } = progress;
              push({
                event: "progress",
                ...meta,
                row: presentResultRow(progressResult),
              });
            },
          );

          push({
            event: "complete",
            data: result,
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
