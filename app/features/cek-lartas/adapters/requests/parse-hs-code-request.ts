export const MAX_HS_CODES_PER_REQUEST = 50;

export type ParseHsCodeRequestResult =
  | { ok: true; hsCodes: string[] }
  | { ok: false; message: string };

interface HsCodeRequestItem {
  hs_code?: unknown;
}

function isRequestItem(value: unknown): value is HsCodeRequestItem {
  return typeof value === "object" && value !== null;
}

export async function parseHsCodeRequest(
  request: Request,
): Promise<ParseHsCodeRequestResult> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { ok: false, message: "Body harus berupa JSON yang valid." };
  }

  if (!Array.isArray(body)) {
    return { ok: false, message: "Body harus berupa array HS code." };
  }

  if (body.length === 0) {
    return { ok: false, message: "Minimal satu HS code harus dikirim." };
  }

  if (body.length > MAX_HS_CODES_PER_REQUEST) {
    return {
      ok: false,
      message: `Maksimum ${MAX_HS_CODES_PER_REQUEST} HS code per permintaan.`,
    };
  }

  if (!body.every(isRequestItem)) {
    return {
      ok: false,
      message: "Setiap item harus berupa object dengan field hs_code.",
    };
  }

  return {
    ok: true,
    hsCodes: body.map((item) => String(item.hs_code ?? "")),
  };
}
