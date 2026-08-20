/**
 * HS Code API Route
 * Delivery Layer - Next.js API endpoint
 *
 * @description Thin HTTP adapter for the Cek LARTAS use case
 */

import { controller } from
  "@/app/features/cek-lartas/composition/cek-lartas.composition";

interface HsCodeRequestItem {
  hs_code?: unknown;
}

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json();
    const hsCodes = Array.isArray(body)
      ? body.map((item: HsCodeRequestItem) => String(item?.hs_code ?? ""))
      : [];

    const result = await controller.handle(hsCodes);

    return Response.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
