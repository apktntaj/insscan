/** Framework-agnostic domain model for Indonesian HS code data. */

export type LartasDetail = Readonly<Record<string, unknown>>;

export interface HsCodeParams {
  code: string;
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

export interface HsCode {
  readonly code: string;
  readonly bm: string | null;
  readonly ppn: string | null;
  readonly pph: string | null;
  readonly pphNonApi: string | null;
  readonly hasLartasImport: boolean;
  readonly hasLartasBorder: boolean;
  readonly hasLartasPostBorder: boolean;
  readonly hasLartasExport: boolean;
  readonly lartasImportDetails: readonly LartasDetail[];
  readonly lartasBorderDetails: readonly LartasDetail[];
  readonly lartasPostBorderDetails: readonly LartasDetail[];
  readonly lartasExportDetails: readonly LartasDetail[];
}

export function createHsCode({
  code,
  bm = null,
  ppn = null,
  pph = null,
  pphNonApi = null,
  hasLartasImport = false,
  hasLartasBorder = false,
  hasLartasPostBorder = false,
  hasLartasExport = false,
  lartasImportDetails = [],
  lartasBorderDetails = [],
  lartasPostBorderDetails = [],
  lartasExportDetails = [],
}: HsCodeParams): HsCode {
  return Object.freeze({
    code,
    bm,
    ppn,
    pph,
    pphNonApi,
    hasLartasImport,
    hasLartasBorder,
    hasLartasPostBorder,
    hasLartasExport,
    lartasImportDetails,
    lartasBorderDetails,
    lartasPostBorderDetails,
    lartasExportDetails,
  });
}

export function isValidHsCode(value: string | number): boolean {
  return /^\d{8}$/.test(String(value));
}

export function formatHsCode(code: string | number): string {
  return String(code).replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
}

export function createEmptyHsCode(code: string): HsCode {
  return createHsCode({
    code,
    bm: "tidak ada data",
    ppn: "tidak ada data",
    pph: "tidak ada data",
    pphNonApi: "tidak ada data",
  });
}
