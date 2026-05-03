"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { parsePDF } from "../../../infrastructure/services/pdf-parser.service";
import { extractBLFields } from "../../../core/services/bl-extractor.service";
import { toFormData } from "../../../adapters/services/form-filler.service";
import ShipmentForm from "./ShipmentForm";
import { useShipments } from "../../hooks/useShipments";
import { useRouter } from "next/navigation";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
).toString();

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const AUTO_COPY_GAP_MS = 100;

export default function BlScanner() {
    const router = useRouter();
    const { createShipment } = useShipments();
    
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState("");
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.15);
    const [status, setStatus] = useState("Upload PDF Bill of Lading, lalu klik untuk copy. Tahan Ctrl untuk chain.");
    const [lastCopiedValue, setLastCopiedValue] = useState("");
    const [showCopiedPopup, setShowCopiedPopup] = useState(false);
    const [popupSeed, setPopupSeed] = useState(0);
    
    // Auto-fill mode state
    const [mode, setMode] = useState("auto-fill"); // "auto-fill" | "click-to-copy"
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractionResult, setExtractionResult] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formInitialData, setFormInitialData] = useState(null);
    
    const lastCopyTextRef = useRef("");
    const lastCopyTsRef = useRef(0);
    const chainBufferRef = useRef("");
    const ctrlPressedRef = useRef(false);
    const popupTimerRef = useRef(null);

    // Load mode preference from localStorage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem("blScannerMode");
        if (savedMode === "click-to-copy" || savedMode === "auto-fill") {
            setMode(savedMode);
        }
    }, []);

    // Save mode preference to localStorage when changed
    useEffect(() => {
        localStorage.setItem("blScannerMode", mode);
    }, [mode]);

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

    const handleFileChange = useCallback(async (event) => {
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
        
        // If in auto-fill mode, trigger extraction workflow
        if (mode === "auto-fill") {
            await processAutoFill(nextFile);
        }
    }, [mode]);

    /**
     * Processes PDF for auto-fill workflow.
     * Parses PDF → Extracts fields → Opens form with data.
     */
    const processAutoFill = useCallback(async (pdfFile) => {
        setIsProcessing(true);
        setStatus("Memproses PDF...");
        
        try {
            // Step 1: Parse PDF to extract text
            const parseResult = await parsePDF(pdfFile);
            
            if (!parseResult.ok) {
                // Parsing failed - show error and fallback to click-to-copy
                setStatus(parseResult.message || "Gagal memproses PDF.");
                setMode("click-to-copy");
                setStatus("Auto-fill gagal. Beralih ke mode click-to-copy.");
                setIsProcessing(false);
                return;
            }
            
            setStatus("Mengekstrak field shipment...");
            
            // Step 2: Extract shipment fields from text
            const extraction = extractBLFields(parseResult.text);
            setExtractionResult(extraction);
            
            // Clear extracted text from memory after extraction
            parseResult.text = null;
            
            // Check if any fields were found
            if (extraction.foundFieldsCount === 0) {
                setStatus("Tidak dapat menemukan field shipment di PDF.");
                setMode("click-to-copy");
                setStatus("Auto-fill gagal. Beralih ke mode click-to-copy.");
                setIsProcessing(false);
                return;
            }
            
            // Step 3: Convert to form data
            const formData = toFormData(extraction);
            setFormInitialData(formData);
            
            // Step 4: Show success and open form
            if (extraction.overallConfidence < 0.5) {
                setStatus("Ekstraksi berhasil tapi confidence rendah. Periksa data dengan teliti.");
            } else {
                setStatus("Ekstraksi selesai. Form akan dibuka otomatis.");
            }
            
            setShowForm(true);
            setIsProcessing(false);
            
        } catch (error) {
            console.error("Auto-fill error:", error);
            setStatus("Gagal memproses PDF. Pastikan file valid dan berbasis teks.");
            setMode("click-to-copy");
            setStatus("Auto-fill gagal. Beralih ke mode click-to-copy.");
            setIsProcessing(false);
        }
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
                <div className="flex flex-col gap-4">
                    {/* Mode toggle */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Mode</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMode("auto-fill")}
                                disabled={isProcessing}
                                className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                                    mode === "auto-fill"
                                        ? "bg-zinc-900 text-white"
                                        : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                } disabled:opacity-50`}
                            >
                                Auto-Fill
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("click-to-copy")}
                                disabled={isProcessing}
                                className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                                    mode === "click-to-copy"
                                        ? "bg-zinc-900 text-white"
                                        : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                } disabled:opacity-50`}
                            >
                                Click-to-Copy
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Upload dokumen Bill of Lading berformat pdf</p>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                        className="file-input file-input-bordered w-full max-w-xl border-zinc-300 bg-white disabled:opacity-50"
                    />
                </div>
                
                {/* Loading indicator */}
                {isProcessing && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-900">Memproses PDF...</span>
                    </div>
                )}
                
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

            {/* ShipmentForm modal for auto-fill */}
            {showForm && formInitialData && (
                <ShipmentForm
                    isOpen={showForm}
                    onClose={() => {
                        setShowForm(false);
                        setFormInitialData(null);
                        setExtractionResult(null);
                        // Clear extraction result from memory
                    }}
                    onSubmit={async (data) => {
                        const result = await createShipment(data);
                        if (result.ok) {
                            setStatus("Shipment berhasil disimpan!");
                            // Clear form data from memory after successful save
                            setFormInitialData(null);
                            setExtractionResult(null);
                            // Redirect to shipments page after successful save
                            setTimeout(() => {
                                router.push("/shipments");
                            }, 1000);
                        }
                        return result;
                    }}
                    autoFillData={formInitialData}
                    isAutoFilled={true}
                />
            )}
        </div>
    );
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}
