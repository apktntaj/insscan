"use client";

/**
 * ShipmentFormWithPDF Component
 * 
 * Layout: PDF (kiri) + Clipboard Buffer (tengah) + Form (kanan)
 * 
 * Flow:
 * 1. User upload PDF
 * 2. Otomatis Smart-Scan (auto-extract)
 * 3. User klik teks di PDF → masuk ke Clipboard Buffer (max 20 items)
 * 4. User fokus ke field form → popup buffer muncul
 * 5. User pilih item dari buffer → otomatis terisi ke field
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import ShipmentForm from "./ShipmentForm";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const MAX_CLIPBOARD_ITEMS = 20;

export default function ShipmentFormWithPDF({ 
  isOpen, 
  onClose, 
  onSubmit
}) {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [status, setStatus] = useState("");
  
  // Smart-Scan state (disabled for now - clipboard buffer is sufficient)
  const [isProcessing] = useState(false);
  const [autoFillData] = useState(null);
  const [isAutoFilled] = useState(false);
  
  // Clipboard Buffer state
  const [clipboardBuffer, setClipboardBuffer] = useState([]);
  const [activeField, setActiveField] = useState(null);
  
  // Refs
  const lastCopyTextRef = useRef("");
  const formRef = useRef(null);
  
  // processSmartScan function removed - Smart-Scan disabled for MVP
  // Clipboard buffer is sufficient for now

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

    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    setStatus("PDF berhasil dimuat. Klik teks di PDF untuk menambah ke clipboard buffer.");
  }, []);

  const handleTextClick = useCallback((event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.closest(".react-pdf__Page__textContent")) return;

    const rawText = target.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!rawText) return;
    if (rawText === lastCopyTextRef.current) return;

    lastCopyTextRef.current = rawText;
    
    // Add to clipboard buffer (max 20 items, newest first)
    setClipboardBuffer(prev => {
      const newBuffer = [rawText, ...prev.filter(item => item !== rawText)];
      return newBuffer.slice(0, MAX_CLIPBOARD_ITEMS);
    });
    
    setStatus(`✓ "${rawText.slice(0, 40)}${rawText.length > 40 ? '...' : ''}" ditambahkan ke clipboard`);
  }, []);

  const handleDocumentSuccess = useCallback(({ numPages: totalPages }) => {
    setNumPages(totalPages);
  }, []);

  const handleFieldFocus = useCallback((fieldName, event) => {
    setActiveField(fieldName);
  }, []);

  const handleFieldBlur = useCallback(() => {
    setActiveField(null);
  }, []);

  const handleClearBuffer = useCallback(() => {
    setClipboardBuffer([]);
    setStatus("Clipboard buffer dikosongkan");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-[95vw] gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xl">
        
        {/* Left: PDF Preview (40%) */}
        <div className="flex w-[40%] flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">PDF Bill of Lading</h3>
              <p className="text-xs text-zinc-500">Klik teks untuk tambah ke clipboard</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!file && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <svg className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-700">Upload PDF Bill of Lading</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Klik teks di PDF untuk menambah ke clipboard buffer
                </p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="file-input file-input-bordered file-input-sm w-full max-w-xs border-zinc-300 bg-white"
              />
            </div>
          )}

          {file && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-zinc-500">
                  Hal {pageNumber}/{numPages || 1}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                    disabled={pageNumber <= 1}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageNumber((prev) => Math.min(numPages || 1, prev + 1))}
                    disabled={pageNumber >= (numPages || 1)}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP))}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP))}
                    className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {status && (
                <p className="text-xs text-zinc-600">{status}</p>
              )}

              <div className="flex-1 overflow-auto rounded-xl border border-zinc-200 bg-white p-2">
                <div 
                  className="bl-hover-copy cursor-pointer"
                  onClick={handleTextClick}
                >
                  <Document
                    file={fileUrl}
                    onLoadSuccess={handleDocumentSuccess}
                    onLoadError={() => setStatus("Gagal memuat PDF.")}
                    loading={<p className="py-8 text-center text-xs text-zinc-500">Memuat PDF...</p>}
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
            </>
          )}
        </div>

        {/* Center: Clipboard Buffer (20%) */}
        <div className="flex w-[20%] flex-col gap-3 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Clipboard</h3>
              <p className="text-xs text-zinc-500">{clipboardBuffer.length}/{MAX_CLIPBOARD_ITEMS} items</p>
            </div>
            {clipboardBuffer.length > 0 && (
              <button
                type="button"
                onClick={handleClearBuffer}
                className="rounded-lg p-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                title="Clear all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {clipboardBuffer.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-2 text-xs text-zinc-500">Klik teks di PDF untuk menambah item</p>
              </div>
            ) : (
              clipboardBuffer.map((item, index) => (
                <div
                  key={index}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                >
                  <span className="block truncate">{item}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Shipment Form (40%) */}
        <div className="w-[40%] overflow-y-auto" ref={formRef}>
          <ShipmentForm
            isOpen={true}
            onClose={onClose}
            onSubmit={onSubmit}
            autoFillData={autoFillData}
            isAutoFilled={isAutoFilled}
            embedded={true}
            onFieldFocus={handleFieldFocus}
            onFieldBlur={handleFieldBlur}
            activeField={activeField}
            clipboardBuffer={clipboardBuffer}
          />
        </div>
      </div>
    </div>
  );
}
