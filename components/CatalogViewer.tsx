"use client";

import {
  BookmarkIcon,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ListChecks,
  MessageSquareText,
  QrCode,
  ShoppingCart
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { ProductLinksPanel } from "@/components/ProductLinksPanel";
import { QrPanel } from "@/components/QrPanel";
import { ThumbnailStrip } from "@/components/ThumbnailStrip";
import { loadPdfDocument, type LoadedPdf } from "@/lib/pdf";
import { toggleBookmark } from "@/lib/storage";
import type { Catalog, CatalogData, QrLink } from "@/lib/types";

const FlipBookViewer = dynamic(() => import("@/components/FlipBookViewer"), { ssr: false });

type CatalogViewerProps = {
  catalog: Catalog | null;
  data: CatalogData;
  onDataChange: (data: CatalogData) => void;
  onCatalogPageCount: (catalogId: string, totalPages: number) => void;
  variant?: "default" | "embed";
};

type DialogState =
  | { type: "bookmarks" }
  | { type: "products" }
  | { type: "qr"; link: QrLink }
  | null;

export function CatalogViewer({
  catalog,
  data,
  onDataChange,
  onCatalogPageCount,
  variant = "default"
}: CatalogViewerProps) {
  const isEmbed = variant === "embed";
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [isSpread, setIsSpread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const totalPages = catalog?.totalPages ?? pdf?.numPages ?? 0;

  const bookmarks = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return data.bookmarks
      .filter((bookmark) => bookmark.catalogId === catalog.id)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }, [catalog, data.bookmarks]);

  const qrLinks = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return data.qrLinks.filter((link) => link.catalogId === catalog.id);
  }, [catalog, data.qrLinks]);

  const visiblePages = useMemo(() => {
    if (!totalPages) {
      return [];
    }

    if (isSpread) {
      if (currentPage <= 1) {
        return [1];
      }

      const leftPage = currentPage % 2 === 0 ? currentPage : currentPage - 1;
      return [leftPage, leftPage + 1].filter((pageNumber) => pageNumber <= totalPages);
    }

    return [currentPage];
  }, [currentPage, isSpread, totalPages]);

  const visibleProducts = useMemo(() => {
    if (!catalog) {
      return [];
    }

    return data.productLinks.filter(
      (link) => link.catalogId === catalog.id && visiblePages.includes(link.pageNumber)
    );
  }, [catalog, data.productLinks, visiblePages]);

  const isBookmarked = useMemo(() => {
    if (!catalog) {
      return false;
    }

    return data.bookmarks.some(
      (bookmark) => bookmark.catalogId === catalog.id && bookmark.pageNumber === currentPage
    );
  }, [catalog, currentPage, data.bookmarks]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsSpread(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!catalog?.pdfUrl) {
      setPdf(null);
      setCurrentPage(1);
      setPageInput("1");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    loadPdfDocument(catalog.pdfUrl)
      .then((loadedPdf) => {
        if (cancelled) {
          loadedPdf.destroy();
          return;
        }

        setPdf(loadedPdf);
        setCurrentPage(1);
        setPageInput("1");

        if (loadedPdf.numPages !== catalog.totalPages) {
          onCatalogPageCount(catalog.id, loadedPdf.numPages);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("PDFを読み込めませんでした。別のPDFで再度お試しください。");
          setPdf(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalog?.id, catalog?.pdfUrl, catalog?.totalPages, onCatalogPageCount]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (!totalPages) {
        return;
      }

      const normalized = Math.min(totalPages, Math.max(1, pageNumber));
      setCurrentPage(normalized);
      setPageInput(String(normalized));
    },
    [totalPages]
  );

  const goNext = useCallback(() => {
    const step = isSpread && currentPage > 1 ? 2 : 1;
    goToPage(currentPage + step);
  }, [currentPage, goToPage, isSpread]);

  const goPrev = useCallback(() => {
    const step = isSpread && currentPage > 2 ? 2 : 1;
    goToPage(currentPage - step);
  }, [currentPage, goToPage, isSpread]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        goNext();
      }

      if (event.key === "ArrowLeft") {
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  function submitPageJump(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(pageInput);
    if (Number.isFinite(parsed)) {
      goToPage(parsed);
    }
  }

  function handleBookmarkToggle() {
    if (!catalog) {
      return;
    }

    onDataChange(toggleBookmark(data, catalog.id, currentPage));
  }

  if (!catalog) {
    return (
      <section className={isEmbed ? "grid min-h-screen place-items-center px-4" : "grid min-h-[72vh] place-items-center px-4"}>
        <div className="max-w-xl rounded-lg border border-slateLine bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-catalogBlue" />
          <h1 className="mt-4 text-xl font-semibold text-navy">PDFカタログをアップロードしてください</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            管理画面からPDFを追加すると、ページ表示・ブックマーク・商品リンク・QRコードのMVPを試せます。
          </p>
        </div>
      </section>
    );
  }

  const inquiryLink = qrLinks.find((link) => link.type === "inquiry") ?? qrLinks[0];
  const orderLink = qrLinks.find((link) => link.type === "order") ?? qrLinks[1];

  return (
    <div className={isEmbed ? "flex min-h-screen flex-col bg-slate-100 text-ink" : "flex min-h-[calc(100vh-72px)] flex-col"}>
      {!isEmbed ? (
      <div className="border-b border-slateLine bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-catalogBlue">
              Digital Catalog
            </p>
            <h1 className="text-lg font-semibold text-navy sm:text-xl">{catalog.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {inquiryLink ? (
              <button
                type="button"
                onClick={() => setDialog({ type: "qr", link: inquiryLink })}
                className="inline-flex items-center gap-2 rounded-md border border-slateLine bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-catalogBlue"
              >
                <MessageSquareText className="h-4 w-4" />
                問い合わせ
              </button>
            ) : null}
            {orderLink ? (
              <button
                type="button"
                onClick={() => setDialog({ type: "qr", link: orderLink })}
                className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <ShoppingCart className="h-4 w-4" />
                発注
              </button>
            ) : null}
          </div>
        </div>
      </div>
      ) : null}

      <main
        className={
          isEmbed
            ? "grid w-full flex-1 grid-cols-1 gap-3 px-2 py-2 sm:px-3 sm:py-3"
            : "mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]"
        }
      >
        <section className="min-w-0">
          <div
            className={`relative flex items-center justify-center rounded-lg border border-slateLine bg-slate-100 p-3 shadow-inner sm:p-5 ${
              isEmbed ? "min-h-[calc(100vh-132px)]" : "min-h-[58vh]"
            }`}
          >
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-navy shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              disabled={currentPage <= 1}
              aria-label="前のページ"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {isLoading ? (
              <div className="text-sm text-slate-500">PDFを読み込んでいます</div>
            ) : error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-5xl">
                <FlipBookViewer
                  pdf={pdf}
                  totalPages={totalPages}
                  targetPage={currentPage}
                  onPageChange={(pageNumber) => {
                    setCurrentPage(pageNumber);
                    setPageInput(String(pageNumber));
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-navy shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              disabled={currentPage >= totalPages}
              aria-label="次のページ"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slateLine bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>
                {currentPage} / {totalPages || "-"} ページ
              </span>
              {isSpread ? <span className="hidden sm:inline">見開き表示</span> : null}
            </div>
            <form onSubmit={submitPageJump} className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={totalPages || 1}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                className="h-10 w-20 rounded-md border border-slateLine px-3 text-sm outline-none focus:border-catalogBlue"
                aria-label="移動するページ番号"
              />
              <button
                type="submit"
                className="h-10 rounded-md border border-slateLine px-3 text-sm font-semibold text-navy hover:border-catalogBlue"
              >
                移動
              </button>
            </form>
            <div className="flex items-center gap-2">
              {isEmbed && visibleProducts.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDialog({ type: "products" })}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slateLine bg-white px-3 text-sm font-semibold text-navy hover:border-catalogBlue"
                >
                  <ExternalLink className="h-4 w-4" />
                  商品リンク
                </button>
              ) : null}
              {isEmbed && inquiryLink ? (
                <button
                  type="button"
                  onClick={() => setDialog({ type: "qr", link: inquiryLink })}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slateLine bg-white px-3 text-sm font-semibold text-navy hover:border-catalogBlue"
                >
                  <MessageSquareText className="h-4 w-4" />
                  問い合わせ
                </button>
              ) : null}
              {isEmbed && orderLink ? (
                <button
                  type="button"
                  onClick={() => setDialog({ type: "qr", link: orderLink })}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-navy px-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <ShoppingCart className="h-4 w-4" />
                  発注
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold ${
                  isBookmarked
                    ? "bg-blue-50 text-catalogBlue"
                    : "border border-slateLine bg-white text-navy hover:border-catalogBlue"
                }`}
              >
                <BookmarkIcon className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} />
                {isBookmarked ? "保存済み" : "ブックマーク"}
              </button>
              <button
                type="button"
                onClick={() => setDialog({ type: "bookmarks" })}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slateLine bg-white px-3 text-sm font-semibold text-navy hover:border-catalogBlue"
              >
                <ListChecks className="h-4 w-4" />
                一覧
              </button>
            </div>
          </div>
        </section>

        {!isEmbed ? (
        <aside className="space-y-4">
          <section className="rounded-lg border border-slateLine bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-navy">表示中の商品リンク</h2>
              <button
                type="button"
                onClick={() => setDialog({ type: "products" })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-catalogBlue hover:underline"
              >
                全て見る
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
            <ProductLinksPanel links={visibleProducts} />
          </section>

          <section className="rounded-lg border border-slateLine bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-navy">QRリンク</h2>
            <div className="mt-3 grid gap-2">
              {qrLinks.length > 0 ? (
                qrLinks.map((link) => (
                  <button
                    type="button"
                    key={link.id}
                    onClick={() => setDialog({ type: "qr", link })}
                    className="flex items-center justify-between rounded-md border border-slateLine px-3 py-2 text-left text-sm hover:border-catalogBlue"
                  >
                    <span className="font-medium text-slate-700">{link.label}</span>
                    <QrCode className="h-4 w-4 text-catalogBlue" />
                  </button>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  管理画面で問い合わせURLや発注URLを登録するとQRコードを表示できます。
                </p>
              )}
            </div>
          </section>
        </aside>
        ) : null}
      </main>

      <ThumbnailStrip
        pdf={pdf}
        totalPages={totalPages}
        currentPage={currentPage}
        onSelectPage={(pageNumber) => goToPage(pageNumber)}
      />

      {dialog?.type === "bookmarks" ? (
        <Modal title="ブックマーク一覧" onClose={() => setDialog(null)}>
          {bookmarks.length > 0 ? (
            <div className="grid gap-2">
              {bookmarks.map((bookmark) => (
                <button
                  type="button"
                  key={bookmark.id}
                  onClick={() => {
                    goToPage(bookmark.pageNumber);
                    setDialog(null);
                  }}
                  className="flex items-center justify-between rounded-md border border-slateLine px-4 py-3 text-left hover:border-catalogBlue"
                >
                  <span className="font-semibold text-navy">ページ {bookmark.pageNumber}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(bookmark.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">まだブックマークはありません。</p>
          )}
        </Modal>
      ) : null}

      {dialog?.type === "products" ? (
        <Modal title="商品リンク一覧" onClose={() => setDialog(null)}>
          <ProductLinksPanel
            links={data.productLinks.filter((link) => link.catalogId === catalog.id)}
          />
        </Modal>
      ) : null}

      {dialog?.type === "qr" ? (
        <Modal title={dialog.link.label} onClose={() => setDialog(null)}>
          <QrPanel link={dialog.link} />
        </Modal>
      ) : null}
    </div>
  );
}
