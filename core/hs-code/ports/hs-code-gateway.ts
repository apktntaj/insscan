import type { LartasDetail } from "../domain/hs-code";

/** Data contract returned by an HS-code data source. */
export interface RawHsCodeData {
  bm?: string | null;
  ppn?: string | null;
  pph?: string | null;
  pphNonApi?: string | null;
  hasLartasImport?: boolean;
  hasLartasBorder?: boolean;
  hasLartasPostBorder?: boolean;
  hasLartasExport?: boolean;
  lartasImportDetails?: readonly LartasDetail[];
  lartasBorderDetails?: readonly LartasDetail[];
  lartasPostBorderDetails?: readonly LartasDetail[];
  lartasExportDetails?: readonly LartasDetail[];
}

/** Output port implemented by application infrastructure. */
export interface HsCodeGateway {
  fetchByCode(code: string): Promise<RawHsCodeData | null>;
  fetchByCodes?(codes: readonly string[]): Promise<readonly RawHsCodeData[]>;
}

export function validateHsCodeGateway(
  gateway: Partial<HsCodeGateway> | null | undefined,
): asserts gateway is HsCodeGateway {
  if (typeof gateway?.fetchByCode !== "function") {
    throw new Error("HsCodeGateway must implement fetchByCode method");
  }
}
