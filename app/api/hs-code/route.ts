/**
 * HS Code API Route
 * Delivery Layer - Next.js API endpoint
 *
 * @description Thin HTTP adapter for the Cek LARTAS use case
 */

import { controller } from
  "@/app/features/cek-lartas/composition/cek-lartas.composition";
import { parseHsCodeRequest } from
  "@/app/features/cek-lartas/adapters/requests/parse-hs-code-request";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = await parseHsCodeRequest(req);
    if (!parsed.ok) {
      return Response.json({ error: parsed.message }, { status: 400 });
    }

    const result = await controller.handle(parsed.hsCodes);

    return Response.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
