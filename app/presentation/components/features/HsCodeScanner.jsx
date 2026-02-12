"use client";

import React, { useState, useCallback } from "react";
import HsCodeTable from "./HsCodeTable";
import Button from "../common/Button";
import Input from "../common/Input";
import { fileToArrayBuffer, bufferToJson, isExcelFile } from "../../../infrastructure/excel/excel.service";
import { formatHsCode, isValidHsCode } from "../../../core/entities/hs-code";

const BASE_CHUNK_SIZE = resolveChunkSize(process.env.NEXT_PUBLIC_HS_CHUNK_SIZE);
const MIN_CHUNK_SIZE = 1;
const MAX_CHUNK_ATTEMPTS = 5;
const CHUNK_RETRY_DELAY_MS = 900;
const CHUNK_GROW_SUCCESS_STREAK = 3;

/**
 * HsCodeScanner Component
 * Presentation Layer - Feature-specific component
 *
 * @description Main component for HS Code scanning feature
 */
export default function HsCodeScanner() {
    const [fileData, setFileData] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(createInitialProgressState());

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!isExcelFile(file.name)) {
            alert("File yang kamu masukkan bukan file excel");
            e.target.value = "";
            return;
        }

        try {
            const buffer = await fileToArrayBuffer(file);
            const jsonData = bufferToJson(buffer);
            setFileData(jsonData);
            setResultData(null);
            setStatus("");
            setProgress(createInitialProgressState());
        } catch (error) {
            console.error("Error reading file:", error);
            alert("Gagal membaca file");
        }
    }, []);

    const handleFetchData = useCallback(async () => {
        if (!fileData) {
            alert("File belum diinputkan");
            return;
        }

        const startedAt = Date.now();
        setIsLoading(true);
        setStatus("Menyiapkan proses fetch serial...");

        const hsCodes = extractHsCodes(fileData);
        const payload = hsCodes.map((hs) => ({ hs_code: hs }));
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
                                const avgMsPerCode = globalCurrent > 0 ? elapsedMs / globalCurrent : 0;
                                const etaTotalMs = total > 0 ? Math.round(avgMsPerCode * total) : null;
                                const etaRemainingMs = etaTotalMs !== null
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

                        aggregatedRows = [...aggregatedRows, ...chunkData];
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
                        console.error(`Request ${requestCounter} attempt ${attempt} failed:`, chunkError);
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
            setProgress((prev) => finalizeProgress(prev, startedAt, total, processedGlobal));
            setIsLoading(false);
        }
    }, [fileData]);

    return (
        <div className="space-y-6 overflow-x-clip">
            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="min-w-0 space-y-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Input File</p>
                        <Input handleChange={handleFileChange} className="max-w-2xl" />
                        <p className="text-xs leading-6 text-zinc-500 sm:text-sm">
                            Gunakan file <span className="font-medium text-zinc-700">.xls / .xlsx</span> berisi HS code 8 digit.
                        </p>
                    </div>

                    <div className="flex min-w-0 w-full flex-col items-start gap-3 lg:w-auto lg:justify-self-end lg:items-end">
                        <Button onClick={handleFetchData} disabled={isLoading || !fileData} className="w-full px-6 sm:w-auto">
                            {isLoading ? "Loading..." : "Tarik Data"}
                        </Button>
                    </div>
                </div>

                {status ? (
                    <p className="mt-4 max-w-full break-words pr-1 text-xs leading-6 text-zinc-500 sm:text-sm">
                        {status}
                    </p>
                ) : null}
            </div>

            {progress.total > 0 ? (
                <ProgressPanel progress={progress} isLoading={isLoading} />
            ) : null}

            <HsCodeTable fileData={fileData} resultData={resultData} />
        </div>
    );
}

function ProgressPanel({ progress, isLoading }) {
    const percent = progress.total > 0
        ? Math.min(Math.round((progress.current / progress.total) * 100), 100)
        : 0;

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Proses Fetch</p>
                <p className="text-sm font-medium text-zinc-700">
                    {progress.current}/{progress.total}
                </p>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                    className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <p className="mt-3 break-words text-sm text-zinc-700">
                {progress.currentCode
                    ? `HS aktif: ${formatHsCode(String(progress.currentCode))} (${labelMode(progress.currentMode)})`
                    : "Menunggu proses dimulai..."}
                {!isLoading && progress.current === progress.total ? " Selesai." : ""}
            </p>

            <div className="mt-2 text-xs text-zinc-500">
                Mode: serial adaptive chunk (aktif {progress.chunkSize}, maksimum {progress.baseChunkSize})
            </div>

            <div className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
                <p>
                    Durasi berjalan:{" "}
                    <span className="font-medium text-zinc-800">{formatDuration(progress.elapsedMs)}</span>
                </p>
                <p>
                    ETA selesai:{" "}
                    <span className="font-medium text-zinc-800">
                        {formatEtaClock(progress.startedAt, progress.etaTotalMs)}
                    </span>
                </p>
                <p className="sm:col-span-2">
                    Sisa estimasi:{" "}
                    <span className="font-medium text-zinc-800">
                        {formatDuration(progress.etaRemainingMs)}
                    </span>
                </p>
            </div>

            {!isLoading && progress.actualDurationMs !== null ? (
                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                    <p>
                        Durasi aktual:{" "}
                        <span className="font-medium text-zinc-900">{formatDuration(progress.actualDurationMs)}</span>
                    </p>
                    <p className="mt-1">
                        ETA referensi:{" "}
                        <span className="font-medium text-zinc-900">{formatDuration(progress.etaReferenceMs)}</span>
                    </p>
                    <p className="mt-1">
                        Selisih aktual vs ETA:{" "}
                        <span className="font-medium text-zinc-900">{formatDelta(progress.etaDeltaMs)}</span>
                    </p>
                </div>
            ) : null}

            <div className="mt-3 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                {progress.logs.length === 0 ? (
                    <p className="text-xs text-zinc-500">Belum ada log proses.</p>
                ) : (
                    progress.logs.map((log, idx) => (
                        <p key={`${log}-${idx}`} className="break-words text-xs text-zinc-600">
                            {log}
                        </p>
                    ))
                )}
            </div>
        </div>
    );
}

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

function labelMode(mode) {
    if (mode === "fetched") return "diambil dari INSW";
    if (mode === "cached") return "cache internal";
    if (mode === "invalid") return "invalid";
    if (mode === "error") return "gagal";
    return "diproses";
}

function formatProgressLog({ current, total, code, mode }) {
    const formattedCode = formatHsCode(String(code));
    return `${current}/${total} - ${formattedCode}: ${labelMode(mode)}`;
}

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

function formatDuration(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "-";
    }

    const totalSeconds = Math.max(Math.round(value / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatEtaClock(startedAt, etaTotalMs) {
    if (!startedAt || typeof etaTotalMs !== "number" || Number.isNaN(etaTotalMs)) {
        return "-";
    }

    const etaDate = new Date(startedAt + etaTotalMs);
    return etaDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function formatDelta(deltaMs) {
    if (typeof deltaMs !== "number" || Number.isNaN(deltaMs)) {
        return "-";
    }

    if (deltaMs === 0) {
        return "tepat sesuai ETA";
    }

    const sign = deltaMs > 0 ? "+" : "-";
    return `${sign}${formatDuration(Math.abs(deltaMs))}`;
}

function finalizeProgress(prev, startedAt, total, processedGlobal) {
    const finishedAt = Date.now();
    const actualDurationMs = Math.max(finishedAt - (prev.startedAt || startedAt), 0);
    const etaReferenceMs = prev.etaTotalMsBeforeComplete ?? prev.etaTotalMs;
    const etaDeltaMs = typeof etaReferenceMs === "number"
        ? actualDurationMs - etaReferenceMs
        : null;

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

function resolveChunkSize(rawValue) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 3;
    }

    return Math.min(Math.max(Math.round(parsed), 1), 10);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Extracts valid HS codes from file data
 * @param {Array<Array>} fileData - 2D array from Excel
 * @returns {string[]} Array of valid HS codes
 */
function extractHsCodes(fileData) {
    return fileData
        .filter((row) => row.length !== 0)
        .flatMap((row) => row.filter((cell) => isValidHsCode(cell)))
        .map(String);
}
