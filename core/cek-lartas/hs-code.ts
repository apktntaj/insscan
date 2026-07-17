import type { HsCode, KategoriLartas, Lartas, LartasDetail, Result } from './types';

export function isValidHsCode(value: string | HsCode): boolean {
    return /^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(String(value));
}

export function makeHsCode(code: string): Result<HsCode> {
    if (isValidHsCode(code)) {
        return { ok: true, data: code as HsCode };
    }

    return {
        ok: false,
        error: `HS code harus 2, 4, 6, atau 8 digit numerik; diterima: "${code}"`,
    };
}

export function formatHsCode(code: HsCode): string {
    if (code.length === 6) {
        return `${code.slice(0, 4)}.${code.slice(4, 6)}`;
    }

    if (code.length === 8) {
        return `${code.slice(0, 4)}.${code.slice(4, 6)}.${code.slice(6, 8)}`;
    }

    return code;
}

export function hasLartas(lartas: Lartas): boolean {
    let lartasDetails = lartas.regulasi.values();
    for (const details of lartasDetails) {
        if (details.length > 0) {
            return true;
        }
    }

    return false;
}

export function getLartasByKategori(lartas: Lartas, kategori: KategoriLartas): LartasDetail[] {
    return lartas.regulasi.get(kategori) ?? [];
}
