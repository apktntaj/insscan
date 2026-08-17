import {
  createEmptyHsCode,
  createHsCode,
  isValidHsCode,
  type HsCode,
} from "../domain/hs-code";
import type { HsCodeGateway } from "../ports/hs-code-gateway";

const DEFAULT_MAX_CONCURRENT_REQUESTS = 8;

type ProgressMode = "invalid" | "cached" | "fetched" | "error";

export interface HsCodeProgress {
  current: number;
  total: number;
  code: string;
  mode: ProgressMode;
  result: HsCode;
}

export interface FetchMultipleOptions {
  onProgress?: (progress: HsCodeProgress) => void;
}

export interface FetchHsCodeDataUseCase {
  fetchSingle(code: string): Promise<HsCode>;
  fetchMultiple(codes: readonly unknown[], options?: FetchMultipleOptions): Promise<HsCode[]>;
}

export interface FetchHsCodePolicy {
  requestDelayMinMs?: number;
  requestDelayMaxMs?: number;
  requestErrorCooldownMs?: number;
  maxConcurrentRequests?: number;
}

export function createFetchHsCodeDataUseCase(
  hsCodeGateway: HsCodeGateway,
  policy: FetchHsCodePolicy = {},
): FetchHsCodeDataUseCase {
  const requestDelayMinMs = normalizeNonNegative(policy.requestDelayMinMs, 0);
  const requestDelayMaxMs = normalizeNonNegative(
    policy.requestDelayMaxMs,
    requestDelayMinMs,
  );
  const requestErrorCooldownMs = normalizeNonNegative(
    policy.requestErrorCooldownMs,
    0,
  );
  const maxConcurrentRequests = Math.max(
    1,
    Math.round(
      normalizeNonNegative(
        policy.maxConcurrentRequests,
        DEFAULT_MAX_CONCURRENT_REQUESTS,
      ),
    ),
  );
  async function fetchSingle(code: string): Promise<HsCode> {
    if (!isValidHsCode(code)) return createEmptyHsCode(code);

    const rawData = await hsCodeGateway.fetchByCode(code);
    if (!rawData) return createEmptyHsCode(code);

    return createHsCode({ code, ...rawData });
  }

  async function fetchMultiple(
    codes: readonly unknown[],
    options: FetchMultipleOptions = {},
  ): Promise<HsCode[]> {
    const onProgress = options.onProgress;
    const list = Array.isArray(codes) ? codes.map((code) => String(code ?? "")) : [];
    const total = list.length;
    const results: HsCode[] = new Array(total);
    const cache = new Map<string, HsCode>();
    const queue: Array<Promise<void>> = [];

    const runTask = async (code: string, index: number): Promise<void> => {
      let result = createEmptyHsCode(code);
      let mode: ProgressMode = "invalid";

      if (isValidHsCode(code)) {
        const cached = cache.get(code);
        if (cached) {
          result = cached;
          mode = "cached";
        } else {
          try {
            result = await fetchSingle(code);
            cache.set(code, result);
            mode = "fetched";
          } catch (error) {
            console.error(`Failed to process HS code ${code}:`, error);
            result = createEmptyHsCode(code);
            mode = "error";
          }

          const delay = resolveRequestDelay(
            mode,
            requestDelayMinMs,
            requestDelayMaxMs,
            requestErrorCooldownMs,
          );
          if (delay > 0) await sleep(delay);
        }
      }

      results[index] = result;
      onProgress?.({ current: index + 1, total, code, mode, result });
    };

    for (let index = 0; index < total; index += 1) {
      queue.push(runTask(list[index], index));
      if (queue.length >= maxConcurrentRequests || index === total - 1) {
        await Promise.all(queue.splice(0, queue.length));
      }
    }

    return results;
  }

  return { fetchSingle, fetchMultiple };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveRequestDelay(
  mode: ProgressMode,
  requestDelayMinMs: number,
  requestDelayMaxMs: number,
  requestErrorCooldownMs: number,
): number {
  return mode === "error"
    ? requestErrorCooldownMs
    : randomBetween(requestDelayMinMs, requestDelayMaxMs);
}

function randomBetween(min: number, max: number): number {
  const safeMin = Math.max(Number(min) || 0, 0);
  const safeMax = Math.max(Number(max) || safeMin, safeMin);
  return Math.round(Math.random() * (safeMax - safeMin) + safeMin);
}

function normalizeNonNegative(
  rawValue: number | undefined,
  fallback: number,
): number {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
