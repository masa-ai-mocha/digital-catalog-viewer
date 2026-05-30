"use client";

import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export type LoadedPdf = PDFDocumentProxy;

export async function loadPdfDocument(pdfUrl: string) {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  return loadingTask.promise;
}

export async function getPdfPageCount(pdfUrl: string) {
  const pdf = await loadPdfDocument(pdfUrl);
  return pdf.numPages;
}
