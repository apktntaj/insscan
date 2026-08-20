import { createInswSource } from "./insw-lartas-data-source";

describe("INSW source", () => {
  it("does not interpret an unverified response as no LARTAS", async () => {
    const source = createInswSource({
      fetchByCode: async () => ({ lartasVerified: false }),
    });

    await expect(source.find("84713090")).resolves.toEqual({
      status: "belum-terverifikasi",
    });
  });

  it("surfaces provider failures instead of calling them not found", async () => {
    const source = createInswSource({
      fetchByCode: async () => ({ sourceError: true }),
    });

    await expect(source.find("84713090")).rejects.toThrow("INSW source failed");
  });

  it("maps a verified empty response to no requirements", async () => {
    const source = createInswSource({
      fetchByCode: async () => ({ lartasVerified: true }),
    });

    await expect(source.find("84713090")).resolves.toEqual({
      status: "ditemukan",
      requirements: [],
    });
  });

  it("maps external details into requirements", async () => {
    const source = createInswSource({
      fetchByCode: async () => ({
        lartasVerified: true,
        lartasBorderDetails: [{
          namaIzin: "Persetujuan Impor",
          dokumenPabean: [20],
        }],
      }),
    });

    await expect(source.find("84713090")).resolves.toMatchObject({
      status: "ditemukan",
      requirements: [{
        category: "Impor Border",
        namaIzin: "Persetujuan Impor",
        dokumenPabean: ["20"],
      }],
    });
  });
});
