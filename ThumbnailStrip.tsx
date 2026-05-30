"use client";

import { PdfCanvasPage } from "@/components/PdfCanvasPage";
import type { LoadedPdf } from "@/lib/pdf";

type ThumbnailStripProps = {
  pdf: LoadedPdf | null;
  totalPages: number;
  currentPage: number;
  onSelectPage: (pageNumber: number) => void;
};

export function ThumbnailStrip({
  pdf,
  totalPages,
  currentPage,
  onSelectPage
}: ThumbnailStripProps) {
  if (!pdf || totalPages < 1) {
    return null;
  }

  return (
    <div className="overflow-x-auto border-t border-slateLine bg-white/90 px-4 py-3">
      <div className="flex min-w-max gap-3">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
          const isActive = pageNumber === currentPage;

          return (
            <button
              type="button"
              key={pageNumber}
              onClick={() => onSelectPage(pageNumber)}
              className={`w-20 shrink-0 rounded-md border p-1 text-left transition sm:w-24 ${
                isActive
                  ? "border-catalogBlue bg-blue-50 shadow-sm"
                  : "border-slateLine bg-white hover:border-slate-400"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <PdfCanvasPage
                pdf={pdf}
                pageNumber={pageNumber}
                className="aspect-[3/4] w-full shadow-sm"
              />
              <span className="mt-1 block text-center text-xs font-medium text-slate-600">
                {pageNumber}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
