"use client";

import { Settings, Store, TabletSmartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { CatalogViewer } from "@/components/CatalogViewer";
import { loadCatalogData, nowIso, saveCatalogData, upsertCatalog } from "@/lib/storage";
import type { CatalogData, ViewerMode } from "@/lib/types";

export function CatalogApp() {
  const isAdminEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN !== "false";
  const [data, setData] = useState<CatalogData>({
    catalogs: [],
    pages: [],
    productLinks: [],
    bookmarks: [],
    qrLinks: []
  });
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewerMode>("viewer");
  const [isReady, setIsReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");

  useEffect(() => {
    const loaded = loadCatalogData();
    setData(loaded);
    setActiveCatalogId(loaded.catalogs[0]?.id ?? null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isAdminEnabled && mode === "admin") {
      setMode("viewer");
    }
  }, [isAdminEnabled, mode]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      saveCatalogData(data);
      setStorageWarning("");
    } catch {
      setStorageWarning(
        "ブラウザ保存容量を超えたため、今回のPDFは再読み込み後に残らない可能性があります。本番では外部ストレージ利用を推奨します。"
      );
    }
  }, [data, isReady]);

  const activeCatalog = useMemo(() => {
    return data.catalogs.find((catalog) => catalog.id === activeCatalogId) ?? data.catalogs[0] ?? null;
  }, [activeCatalogId, data.catalogs]);

  const handleDataChange = useCallback((nextData: CatalogData) => {
    setData(nextData);
  }, []);

  const handleCatalogPageCount = useCallback(
    (catalogId: string, totalPages: number) => {
      const catalog = data.catalogs.find((item) => item.id === catalogId);
      if (!catalog || catalog.totalPages === totalPages) {
        return;
      }

      setData((current) =>
        upsertCatalog(current, {
          ...catalog,
          totalPages,
          updatedAt: nowIso()
        })
      );
    },
    [data.catalogs]
  );

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 border-b border-slateLine bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-catalogBlue">
                MVP Catalog
              </p>
              <p className="text-base font-semibold text-navy sm:text-lg">
                {activeCatalog?.title ?? "Digital Catalog Viewer"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.catalogs.length > 0 ? (
              <select
                value={activeCatalog?.id ?? ""}
                onChange={(event) => setActiveCatalogId(event.target.value)}
                className="hidden h-10 max-w-56 rounded-md border border-slateLine bg-white px-3 text-sm outline-none focus:border-catalogBlue sm:block"
                aria-label="カタログ選択"
              >
                {data.catalogs.map((catalog) => (
                  <option value={catalog.id} key={catalog.id}>
                    {catalog.title}
                  </option>
                ))}
              </select>
            ) : null}

            <div
              className={`grid rounded-md border border-slateLine bg-white p-1 ${
                isAdminEnabled ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <button
                type="button"
                onClick={() => setMode("viewer")}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold ${
                  mode === "viewer" ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <TabletSmartphone className="h-4 w-4" />
                閲覧
              </button>
              {isAdminEnabled ? (
                <button
                  type="button"
                  onClick={() => setMode("admin")}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-semibold ${
                    mode === "admin" ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  管理
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {storageWarning ? (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
            {storageWarning}
          </div>
        ) : null}
      </header>

      {mode === "viewer" || !isAdminEnabled ? (
        <CatalogViewer
          catalog={activeCatalog}
          data={data}
          onDataChange={handleDataChange}
          onCatalogPageCount={handleCatalogPageCount}
        />
      ) : (
        <AdminPanel
          data={data}
          activeCatalogId={activeCatalog?.id ?? null}
          onActiveCatalogChange={setActiveCatalogId}
          onDataChange={handleDataChange}
        />
      )}
    </div>
  );
}
