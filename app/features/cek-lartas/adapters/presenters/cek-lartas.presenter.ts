import type {
  FailureReason,
  Requirement,
  Result,
} from "@core/cek-lartas/domain";

const failureReasons = new Set<FailureReason>([
  "hscode-tidak-valid",
  "tidak-ditemukan",
  "belum-terverifikasi",
  "sumber-gagal",
]);

export function toResultRow(result: Result): Result {
  return result;
}

export function toResultData(results: Result[]): Result[] {
  return results;
}

export function parseHsCodeApiResponse(
  raw: unknown,
): { ok: true; data: Result } | { ok: false; error: string } {
  if (!isRecord(raw)) {
    return { ok: false, error: "Response tidak valid: bukan objek" };
  }

  const hsCode = String(raw.hsCode ?? "");
  if (!hsCode) return { ok: false, error: "Field wajib tidak ada: hsCode" };

  if (raw.status === "berhasil") {
    if (!Array.isArray(raw.requirements)) {
      return { ok: false, error: "Field requirements tidak valid" };
    }

    return {
      ok: true,
      data: {
        status: "berhasil",
        hsCode,
        requirements: raw.requirements.filter(isRecord) as Requirement[],
      },
    };
  }

  if (
    raw.status === "gagal"
    && failureReasons.has(raw.reason as FailureReason)
  ) {
    return {
      ok: true,
      data: {
        status: "gagal",
        hsCode,
        reason: raw.reason as FailureReason,
      },
    };
  }

  return { ok: false, error: "Status hasil tidak valid" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
