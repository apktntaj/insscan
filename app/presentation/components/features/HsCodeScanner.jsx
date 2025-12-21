"use client";

import React, { useState, useCallback } from "react";
import HsCodeTable from "./HsCodeTable";
import Button from "../common/Button";
import Input from "../common/Input";
import { fileToArrayBuffer, bufferToJson, downloadAsExcel, isExcelFile } from "../../../infrastructure/excel/excel.service";
import { isValidHsCode } from "../../../core/entities/hs-code";

/**
 * HsCodeScanner Component
 * Presentation Layer - Feature-specific component
 *
 * @description Main component for HS Code scanning feature
 */
export default function HsCodeScanner() {
    const [fileData, setFileData] = useState(null);
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
            downloadAsExcel(data, `hs-code-result-${Date.now()}.xlsx`);
            setStatus("Berhasil! File telah diunduh.");
            setFileData(null);
        } catch (error) {
            console.error("Error:", error);
            setStatus("Gagal mengambil data. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }, [fileData]);

    return (
        <div>
            <div className="container space-y-2 p-4 md:flex md:justify-between md:items-center">
                <Input handleChange={handleFileChange} />
                <div className="flex items-center gap-4">
                    {status && <span className="text-sm text-base-content/70">{status}</span>}
                    <Button onClick={handleFetchData} disabled={isLoading || !fileData}>
                        {isLoading ? "Loading..." : "Tarik Data"}
                    </Button>
                </div>
            </div>
            <HsCodeTable fileData={fileData} />
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
