"use client";

import React from "react";
import Alert from "../common/Alert";
import Row from "../common/Row";
import { isValidHsCode } from "../../../core/entities/hs-code";

/**
 * HsCodeTable Component
 * Presentation Layer - Feature-specific component
 *
 * @description Displays HS codes from uploaded Excel file
 */
export default function HsCodeTable({ fileData }) {
    if (!fileData) {
        return <Alert message="Masukkan file terlebih dahulu" />;
    }

    const rows = extractValidHsCodes(fileData);

    if (rows.length === 0) {
        return <Alert message="Opps Tidak ada data HS Code yang ditemukan" variant="warning" />;
    }

    return (
        <div className="overflow-x-auto max-h-80">
            <table className="table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>HS Code</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((code, idx) => (
                        <tr className="hover" key={idx}>
                            <td>{idx + 1}</td>
                            <Row rowCells={code} />
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Extracts valid HS codes from file data
 * @param {Array<Array>} fileData - 2D array from Excel
 * @returns {string[]} Array of valid HS codes
 */
function extractValidHsCodes(fileData) {
    return fileData
        .filter((row) => row.length !== 0)
        .flatMap((row) => row.filter((cell) => isValidHsCode(cell)));
}
