/**
 * HS Code API Route
 * Infrastructure Layer - Next.js API endpoint
 *
 * @description HTTP adapter for HS Code use case
 */

import { hsCodeController } from "../../adapters/controllers/hs-code.controller";

export async function POST(req) {
  try {
    const body = await req.json();
    const hsCodes = body.map((item) => item.hs_code);

    const result = await hsCodeController.handleFetchRequest(hsCodes);

    return Response.json(result.data, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
