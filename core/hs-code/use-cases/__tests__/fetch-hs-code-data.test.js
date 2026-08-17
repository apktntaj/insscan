import { createFetchHsCodeDataUseCase } from "../fetch-hs-code-data";

describe("createFetchHsCodeDataUseCase", () => {
  it("fetchMultiple starts multiple requests concurrently", async () => {
    let activeCalls = 0;
    let maxActiveCalls = 0;

    const gateway = {
      fetchByCode: async (code) => {
        activeCalls += 1;
        maxActiveCalls = Math.max(maxActiveCalls, activeCalls);

        await new Promise((resolve) => setTimeout(resolve, 20));

        activeCalls -= 1;
        return {
          bm: "0%",
          ppn: "0%",
          pph: "0%",
          pphNonApi: "0%",
          hasLartasImport: false,
          hasLartasBorder: false,
          hasLartasPostBorder: false,
          hasLartasExport: false,
          lartasImportDetails: [],
          lartasBorderDetails: [],
          lartasPostBorderDetails: [],
          lartasExportDetails: [],
        };
      },
    };

    const useCase = createFetchHsCodeDataUseCase(gateway);

    await useCase.fetchMultiple(["84713090", "85171200", "85423100", "90011000"]);

    expect(maxActiveCalls).toBeGreaterThan(1);
  });
});
