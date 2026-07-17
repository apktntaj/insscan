declare const hsCodeBrand: unique symbol;

export type HsCode = string & {
  readonly [hsCodeBrand]: 'HsCode';
};

export type KategoriLartas = "border" | "post-border" | "ekspor";

export type LartasDetail = {
  namaIzin: string;
  kodeIzin: string | null;
  noSkep: string | null;
  idDokumen: string | null;
  dokumenPabean: string[] | null;
  tanggalMulai: string | null;
  tanggalAkhir: string | null;
  link: string | null;
};

// export type Tarif = {
//   bm: string | null;
//   ppn: string | null;
//   pph: string | null;
//   pphNonApi: string | null;
// };

export type Lartas = {
  hsCode: HsCode;
//   tarif: Tarif;
  regulasi: Map<KategoriLartas, LartasDetail[]>;
};

export type RawInsw = {
  [key: string]: unknown;
  bm?: unknown;
  ppn?: unknown;
  pph?: unknown;
  pphNonApi?: unknown;
  lartasBorderDetails?: unknown;
  lartasPostBorderDetails?: unknown;
  lartasExportDetails?: unknown;
};

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
