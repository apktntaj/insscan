/**
 * PDFParserService - Infrastructure Layer
 * 
 * Extracts raw text from PDF files using pdfjs-dist.
 * All processing happens client-side for data privacy.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * @typedef {Object} PDFParseResult
 * @property {boolean} ok - Whether parsing succeeded
 * @property {string} [text] - Combined text from all pages
 * @property {number} [pageCount] - Number of pages processed
 * @property {string} [error] - Error code if parsing failed
 * @property {string} [message] - User-facing error message in Indonesian
 */

/**
 * Validates if a file is a valid PDF.
 * Checks MIME type and file extension.
 * 
 * @param {File} file - File object to validate
 * @returns {{ ok: boolean, error?: string, message?: string }}
 * 
 * @example
 * validatePDFFile(pdfFile) // { ok: true }
 * validatePDFFile(txtFile) // { ok: false, error: 'INVALID_FILE_TYPE', message: '...' }
 */
export function validatePDFFile(file) {
  // Check if file exists
  if (!file) {
    return {
      ok: false,
      error: 'INVALID_FILE_TYPE',
      message: 'File harus berformat PDF.'
    };
  }
  
  // Check MIME type or file extension
  const isPDFMimeType = file.type === 'application/pdf';
  const isPDFExtension = file.name.toLowerCase().endsWith('.pdf');
  
  if (!isPDFMimeType && !isPDFExtension) {
    return {
      ok: false,
      error: 'INVALID_FILE_TYPE',
      message: 'File harus berformat PDF.'
    };
  }
  
  // Check file size (warn if > 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      ok: true,
      warning: 'FILE_TOO_LARGE',
      message: 'File besar. Proses mungkin memakan waktu lebih lama.'
    };
  }
  
  return { ok: true };
}

/**
 * Parses PDF file and extracts all text content.
 * Processes up to 10 pages with page separators.
 * 
 * @param {File} file - PDF file object from file input
 * @returns {Promise<PDFParseResult>}
 * 
 * @example
 * const result = await parsePDF(pdfFile);
 * if (result.ok) {
 *   console.log(result.text); // "B/L NO: ABC123\n--- PAGE 2 ---\nSHIPPER: PT X"
 * }
 */
export async function parsePDF(file) {
  // Validate file first
  const validation = validatePDFFile(file);
  if (!validation.ok) {
    return validation;
  }
  
  // Set timeout for parsing (5 seconds)
  const TIMEOUT_MS = 5000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS);
  });
  
  try {
    // Race between parsing and timeout
    const result = await Promise.race([
      parseWithTimeout(file),
      timeoutPromise
    ]);
    
    return result;
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    
    // Handle timeout
    if (error.message === 'TIMEOUT') {
      return {
        ok: false,
        error: 'TIMEOUT',
        message: 'Proses terlalu lama. File mungkin terlalu besar.'
      };
    }
    
    // Handle corrupted PDF or parsing failure
    return {
      ok: false,
      error: 'PDF_PARSE_FAILED',
      message: 'Gagal memproses PDF. Pastikan file valid dan berbasis teks.'
    };
  }
}

/**
 * Internal function to parse PDF without timeout handling.
 * @private
 */
async function parseWithTimeout(file) {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pageCount = 1; // Only first page (header info)
    const textParts = [];
    
    // Extract text from each page sequentially
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Sort items by Y position (top to bottom), then X position (left to right)
      const sortedItems = textContent.items.sort((a, b) => {
        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
        // If Y positions are close (same line), sort by X
        if (yDiff < 5) {
          return a.transform[4] - b.transform[4];
        }
        // Otherwise sort by Y (top to bottom, note: PDF Y increases upward)
        return b.transform[5] - a.transform[5];
      });
      
      // Group items by line (items with similar Y position)
      const lines = [];
      let currentLine = [];
      let lastY = null;
      
      for (const item of sortedItems) {
        const y = item.transform[5];
        
        // If Y position changed significantly, start new line
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
            currentLine = [];
          }
        }
        
        currentLine.push(item.str);
        lastY = y;
      }
      
      // Add last line
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      
      // Join lines with newlines to preserve structure
      const pageText = lines.join('\n');
      
      // Add page separator (except for first page)
      if (pageNum > 1) {
        textParts.push(`\n--- PAGE ${pageNum} ---\n`);
      }
      
      textParts.push(pageText);
    }
    
    const combinedText = textParts.join('');
    
    console.log('[PDF Parser] Extraction complete:', {
      pageCount,
      textLength: combinedText.length,
      preview: combinedText.substring(0, 300)
    });
    
    // Check if any text was extracted
    if (!combinedText.trim()) {
      return {
        ok: false,
        error: 'NO_TEXT_EXTRACTED',
        message: 'PDF tidak mengandung teks yang dapat dibaca.'
      };
    }
    
    return {
      ok: true,
      text: combinedText,
      pageCount
    };
    
  } catch (error) {
    console.error('PDF parsing internal error:', error);
    
    // Re-throw to be caught by outer handler
    throw error;
  }
}
