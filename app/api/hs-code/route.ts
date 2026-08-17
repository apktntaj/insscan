/**
 * HS Code API Route
 * Infrastructure Layer - Next.js API endpoint
 *
 * @description HTTP adapter for HS Code use case
 */

import { hsCodeController } from "@/app/features/hs-code/adapters/controllers/hs-code.controller";
import type { FetchMultipleOptions } from "@core/hs-code/use-cases/fetch-hs-code-data";

interface HsCodeController {
  handleFetchRequest(
    hsCodes: string[],
    options?: FetchMultipleOptions,
  ): Promise<{ success: boolean; data: unknown }>;
}

interface HsCodeRequestItem {
  hs_code?: unknown;
}

const controller = hsCodeController as unknown as HsCodeController;
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json();
    const hsCodes = Array.isArray(body)
      ? body.map((item: HsCodeRequestItem) => String(item?.hs_code ?? ""))
      : [];

    const result = await controller.handleFetchRequest(hsCodes);

    return Response.json(result.data, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
