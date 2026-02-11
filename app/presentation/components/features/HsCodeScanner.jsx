"use client";

import React, { useState, useCallback } from "react";
import HsCodeTable from "./HsCodeTable";
import Button from "../common/Button";
import Input from "../common/Input";
import { fileToArrayBuffer, bufferToJson, isExcelFile } from "../../../infrastructure/excel/excel.service";
import { isValidHsCode } from "../../../core/entities/hs-code";

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

        setIsLoading(true);
        setStatus("Loading...");

        const hsCodes = extractHsCodes(fileData);

        try {
            const response = await fetch("/api/hs-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(hsCodes.map((hs) => ({ hs_code: hs }))),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            setResultData(data);
            setStatus(`Berhasil! ${data.length} data HS Code ditampilkan.`);
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

            <HsCodeTable fileData={fileData} resultData={resultData} />
        </div>
    );
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
