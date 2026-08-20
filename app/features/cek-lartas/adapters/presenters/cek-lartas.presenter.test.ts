import { parseHsCodeApiResponse } from "./cek-lartas.presenter";

describe("parseHsCodeApiResponse", () => {
  it("preserves an unverified failure", () => {
    expect(parseHsCodeApiResponse({
      status: "gagal",
      hsCode: "84713090",
      reason: "belum-terverifikasi",
    })).toEqual({
      ok: true,
      data: {
        status: "gagal",
        hsCode: "84713090",
        reason: "belum-terverifikasi",
      },
    });
  });

  it("accepts verified no-LARTAS as a successful empty list", () => {
    expect(parseHsCodeApiResponse({
      status: "berhasil",
      hsCode: "84713090",
      requirements: [],
    })).toEqual({
      ok: true,
      data: {
        status: "berhasil",
        hsCode: "84713090",
        requirements: [],
      },
    });
  });
});
