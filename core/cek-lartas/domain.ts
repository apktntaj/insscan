
export type Invoice = {
  hsCodes: HsCode[];
};

export type HsCode = string;

export type Result =
  | {
    status: "gagal";
    hsCode: HsCode;
    reason: FailureReason;
  }
  | {
    status: "berhasil";
    hsCode: HsCode;
    requirements: Requirement[];
  };

export type FailureReason =
  | "hscode-tidak-valid"
  | "tidak-ditemukan"
  | "belum-terverifikasi"
  | "sumber-gagal";

export type Requirement = {
  category: "Impor Border" | "Impor Post Border" | "Ekspor Border";
  idDokumen?: string | null;
  kodeIzin?: string | null;
  namaIzin?: string | null;
  komoditi?: string | null;
  noSkep?: string | null;
  uraianBarangSkep?: string | null;
  tanggalMulai?: string | null;
  tanggalAkhir?: string | null;
  link?: string | null;
  links?: string[];
  dokumenPabean?: string[];
};

export function isValidHsCode(value: unknown): value is HsCode {
  return /^\d{8}$/.test(String(value));
}

export function formatHsCode(hsCode: HsCode): string {
  return hsCode.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
}
