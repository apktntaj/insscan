import axios from "axios";
import * as XLSX from "xlsx";
import { inswData } from "./excel";

/**
 * Converts a file object to an ArrayBuffer.
 * @param {File} files - The file object to convert.
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the converted ArrayBuffer.
 */

export function arrayBuffer(files) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsArrayBuffer(files);
  });
}

/**
 * Converts a buffer containing Excel data to JSON format.
 * @param {Buffer} buffer - The buffer containing the Excel data.
 * @returns {Array} - The JSON data extracted from the Excel sheet.
 */
export function convertBufferToJson(buffer) {
  const result = [];

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetNames = workbook.SheetNames;

  for (let i = 0; i < sheetNames.length; i++) {
    const worksheet = workbook.Sheets[sheetNames[i]];
    const temp = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    result.push(...temp);
  }
  // const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  return result;
}

export async function dataInsw(item) {
  let hsCode = item["HS Code"].toString();

  try {
    const response = await axios.get(
      `https://api.insw.go.id/api-prod-ba/ref/hscode/komoditas?hs_code=${hsCode}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
          authorization: "Basic aW5zd18yOmJhYzJiYXM2",

          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    const html = response.data;
    const data = html.data[0];

    // TARIF
    item["BM"] = data["new_mfn"][0]["bm"][0]["bm"];
    item["PPN"] = data["new_mfn"][0]["ppn"][0]["ppn"];
    item["PPH"] = data["new_mfn"][0]["pph"][0]["pph"];

    // LARTAS
    item["lartas_import"] = data.import_regulation.length ? "Ada" : "-";
    item["lartas_border"] = data.import_regulation_border.length ? "Ada" : "-";
    item["lartas_post_border"] = data.import_regulation_post_border.length
      ? "Ada"
      : "-";
    item["lartas_export"] = data.export_regulation.length ? "Ada" : "-";
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("wkwk", error);
  }
}

export function isValidFormat(x) {
  const str = String(x);
  const pattern = /^\d+$/;
  return pattern.test(str) && str.length === 8;
}

/**
 * Formats the HS code by adding dots between the year, month, and day.
 * @param {string} hsCode - The HS code to be formatted.
 * @returns {string} The formatted HS code.
 */
export function hsCodeFormat(hsCode) {
  return String(hsCode).replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
}

export async function fetchedData(hsCodes) {
  const uniqueHsCodes = [...new Set(hsCodes.map((item) => item["HS CODE"]))];
  const response = await Promise.allSettled(
    uniqueHsCodes.map((hsCode) => inswData(hsCode))
  );

  return response.map((data) => data.value?.data[0]);
}

/**
 * Executes the provided function on the categories data obtained from hsWithIntr.
 * @param {Object} hsWithIntr - The object containing the categories data.
 * @param {Function} fn - The function to be executed on the categories data (mfn, new_mfn).
 * @returns {Object} - The result of executing the provided function on the categories data.
 */
export function categoryIntr(hsWithIntr, fn) {
  const categories = hsWithIntr.value?.data[0];

  if (!categories) return { message: "Data tidak ada" };

  return fn(categories);
}

/**
 * Generates an Excel file from the given data.
 * @param {Array} data - The data to be converted to Excel.
 * @returns {void} - The Excel file is saved to disk.
 */
export function makeExcel(data) {
  const column = Object.keys(data[0]);

  const cleanedData = data.map((item) => {
    const cleanedItem = {};
    for (const key in item) {
      if (typeof item[key] === "string") {
        cleanedItem[key] = item[key].replace(/\s/g, "").replace("%", "");
      } else {
        cleanedItem[key] = item[key];
      }
    }

    return cleanedItem;
  });

  const ws = XLSX.utils.json_to_sheet(cleanedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.utils.sheet_add_aoa(ws, [column], { origin: "A1" });

  const filePath = "hasil-cek-tarif.xlsx";
  XLSX.writeFile(wb, filePath);

  return filePath;
}
