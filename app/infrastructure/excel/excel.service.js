/**
 * Excel Service
 * Infrastructure Layer - File handling utilities
 *
 * @description Handles Excel file reading and writing operations
 */

import * as XLSX from "xlsx";

/**
 * Converts a File object to ArrayBuffer
 * @param {File} file - File to convert
 * @returns {Promise<ArrayBuffer>}
 */
export function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converts buffer to JSON data
 * @param {ArrayBuffer} buffer - Excel file buffer
 * @returns {Array<Array>} 2D array of cell data
 */
export function bufferToJson(buffer) {
  const result = [];
  const workbook = XLSX.read(buffer, { type: "buffer" });

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    result.push(...sheetData);
  }

  return result;
}

/**
 * Creates and downloads an Excel file from data
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} [filename="output.xlsx"] - Output filename
 */
export function downloadAsExcel(data, filename = "output.xlsx") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
  XLSX.writeFile(workbook, filename);
}

/**
 * Validates if file has Excel extension
 * @param {string} filename - Filename to check
 * @returns {boolean}
 */
export function isExcelFile(filename) {
  const extension = filename?.split(".").pop()?.toLowerCase();
  return extension === "xls" || extension === "xlsx";
}
