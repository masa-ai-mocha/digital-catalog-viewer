"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { PdfCanvasPage } from "@/components/PdfCanvasPage";
import type { LoadedPdf } from "@/lib/pdf";

type FlipBookHandle = {
  pageFlip: () => {
    flip: (pageIndex: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
    getCurrentPageIndex: () => number;
  };
};

type FlipPageProps = {
  pdf: LoadedPdf | null;
  pageNumber: number;
  totalPages: number;
};

const FlipPage = React.forwardRef<HTMLDivElement, FlipPageProps>(
  ({ pdf, pageNumber, totalPages }, ref) => (
    <div ref={ref} className="relative overflow-hidden bg-white">
      <PdfCanvasPage
        pdf={pdf}
        pageNumber={pageNumber}
        className="h-full w-full rounded-none"
        label={`ページ ${pageNumber}`}
      />
      <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm">
        {pageNumber} / {totalPages}
      </span>
    </div>
  )
);

FlipPage.displayName = "FlipPage";

type FlipBookViewerProps = {
  pdf: LoadedPdf | null;
  totalPages: number;
  targetPage: number;
  onPageChange: (pageNumber: number) => void;
};

const MIN_PAGE_WIDTH = 280;
const MAX_PAGE_WIDTH = 800;
const PAGE_ASPECT_RATIO = 1.414;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FlipBookViewer({
  pdf,
  totalPages,
  targetPage,
  onPageChange
}: FlipBookViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<FlipBookHandle | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);

  const pageWidth = clamp(
    Math.floor(isPortrait ? containerWidth - 16 : containerWidth / 2 - 16),
    MIN_PAGE_WIDTH,
    MAX_PAGE_WIDTH
  );
  const pageHeight = Math.floor(pageWidth * PAGE_ASPECT_RATIO);

  const getCurrentPageIndex = useCallback(() => {
    return bookRef.current?.pageFlip().getCurrentPageIndex() ?? 0;
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      setContainerWidth(Math.max(1, node.clientWidth));
      setIsPortrait(window.innerWidth < 768);
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    if (!bookRef.current || totalPages < 1) {
      return;
    }

    const targetIndex = clamp(targetPage - 1, 0, totalPages - 1);
    if (getCurrentPageIndex() !== targetIndex) {
      bookRef.current.pageFlip().flip(targetIndex);
    }
  }, [getCurrentPageIndex, targetPage, totalPages]);

  function syncPageFromFlipBook(eventPageIndex?: number) {
    const currentIndex =
      typeof eventPageIndex === "number" ? eventPageIndex : getCurrentPageIndex();
    onPageChange(clamp(currentIndex + 1, 1, totalPages));
  }

  function handlePageAreaClick(event: React.MouseEvent<HTMLDivElement>) {
    if (pointerMovedRef.current || !bookRef.current) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;

    if (x > bounds.width / 2) {
      bookRef.current.pageFlip().flipNext();
    } else {
      bookRef.current.pageFlip().flipPrev();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerMovedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    if (!start) {
      return;
    }

    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (distance > 8) {
      pointerMovedRef.current = true;
    }
  }

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {!pdf || totalPages < 1 || containerWidth < 1 ? (
        <div className="grid min-h-[420px] w-full place-items-center">
          <span className="text-sm text-slate-500">ページを準備しています</span>
        </div>
      ) : (
      <div
        className="flex justify-center"
        style={{
          width: isPortrait ? pageWidth : pageWidth * 2,
          maxWidth: "100%",
          minHeight: pageHeight
        }}
        onClick={handlePageAreaClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          pointerStartRef.current = null;
        }}
      >
        <HTMLFlipBook
          ref={bookRef}
          width={pageWidth}
          height={pageHeight}
          size="stretch"
          minWidth={MIN_PAGE_WIDTH}
          maxWidth={MAX_PAGE_WIDTH}
          minHeight={Math.floor(MIN_PAGE_WIDTH * PAGE_ASPECT_RATIO)}
          maxHeight={Math.floor(MAX_PAGE_WIDTH * PAGE_ASPECT_RATIO)}
          showCover={true}
          flippingTime={700}
          usePortrait={isPortrait}
          startPage={0}
          drawShadow={true}
          mobileScrollSupport={false}
          swipeDistance={30}
          startZIndex={10}
          autoSize={true}
          maxShadowOpacity={0.3}
          clickEventForward={true}
          useMouseEvents={true}
          showPageCorners={true}
          disableFlipByClick={true}
          renderOnlyPageLengthChange={false}
          className="shadow-page"
          style={{}}
          onFlip={(event: { data: number }) => syncPageFromFlipBook(event.data)}
          onInit={() => syncPageFromFlipBook()}
          onUpdate={() => syncPageFromFlipBook()}
        >
          {Array.from({ length: totalPages }, (_, index) => (
            <FlipPage
              key={index + 1}
              pdf={pdf}
              pageNumber={index + 1}
              totalPages={totalPages}
            />
          ))}
        </HTMLFlipBook>
      </div>
      )}
    </div>
  );
}

export default FlipBookViewer;
