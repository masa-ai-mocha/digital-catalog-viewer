"use client";

import { useEffect, useRef, useState } from "react";
import type { LoadedPdf } from "@/lib/pdf";

type PdfCanvasPageProps = {
  pdf: LoadedPdf | null;
  pageNumber: number;
  className?: string;
  label?: string;
  onClick?: () => void;
};

export function PdfCanvasPage({
  pdf,
  pageNumber,
  className = "",
  label,
  onClick
}: PdfCanvasPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => setContainerWidth(Math.max(1, node.clientWidth));
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !containerWidth || pageNumber < 1) {
      return;
    }

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const canvasContext = context;

    async function renderPage() {
      setIsRendering(true);
      try {
        const page = await pdf!.getPage(pageNumber);
        if (cancelled) {
          return;
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const cssScale = containerWidth / baseViewport.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const renderViewport = page.getViewport({ scale: cssScale * dpr });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
        canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({
          canvasContext,
          viewport: renderViewport
        });
        await renderTask.promise;
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, containerWidth]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-md bg-white ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label ?? `ページ ${pageNumber}`}
    >
      <canvas ref={canvasRef} className="block w-full bg-white" />
      {isRendering ? (
        <div className="absolute inset-0 grid place-items-center bg-white/60 text-xs text-slate-500">
          読み込み中
        </div>
      ) : null}
    </div>
  );
}
