import {
  MAX_HS_CODES_PER_REQUEST,
  parseHsCodeRequest,
} from "./parse-hs-code-request";

function jsonRequest(body: string): Request {
  return new Request("http://localhost/api/hs-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("parseHsCodeRequest", () => {
  it("menerima array item HS code", async () => {
    const result = await parseHsCodeRequest(
      jsonRequest(JSON.stringify([{ hs_code: "84713090" }])),
    );

    expect(result).toEqual({ ok: true, hsCodes: ["84713090"] });
  });

  it.each([
    ["JSON rusak", "{"],
    ["body bukan array", JSON.stringify({ hs_code: "84713090" })],
    ["array kosong", JSON.stringify([])],
    ["item bukan object", JSON.stringify(["84713090"])],
  ])("menolak %s", async (_case, body) => {
    const result = await parseHsCodeRequest(jsonRequest(body));

    expect(result.ok).toBe(false);
  });

  it("membatasi jumlah item", async () => {
    const body = Array.from(
      { length: MAX_HS_CODES_PER_REQUEST + 1 },
      () => ({ hs_code: "84713090" }),
    );

    const result = await parseHsCodeRequest(
      jsonRequest(JSON.stringify(body)),
    );

    expect(result).toEqual({
      ok: false,
      message: `Maksimum ${MAX_HS_CODES_PER_REQUEST} HS code per permintaan.`,
    });
  });
});
