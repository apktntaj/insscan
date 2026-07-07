"use client";

import { useState, useCallback } from "react";
import { parseHsCodeApiResponse } from "../../adapters/presenters/hs-code.presenter";
import { isValidHsCode, formatHsCode } from "../../core/entities/hs-code";
import {
  fileToArrayBuffer,
  bufferToJson,
  isExcelFile,
  downloadAsExcel,
} from "../../infrastructure/excel/excel.service";
import { useQueryLimit } from "./useQueryLimit";

// ─── Module-level Constants ───────────────────────────────────────────────────

const BASE_CHUNK_SIZE = resolveChunkSize(process.env.NEXT_PUBLIC_HS_CHUNK_SIZE);
const MIN_CHUNK_SIZE = 1;
const MAX_CHUNK_ATTEMPTS = 5;
const CHUNK_RETRY_DELAY_MS = 900;
const CHUNK_GROW_SUCCESS_STREAK = 3;

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Parse env var chunk size, fallback to 3. Clamp between 1 and 10.
 *
 * @param {string | undefined} rawValue
 * @returns {number}
 *
 * @example
 * resolveChunkSize("5")   // => 5
 * resolveChunkSize("abc") // => 3
 * resolveChunkSize("0")   // => 3
 * resolveChunkSize("15")  // => 10
 */
function resolveChunkSize(rawValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 3;
  }
  return Math.min(Math.max(Math.round(parsed), 1), 10);
}

/**
 * Promise-based delay.
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 *
 * @example
 * await sleep(900); // waits 900ms
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Returns a ProgressState with all default values.
 *
 * @returns {import('../../../adapters/presenters/hs-code.presenter').ProgressState}
 *
 * @example
 * createInitialProgressState()
 * // => { total: 0, current: 0, currentCode: null, ..., etaDeltaMs: null }
 */
function createInitialProgressState() {
  return {
    total: 0,
    current: 0,
    currentCode: null,
    currentMode: null,
    logs: [],
    chunkSize: BASE_CHUNK_SIZE,
    baseChunkSize: BASE_CHUNK_SIZE,
    startedAt: null,
    finishedAt: null,
    elapsedMs: 0,
    etaRemainingMs: null,
    etaTotalMs: null,
    etaTotalMsBeforeComplete: null,
    actualDurationMs: null,
    etaReferenceMs: null,
    etaDeltaMs: null,
  };
}

/**
 * Extract valid HS codes from a 2D array Excel via isValidHsCode.
 * Filters empty rows, flatMaps cells, filters valid, maps to String.
 *
 * @param {Array<Array>} fileData - 2D array from Excel
 * @returns {string[]} Array of valid 8-digit HS codes
 *
 * @example
 * extractHsCodes([["84713090", "foo"], [], ["12345678"]])
 * // => ["84713090", "12345678"]
 *
 * @example
 * extractHsCodes([["abc", "123"], []])
 * // => []
 */
function extractHsCodes(fileData) {
  return fileData
    .filter((row) => row.length !== 0)
    .flatMap((row) => row.filter((cell) => isValidHsCode(cell)))
    .map(String);
}

/**
 * Map mode string to Indonesian label.
 *
 * @param {string | null} mode
 * @returns {string}
 *
 * @example
 * labelMode("fetched") // => "diambil dari INSW"
 * labelMode("cached")  // => "cache internal"
 * labelMode(null)      // => "diproses"
 */
function labelMode(mode) {
  if (mode === "fetched") return "diambil dari INSW";
  if (mode === "cached") return "cache internal";
  if (mode === "invalid") return "invalid";
  if (mode === "error") return "gagal";
  return "diproses";
}

/**
 * Format a progress log entry.
 *
 * @param {{ current: number, total: number, code: string, mode: string | null }} params
 * @returns {string}
 *
 * @example
 * formatProgressLog({ current: 3, total: 10, code: "84713090", mode: "fetched" })
 * // => "3/10 - 8471.30.90: diambil dari INSW"
 *
 * @example
 * formatProgressLog({ current: 1, total: 5, code: "12345678", mode: "cached" })
 * // => "1/5 - 1234.56.78: cache internal"
 */
function formatProgressLog({ current, total, code, mode }) {
  const formattedCode = formatHsCode(String(code));
  return `${current}/${total} - ${formattedCode}: ${labelMode(mode)}`;
}

/**
 * Read a ReadableStream line-by-line, parse each line as a JSON event.
 * Handles events: start, progress, complete, error.
 * Returns { data, isPartial, processedCount } or throws if no data at all.
 *
 * @param {ReadableStream} stream - Response body stream
 * @param {{ onStart?: (event: object) => void, onProgress?: (event: object) => void }} callbacks
 * @returns {Promise<{ data: object[], isPartial: boolean, processedCount: number, streamError?: string }>}
 *
 * @example
 * // Stream emits complete event with 5 rows:
 * // => { data: [...5 rows], isPartial: false, processedCount: 5 }
 *
 * @example
 * // Stream emits only progress events (partial):
 * // => { data: [...partial rows], isPartial: true, processedCount: N, streamError: "..." }
 */
async function consumeProgressStream(stream, { onStart, onProgress }) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalData = null;
  const partialRows = [];
  let streamError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);

      if (event.event === "start") {
        onStart?.(event);
        continue;
      }

      if (event.event === "progress") {
        if (event.row) {
          partialRows.push(event.row);
        }
        onProgress?.(event);
        continue;
      }

      if (event.event === "complete") {
        finalData = event.data || [];
        continue;
      }

      if (event.event === "error") {
        streamError = event.message || "Failed to fetch HS data";
      }
    }
  }

  // Handle any remaining buffered content
  if (buffer.trim()) {
    const event = JSON.parse(buffer);
    if (event.event === "complete") {
      finalData = event.data || [];
    }
    if (event.event === "progress" && event.row) {
      partialRows.push(event.row);
      onProgress?.(event);
    }
    if (event.event === "error") {
      streamError = event.message || "Failed to fetch HS data";
    }
  }

  if (Array.isArray(finalData)) {
    return {
      data: finalData,
      isPartial: false,
      processedCount: finalData.length,
    };
  }

  if (partialRows.length > 0) {
    return {
      data: partialRows,
      isPartial: true,
      processedCount: partialRows.length,
      streamError,
    };
  }

  throw new Error(streamError || "No final result from stream");
}

/**
 * Calculate actual duration and ETA delta, return finalized ProgressState.
 *
 * @param {object} prev - Previous progress state
 * @param {number} startedAt - Timestamp when process started (ms epoch)
 * @param {number} total - Total HS codes to process
 * @param {number} processedGlobal - Total HS codes actually processed
 * @returns {object} Finalized ProgressState
 *
 * @example
 * finalizeProgress({ startedAt: 1000, etaTotalMs: 5000, etaTotalMsBeforeComplete: null, current: 10 }, 1000, 10, 10)
 * // => { ..., actualDurationMs: <elapsed>, etaRemainingMs: 0, etaDeltaMs: <delta> }
 *
 * @example
 * finalizeProgress({ startedAt: null, etaTotalMs: null, etaTotalMsBeforeComplete: null, current: 0 }, 2000, 5, 3)
 * // => { ..., etaDeltaMs: null, etaRemainingMs: 0 }
 */
function finalizeProgress(prev, startedAt, total, processedGlobal) {
  const finishedAt = Date.now();
  const actualDurationMs = Math.max(finishedAt - (prev.startedAt || startedAt), 0);
  const etaReferenceMs = prev.etaTotalMsBeforeComplete ?? prev.etaTotalMs;
  const etaDeltaMs =
    typeof etaReferenceMs === "number" ? actualDurationMs - etaReferenceMs : null;

  return {
    ...prev,
    total: prev.total || total,
    current: Math.max(prev.current, processedGlobal),
    finishedAt,
    elapsedMs: actualDurationMs,
    etaRemainingMs: 0,
    actualDurationMs,
    etaReferenceMs,
    etaDeltaMs,
  };
}

/**
 * Build the export filename for the file mode result.
 * Format: lartas-hasil-{YYYYMMDD}.xlsx
 *
 * @returns {string}
 *
 * @example
 * // On 2025-01-15:
 * buildResultExcelFilename() // => "lartas-hasil-20250115.xlsx"
 */
function buildResultExcelFilename() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `lartas-hasil-${yyyy}${mm}${dd}.xlsx`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook untuk logika streaming mode File Cek Lartas.
 * Mengelola state fileData, resultData, status, isLoading, progress.
 * Mengekspos handleFileChange, handleFetch, handleExportResult.
 * Logika adaptive chunking dipertahankan dari implementasi sebelumnya.
 *
 * @returns {{
 *   fileData: Array<Array> | null,
 *   resultData: object[] | null,
 *   status: string,
 *   isLoading: boolean,
 *   progress: object,
 *   handleFileChange: (e: Event) => Promise<void>,
 *   handleFetch: () => Promise<void>,
 *   handleExportResult: () => void,
 * }}
 *
 * @example
 * // Penggunaan di komponen:
 * const { fileData, resultData, status, isLoading, progress,
 *         handleFileChange, handleFetch, handleExportResult } = useCekLartasFile();
 *
 * @example
 * // Setelah handleFetch() selesai dengan 50 HS code:
 * // resultData => [LartasResult, LartasResult, ...] (50 item)
 * // status => "Berhasil! 50 data HS Code ditampilkan."
 * // isLoading => false
 */
export function useCekLartasFile() {
  const [fileData, setFileData] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [resultData, setResultData] = useState(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(createInitialProgressState());
  const [viewMode, setViewMode] = useState("lartas");
  const { remaining, isLimitReached, consume, activateKey } = useQueryLimit();

  /**
   * Membaca file Excel dari event input, memperbarui fileData.
   * Jika bukan .xls/.xlsx: set status error, tidak update fileData.
   * Jika tidak ada HS code valid: set status error.
   * Jika berhasil: set fileData, reset resultData dan progress.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e
   * @returns {Promise<void>}
   */
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isExcelFile(file.name)) {
      setStatus("File harus berformat .xls atau .xlsx.");
      setSelectedFileName("");
      e.target.value = "";
      return;
    }

    try {
      setSelectedFileName(file.name);
      const buffer = await fileToArrayBuffer(file);
      const jsonData = bufferToJson(buffer);

      const hsCodes = extractHsCodes(jsonData);
      if (hsCodes.length === 0) {
        setStatus("Tidak ada HS code valid ditemukan di file.");
        return;
      }

      setFileData(jsonData);
      setResultData(null);
      setStatus("");
      setProgress(createInitialProgressState());
      setViewMode("lartas");
    } catch (error) {
      console.error("Error reading file:", error);
      setStatus("Gagal membaca file.");
      setSelectedFileName("");
    }
  }, []);

  /**
   * Menjalankan proses streaming serial dengan adaptive chunking ke /api/hs-code/progress.
   * Memperbarui progress setiap HS code selesai.
   * Menangani retry, chunk size reduction, partial results, dan total failure.
   *
   * @returns {Promise<void>}
   */
  const handleFetch = useCallback(async () => {
    if (!fileData) return;

    const startedAt = Date.now();

    const hsCodes = extractHsCodes(fileData);
    const uniqueHsCodes = [...new Set(hsCodes)];

    // Cek limit sebelum mulai — batasi ke sisa kuota
    if (isLimitReached) {
      setStatus("Batas query harian tercapai. Upgrade ke Pro untuk akses unlimited.");
      return;
    }

    const allowedCount = Math.min(uniqueHsCodes.length, remaining);
    const allowed = consume(allowedCount);
    if (!allowed) {
      setStatus("Batas query harian tercapai. Upgrade ke Pro untuk akses unlimited.");
      return;
    }

    const limitedHsCodes = uniqueHsCodes.slice(0, allowedCount);
    if (allowedCount < uniqueHsCodes.length) {
      setStatus(`Kuota terbatas — hanya ${allowedCount} dari ${uniqueHsCodes.length} HS code yang diproses.`);
    }

    setIsLoading(true);
    if (allowedCount === uniqueHsCodes.length) {
      setStatus("Menyiapkan proses fetch serial...");
    }

    const payload = limitedHsCodes.map((hs) => ({ hs_code: hs }));
    const total = payload.length;

    if (total === 0) {
      setStatus("Tidak ada HS code valid di file.");
      setIsLoading(false);
      setProgress(createInitialProgressState());
      return;
    }

    setResultData(null);
    setProgress({
      total,
      current: 0,
      currentCode: null,
      currentMode: null,
      logs: [],
      chunkSize: BASE_CHUNK_SIZE,
      baseChunkSize: BASE_CHUNK_SIZE,
      startedAt,
      finishedAt: null,
      elapsedMs: 0,
      etaRemainingMs: null,
      etaTotalMs: null,
      etaTotalMsBeforeComplete: null,
      actualDurationMs: null,
      etaDeltaMs: null,
      etaReferenceMs: null,
    });

    let aggregatedRows = [];
    let processedGlobal = 0;
    let activeChunkSize = BASE_CHUNK_SIZE;
    let stableSuccessStreak = 0;
    let requestCounter = 0;

    try {
      while (processedGlobal < total) {
        let pendingChunk = payload.slice(
          processedGlobal,
          processedGlobal + activeChunkSize
        );
        let attempt = 0;
        let chunkDone = false;

        while (!chunkDone) {
          attempt += 1;
          requestCounter += 1;

          try {
            setStatus(
              `Request ${requestCounter} - memproses ${processedGlobal}/${total} HS code (chunk ${pendingChunk.length})...`
            );

            const response = await fetch("/api/hs-code/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(pendingChunk),
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch chunk: ${response.status}`);
            }

            if (!response.body) {
              throw new Error("Streaming not supported");
            }

            const {
              data: chunkData,
              isPartial,
              processedCount,
            } = await consumeProgressStream(response.body, {
              onStart: () => {
                setProgress((prev) => ({
                  ...prev,
                  startedAt,
                  chunkSize: activeChunkSize,
                }));
              },
              onProgress: (payloadItem) => {
                const globalCurrent = Math.min(
                  processedGlobal + Math.max(payloadItem.current || 0, 0),
                  total
                );

                const logMessage = formatProgressLog({
                  ...payloadItem,
                  current: globalCurrent,
                  total,
                });

                const now = Date.now();
                const elapsedMs = Math.max(now - startedAt, 0);
                const avgMsPerCode =
                  globalCurrent > 0 ? elapsedMs / globalCurrent : 0;
                const etaTotalMs =
                  total > 0 ? Math.round(avgMsPerCode * total) : null;
                const etaRemainingMs =
                  etaTotalMs !== null
                    ? Math.max(etaTotalMs - elapsedMs, 0)
                    : null;

                setProgress((prev) => ({
                  total,
                  current: globalCurrent,
                  currentCode: payloadItem.code ?? prev.currentCode,
                  currentMode: payloadItem.mode ?? prev.currentMode,
                  logs: [...prev.logs, logMessage].slice(-10),
                  chunkSize: activeChunkSize,
                  baseChunkSize: BASE_CHUNK_SIZE,
                  startedAt,
                  elapsedMs,
                  etaRemainingMs,
                  etaTotalMs,
                  etaTotalMsBeforeComplete:
                    globalCurrent < total
                      ? etaTotalMs
                      : prev.etaTotalMsBeforeComplete ?? etaTotalMs,
                }));

                setStatus(
                  `Request ${requestCounter} - memproses ${globalCurrent}/${total} HS code (chunk ${pendingChunk.length})...`
                );
              },
            });

            if (processedCount <= 0) {
              throw new Error("Chunk stream ended without progress");
            }

            // Parse each row via parseHsCodeApiResponse before aggregating
            const parsedRows = chunkData.map((row) => {
              const result = parseHsCodeApiResponse(row);
              if (!result.ok) {
                console.error(
                  "parseHsCodeApiResponse failed for row:",
                  result.error,
                  row
                );
                // Use raw row as safe default — skip invalid parse but keep data
                return row;
              }
              return result.data;
            });

            aggregatedRows = [...aggregatedRows, ...parsedRows];
            processedGlobal += processedCount;
            chunkDone = true;

            if (isPartial) {
              stableSuccessStreak = 0;

              if (activeChunkSize > MIN_CHUNK_SIZE) {
                activeChunkSize -= 1;
                setStatus(
                  `Koneksi tidak stabil. Chunk diturunkan ke ${activeChunkSize}...`
                );
              }
            } else if (attempt === 1) {
              stableSuccessStreak += 1;

              if (
                stableSuccessStreak >= CHUNK_GROW_SUCCESS_STREAK &&
                activeChunkSize < BASE_CHUNK_SIZE
              ) {
                activeChunkSize += 1;
                stableSuccessStreak = 0;
                setStatus(
                  `Koneksi stabil. Chunk dinaikkan ke ${activeChunkSize}...`
                );
              }
            } else {
              stableSuccessStreak = 0;
            }
          } catch (chunkError) {
            console.error(
              `Request ${requestCounter} attempt ${attempt} failed:`,
              chunkError
            );
            stableSuccessStreak = 0;

            if (attempt >= MAX_CHUNK_ATTEMPTS) {
              if (activeChunkSize > MIN_CHUNK_SIZE) {
                activeChunkSize -= 1;
                attempt = 0;
                pendingChunk = payload.slice(
                  processedGlobal,
                  processedGlobal + activeChunkSize
                );

                setStatus(
                  `Retry berulang gagal. Chunk diturunkan ke ${activeChunkSize} lalu lanjut...`
                );
                await sleep(CHUNK_RETRY_DELAY_MS);
                continue;
              }

              throw chunkError;
            }

            setStatus(
              `Request ${requestCounter} gagal. Retry ${attempt}/${MAX_CHUNK_ATTEMPTS}...`
            );
            await sleep(CHUNK_RETRY_DELAY_MS);
          }
        }
      }

      setResultData(aggregatedRows);
      setStatus(`Berhasil! ${aggregatedRows.length} data HS Code ditampilkan.`);
    } catch (error) {
      console.error("Error:", error);

      if (aggregatedRows.length > 0) {
        setResultData(aggregatedRows);
        setStatus(
          `Proses berhenti sebelum selesai. ${aggregatedRows.length} data parsial berhasil ditampilkan.`
        );
      } else {
        setStatus("Gagal mengambil data. Silakan coba lagi.");
      }
    } finally {
      setProgress((prev) =>
        finalizeProgress(prev, startedAt, total, processedGlobal)
      );
      setIsLoading(false);
    }
  }, [fileData]);

  /**
   * Mengunduh resultData sebagai file Excel dalam format matriks LARTAS.
   * Jika resultData kosong atau null: tidak melakukan aksi.
   * Nama file: lartas-hasil-{YYYYMMDD}.xlsx
   *
   * @returns {void}
   */
  const handleExportResult = useCallback(() => {
    if (!resultData || resultData.length === 0) return;
    
    // Build matrix rows
    const matrixRows = resultData.map((row, idx) => {
      const details = extractSectionDetailsForExport(row);
      const detailsByDocCode = new Map();

      for (const detail of details) {
        const docCodes = Array.isArray(detail.dokumenPabean) ? detail.dokumenPabean : [];

        for (const docCode of docCodes) {
          const normalizedCode = String(docCode);
          const existing = detailsByDocCode.get(normalizedCode) || [];
          existing.push(detail);
          detailsByDocCode.set(normalizedCode, existing);
        }
      }

      return {
        referenceNo: idx + 1,
        hsCode: row.hsCode,
        hasLartas: details.length > 0,
        detailsByDocCode,
      };
    });

    // Collect document codes
    const docCodesSet = new Set();
    for (const row of matrixRows) {
      for (const code of row.detailsByDocCode.keys()) {
        docCodesSet.add(String(code));
      }
    }
    const docCodes = Array.from(docCodesSet).sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
    
    // Filter rows based on view mode
    const filteredRows = matrixRows.filter((item) => 
      viewMode === "all" ? true : item.hasLartas
    );

    // Convert to Excel format
    const excelData = filteredRows.map((row) => {
      const excelRow = {
        NO: row.referenceNo,
        "HS CODE": row.hsCode,
      };

      for (const docCode of docCodes) {
        const cellDetails = row.detailsByDocCode.get(docCode) || [];
        excelRow[`DOK ${docCode}`] = cellDetails.length > 0 
          ? `Ada (${cellDetails.length})` 
          : "—";
      }

      return excelRow;
    });

    downloadAsExcel(excelData, buildResultExcelFilename());
  }, [resultData, viewMode]);

  return {
    fileData,
    selectedFileName,
    resultData,
    status,
    isLoading,
    progress,
    viewMode,
    setViewMode,
    handleFileChange,
    handleFetch,
    handleExportResult,
    remaining,
    isLimitReached,
    activateKey,
  };
}

/**
 * Helper function to extract LARTAS details for export
 * @param {object} row
 * @returns {Array<object & { category: string }>}
 */
function extractSectionDetailsForExport(row) {
  const sections = [
    { category: "Impor Border", details: row.lartasBorderDetails || [] },
    { category: "Impor Post Border", details: row.lartasPostBorderDetails || [] },
    { category: "Ekspor Border", details: row.lartasExportDetails || [] },
  ];
  const result = [];

  for (const section of sections) {
    for (const detail of section.details) {
      result.push({
        ...detail,
        category: section.category,
      });
    }
  }

  return result;
}
