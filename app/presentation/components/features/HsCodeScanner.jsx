"use client";

import React, { useState, useCallback } from "react";
import HsCodeTable from "./HsCodeTable";
import Button from "../common/Button";
import Input from "../common/Input";
import { fileToArrayBuffer, bufferToJson, isExcelFile } from "../../../infrastructure/excel/excel.service";
import { formatHsCode, isValidHsCode } from "../../../core/entities/hs-code";

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

        try {
            const response = await fetch("/api/hs-code/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            if (!response.body) {
                throw new Error("Streaming not supported");
            }

            const finalData = await consumeProgressStream(response.body, {
                onStart: ({ total: streamTotal }) => {
                    setProgress((prev) => ({
                        ...prev,
                        total: streamTotal ?? prev.total,
                        startedAt,
                    }));
                },
                onProgress: (payloadItem) => {
                    const logMessage = formatProgressLog(payloadItem);
                    const now = Date.now();
                    const safeTotal = payloadItem.total || total || 0;
                    const safeCurrent = Math.max(payloadItem.current || 0, 0);
                    const elapsedMs = Math.max(now - startedAt, 0);
                    const avgMsPerCode = safeCurrent > 0 ? elapsedMs / safeCurrent : 0;
                    const etaTotalMs = safeTotal > 0 ? Math.round(avgMsPerCode * safeTotal) : null;
                    const etaRemainingMs = etaTotalMs !== null
                        ? Math.max(etaTotalMs - elapsedMs, 0)
                        : null;

                    setProgress((prev) => ({
                        total: payloadItem.total ?? prev.total,
                        current: payloadItem.current ?? prev.current,
                        currentCode: payloadItem.code ?? prev.currentCode,
                        currentMode: payloadItem.mode ?? prev.currentMode,
                        logs: [...prev.logs, logMessage].slice(-10),
                        startedAt,
                        elapsedMs,
                        etaRemainingMs,
                        etaTotalMs,
                        etaTotalMsBeforeComplete:
                            safeCurrent < safeTotal
                                ? etaTotalMs
                                : prev.etaTotalMsBeforeComplete ?? etaTotalMs,
                    }));

                    setStatus(
                        `Memproses ${payloadItem.current}/${safeTotal} HS code secara serial...`
                    );
                },
            });

            setResultData(finalData);
            setStatus(`Berhasil! ${finalData.length} data HS Code ditampilkan.`);
            setProgress((prev) => {
                const finishedAt = Date.now();
                const actualDurationMs = Math.max(finishedAt - (prev.startedAt || startedAt), 0);
                const etaReferenceMs = prev.etaTotalMsBeforeComplete ?? prev.etaTotalMs;
                const etaDeltaMs = typeof etaReferenceMs === "number"
                    ? actualDurationMs - etaReferenceMs
                    : null;

                return {
                    ...prev,
                    finishedAt,
                    elapsedMs: actualDurationMs,
                    etaRemainingMs: 0,
                    actualDurationMs,
                    etaReferenceMs,
                    etaDeltaMs,
                };
            });
        } catch (error) {
            console.error("Error:", error);
            setStatus("Gagal mengambil data. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }, [fileData]);

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Input File</p>
                        <Input handleChange={handleFileChange} className="max-w-2xl" />
                        <p className="text-xs leading-6 text-zinc-500 sm:text-sm">
                            Gunakan file <span className="font-medium text-zinc-700">.xls / .xlsx</span> berisi HS code 8 digit.
                        </p>
                    </div>

                    <div className="flex w-full flex-col items-start gap-3 lg:items-end">
                        <Button onClick={handleFetchData} disabled={isLoading || !fileData} className="w-full px-6 sm:w-auto">
                            {isLoading ? "Loading..." : "Tarik Data"}
                        </Button>
                        {status ? <span className="text-xs text-zinc-500 sm:text-sm">{status}</span> : null}
                    </div>
                </div>
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
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
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

            <p className="mt-3 text-sm text-zinc-700">
                {progress.currentCode
                    ? `HS aktif: ${formatHsCode(String(progress.currentCode))} (${labelMode(progress.currentMode)})`
                    : "Menunggu proses dimulai..."}
                {!isLoading && progress.current === progress.total ? " Selesai." : ""}
            </p>

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
                        <p key={`${log}-${idx}`} className="text-xs text-zinc-600">
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
                onProgress?.(event);
                continue;
            }

            if (event.event === "complete") {
                finalData = event.data || [];
                continue;
            }

            if (event.event === "error") {
                throw new Error(event.message || "Failed to fetch HS data");
            }
        }
    }

    if (buffer.trim()) {
        const event = JSON.parse(buffer);
        if (event.event === "complete") {
            finalData = event.data || [];
        }
        if (event.event === "error") {
            throw new Error(event.message || "Failed to fetch HS data");
        }
    }

    if (!finalData) {
        throw new Error("No final result from stream");
    }

    return finalData;
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
