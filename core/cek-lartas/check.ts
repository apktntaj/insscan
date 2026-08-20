import { isValidHsCode, type HsCode, type Invoice, type Result } from "./domain";
import type { Source } from "./source";

const CONCURRENCY = 8;

export type Progress = {
  current: number;
  total: number;
  code: HsCode;
  mode: "invalid" | "fetched" | "error";
  result: Result;
};

export async function check(
  invoice: Invoice,
  source: Source,
  onProgress?: (progress: Progress) => void,
): Promise<Result[]> {
  const hsCodes = [...new Set(invoice.hsCodes.map(String))];
  const results: Result[] = new Array(hsCodes.length);
  let completed = 0;

  async function run(hsCode: HsCode, index: number): Promise<void> {
    let mode: Progress["mode"] = "fetched";
    let result: Result;

    if (!isValidHsCode(hsCode)) {
      mode = "invalid";
      result = { status: "gagal", hsCode, reason: "hscode-tidak-valid" };
    } else {
      try {
        const found = await source.find(hsCode);

        if (found.status === "ditemukan") {
          result = {
            status: "berhasil",
            hsCode,
            requirements: found.requirements,
          };
        } else {
          result = { status: "gagal", hsCode, reason: found.status };
        }
      } catch {
        mode = "error";
        result = { status: "gagal", hsCode, reason: "sumber-gagal" };
      }
    }

    results[index] = result;
    completed += 1;
    onProgress?.({
      current: completed,
      total: hsCodes.length,
      code: hsCode,
      mode,
      result,
    });
  }

  for (let index = 0; index < hsCodes.length; index += CONCURRENCY) {
    await Promise.all(
      hsCodes
        .slice(index, index + CONCURRENCY)
        .map((hsCode, offset) => run(hsCode, index + offset)),
    );
  }

  return results;
}
