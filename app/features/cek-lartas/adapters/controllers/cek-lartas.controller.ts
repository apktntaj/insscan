import { toResultData } from "../presenters/cek-lartas.presenter";
import { check, type Progress } from "@core/cek-lartas/check";
import type { HsCode } from "@core/cek-lartas/domain";
import type { Source } from "@core/cek-lartas/source";

export function createController(source: Source) {
  async function handle(
    hsCodes: HsCode[],
    onProgress?: (progress: Progress) => void,
  ): Promise<unknown[]> {
    const results = await check({ hsCodes }, source, onProgress);
    return toResultData(results) as unknown[];
  }

  return { handle };
}
