import { check } from "./check";

describe("check", () => {
  it("checks an invoice without Next.js or production infrastructure", async () => {
    const source = {
      find: jest.fn(async () => ({
        status: "ditemukan",
        requirements: [{ category: "Impor Border", namaIzin: "PI" }],
      })),
    };

    const [result] = await check({ hsCodes: ["84713090"] }, source);

    expect(result).toEqual({
      status: "berhasil",
      hsCode: "84713090",
      requirements: [{ category: "Impor Border", namaIzin: "PI" }],
    });
  });

  it("means verified no-LARTAS only by a successful empty requirement list", async () => {
    const source = {
      find: async () => ({ status: "ditemukan", requirements: [] }),
    };

    await expect(check({ hsCodes: ["84713090"] }, source)).resolves.toEqual([
      { status: "berhasil", hsCode: "84713090", requirements: [] },
    ]);
  });

  it("does not call the source for an invalid HS code", async () => {
    const source = { find: jest.fn() };

    const [result] = await check({ hsCodes: ["8471.30.90"] }, source);

    expect(source.find).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "gagal",
      hsCode: "8471.30.90",
      reason: "hscode-tidak-valid",
    });
  });

  it("checks duplicate HS codes once", async () => {
    const source = {
      find: jest.fn(async () => ({ status: "ditemukan", requirements: [] })),
    };

    const results = await check(
      { hsCodes: ["84713090", "84713090"] },
      source,
    );

    expect(source.find).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
  });

  it.each(["tidak-ditemukan", "belum-terverifikasi"])(
    "returns gagal when source says %s",
    async (sourceStatus) => {
      const source = { find: async () => ({ status: sourceStatus }) };

      const [result] = await check({ hsCodes: ["84713090"] }, source);

      expect(result).toEqual({
        status: "gagal",
        hsCode: "84713090",
        reason: sourceStatus,
      });
    },
  );

  it("turns a source exception into sumber-gagal", async () => {
    const source = {
      find: async () => {
        throw new Error("INSW unavailable");
      },
    };

    const [result] = await check({ hsCodes: ["84713090"] }, source);

    expect(result).toEqual({
      status: "gagal",
      hsCode: "84713090",
      reason: "sumber-gagal",
    });
  });
});
