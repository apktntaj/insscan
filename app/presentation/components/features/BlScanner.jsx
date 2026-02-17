"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
).toString();

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const AUTO_COPY_GAP_MS = 100;

export default function BlScanner() {
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState("");
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.15);
    const [status, setStatus] = useState("Upload PDF Bill of Lading, lalu klik untuk copy. Tahan Ctrl untuk chain.");
    const [lastCopiedValue, setLastCopiedValue] = useState("");
    const [showCopiedPopup, setShowCopiedPopup] = useState(false);
    const [popupSeed, setPopupSeed] = useState(0);
    const lastCopyTextRef = useRef("");
    const lastCopyTsRef = useRef(0);
    const chainBufferRef = useRef("");
    const ctrlPressedRef = useRef(false);
    const popupTimerRef = useRef(null);

    useEffect(() => {
        if (!file) {
            setFileUrl("");
            setNumPages(0);
            setPageNumber(1);
            return;
        }

        const url = URL.createObjectURL(file);
        setFileUrl(url);
        setNumPages(0);
        setPageNumber(1);
        setLastCopiedValue("");
        lastCopyTextRef.current = "";
        chainBufferRef.current = "";
        ctrlPressedRef.current = false;
        setStatus("PDF berhasil dimuat. Klik untuk copy, tahan Ctrl lalu klik untuk chain.");

        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        return () => {
            if (popupTimerRef.current) {
                window.clearTimeout(popupTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!fileUrl) {
            chainBufferRef.current = "";
            ctrlPressedRef.current = false;
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key !== "Control") return;
            if (ctrlPressedRef.current) return;

            ctrlPressedRef.current = true;
            chainBufferRef.current = "";
            setStatus("Mode chain aktif. Tahan Ctrl dan klik beberapa teks.");
        };

        const stopChainMode = () => {
            if (!ctrlPressedRef.current && !chainBufferRef.current) return;
            ctrlPressedRef.current = false;
            chainBufferRef.current = "";
            setStatus("Mode chain nonaktif. Klik biasa untuk copy tunggal.");
        };

        const handleKeyUp = (event) => {
            if (event.key !== "Control") return;
            stopChainMode();
        };

        const handleBlur = () => {
            if (!ctrlPressedRef.current && !chainBufferRef.current) return;
            ctrlPressedRef.current = false;
            chainBufferRef.current = "";
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [fileUrl]);

    const handleFileChange = useCallback((event) => {
        const nextFile = event.target.files?.[0];

        if (!nextFile) return;

        const hasPdfMime = nextFile.type === "application/pdf";
        const hasPdfExtension = nextFile.name.toLowerCase().endsWith(".pdf");

        if (!hasPdfMime && !hasPdfExtension) {
            setStatus("File harus berformat PDF.");
            event.target.value = "";
            return;
        }

        setFile(nextFile);
    }, []);

    const handleDocumentSuccess = useCallback(({ numPages: totalPages }) => {
        setNumPages(totalPages);
        setStatus("PDF siap dipindai. Klik untuk copy, tahan Ctrl lalu klik untuk chain.");
    }, []);

    const copyToClipboard = useCallback(async (value) => {
        const cleanValue = value.trim();

        if (!cleanValue) return false;

        try {
            await navigator.clipboard.writeText(cleanValue);
            return true;
        } catch (error) {
            try {
                const helper = document.createElement("textarea");
                helper.value = cleanValue;
                helper.setAttribute("readonly", "");
                helper.style.position = "fixed";
                helper.style.opacity = "0";
                document.body.appendChild(helper);
                helper.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(helper);
                return ok;
            } catch {
                return false;
            }
        }
    }, []);

    const handleTextClick = useCallback(
        async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            if (!target.closest(".react-pdf__Page__textContent")) return;

            const rawText = target.textContent?.replace(/\s+/g, " ").trim() ?? "";
            if (!rawText) return;

            const isChainClick = event.ctrlKey && ctrlPressedRef.current;
            if (!isChainClick) {
                chainBufferRef.current = "";
            }
            const nextValue = isChainClick
                ? (chainBufferRef.current ? `${chainBufferRef.current} ${rawText}` : rawText)
                : rawText;
            if (isChainClick) {
                chainBufferRef.current = nextValue;
            }

            const now = Date.now();
            if (now - lastCopyTsRef.current < AUTO_COPY_GAP_MS) return;
            if (!isChainClick && nextValue === lastCopyTextRef.current) return;

            const copied = await copyToClipboard(nextValue);
            if (!copied) {
                setStatus("Clipboard diblokir browser. Coba klik teks sekali lagi.");
                return;
            }

            lastCopyTsRef.current = now;
            lastCopyTextRef.current = nextValue;
            setLastCopiedValue(nextValue);
            setPopupSeed((prev) => prev + 1);
            setShowCopiedPopup(true);
            if (popupTimerRef.current) {
                window.clearTimeout(popupTimerRef.current);
            }
            popupTimerRef.current = window.setTimeout(() => {
                setShowCopiedPopup(false);
            }, 2400);
            if (isChainClick) {
                setStatus(`Chain aktif: "${truncateText(nextValue, 56)}"`);
            } else {
                setStatus(`Tersalin: "${truncateText(nextValue, 56)}"`);
            }
        },
        [copyToClipboard]
    );

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Upload dokumen Bill of Lading berformat pdf</p>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="file-input file-input-bordered w-full max-w-xl border-zinc-300 bg-white"
                    />
                </div>
                <p className="mt-4 break-words text-xs leading-6 text-zinc-600 sm:text-sm">{status}</p>
            </section>

            {fileUrl ? (
                <section>
                    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Halaman {pageNumber}/{numPages || 1}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                                    disabled={pageNumber <= 1}
                                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPageNumber((prev) => Math.min(numPages || 1, prev + 1))}
                                    disabled={pageNumber >= (numPages || 1)}
                                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScale((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))))}
                                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                                >
                                    Zoom -
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScale((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))))}
                                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                                >
                                    Zoom +
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-100/70 p-3">
                            <div className="bl-hover-copy flex min-w-max justify-center" onClick={handleTextClick}>
                                <Document
                                    key={fileUrl}
                                    file={fileUrl}
                                    onLoadSuccess={handleDocumentSuccess}
                                    onLoadError={() => setStatus("Gagal memuat PDF. Pastikan file valid dan berbasis teks.")}
                                    loading={<p className="py-16 text-sm text-zinc-500">Memuat PDF...</p>}
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderAnnotationLayer
                                        renderTextLayer
                                        loading=""
                                    />
                                </Document>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-3 text-center shadow-sm">
                    <p className="text-sm text-zinc-500">Belum ada file. Upload PDF untuk mulai menampilkan dokumen.</p>
                </section>
            )}

            <div
                aria-live="polite"
                className={`pointer-events-none fixed bottom-6 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] transform transition-all duration-300 sm:right-6 ${
                    showCopiedPopup ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
                }`}
            >
                <div key={popupSeed} className="rounded-2xl border border-cyan-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">Nilai Terakhir</p>
                    <p className="mt-2 break-words text-sm font-medium text-zinc-800">
                        {lastCopiedValue || "Belum ada nilai yang tersalin."}
                    </p>
                </div>
            </div>
        </div>
    );
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}
