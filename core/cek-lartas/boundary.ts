import type { HsCode, KategoriLartas, Lartas, LartasDetail, RawInsw, Result, Tarif } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTarifField(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'tidak ada data') {
      return null;
    }
    return trimmed;
  }

  return String(value);
}

function parseLartasDetail(raw: unknown): LartasDetail | null {
  if (!isPlainObject(raw)) {
    return null;
  }

  const namaIzin = typeof raw.namaIzin === 'string' ? raw.namaIzin : '';
  if (!namaIzin.trim()) {
    return null;
  }

  const toStringOrNull = (value: unknown): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return String(value);
  };

  const toStringArrayOrNull = (value: unknown): string[] | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (Array.isArray(value)) {
      const values = value.map((item) => (item === null || item === undefined ? '' : String(item))).filter((item) => item.trim() !== '');
      return values.length > 0 ? values : null;
    }
    return [String(value)];
  };

  return {
    namaIzin,
    kodeIzin: toStringOrNull(raw.kodeIzin),
    noSkep: toStringOrNull(raw.noSkep),
    idDokumen: toStringOrNull(raw.idDokumen),
    dokumenPabean: toStringArrayOrNull(raw.dokumenPabean),
    tanggalMulai: toStringOrNull(raw.tanggalMulai),
    tanggalAkhir: toStringOrNull(raw.tanggalAkhir),
    link: toStringOrNull(raw.link),
  };
}

function parseDetailArray(raw: unknown): LartasDetail[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(parseLartasDetail).filter((detail): detail is LartasDetail => detail !== null);
}

function buildRegulasiMap(
  borderDetails: LartasDetail[],
  postBorderDetails: LartasDetail[],
  eksporDetails: LartasDetail[],
): Map<KategoriLartas, LartasDetail[]> {
  const map = new Map<KategoriLartas, LartasDetail[]>();

  const addIfPresent = (kategori: KategoriLartas, details: LartasDetail[]) => {
    if (details.length > 0) {
      map.set(kategori, details);
    }
  };

  addIfPresent('border', borderDetails);
  addIfPresent('post-border', postBorderDetails);
  addIfPresent('ekspor', eksporDetails);

  return map;
}

function parseInswResponse(raw: unknown, hsCode: HsCode): Result<Lartas> {
  if (!isPlainObject(raw)) {
    return { ok: false, error: 'Response tidak valid: bukan objek' };
  }

  const rawInsw = raw as RawInsw;
  const tarif: Tarif = {
    bm: normalizeTarifField(rawInsw.bm),
    ppn: normalizeTarifField(rawInsw.ppn),
    pph: normalizeTarifField(rawInsw.pph),
    pphNonApi: normalizeTarifField(rawInsw.pphNonApi),
  };

  const borderDetails = parseDetailArray(rawInsw.lartasBorderDetails);
  const postBorderDetails = parseDetailArray(rawInsw.lartasPostBorderDetails);
  const eksporDetails = parseDetailArray(rawInsw.lartasExportDetails);

  const regulasi = buildRegulasiMap(borderDetails, postBorderDetails, eksporDetails);

  return {
    ok: true,
    data: {
      hsCode,
      tarif,
      regulasi,
    },
  };
}

export { normalizeTarifField, parseLartasDetail, parseDetailArray, buildRegulasiMap, parseInswResponse };
export type { HsCode, KategoriLartas, Lartas, LartasDetail, RawInsw, Result, Tarif } from './types';
