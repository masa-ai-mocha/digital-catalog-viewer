"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CatalogViewer } from "@/components/CatalogViewer";
import { loadCatalogData, nowIso, saveCatalogData, upsertCatalog } from "@/lib/storage";
import type { CatalogData } from "@/lib/types";

export function EmbedCatalogApp() {
  const [data, setData] = useState<CatalogData>({
    catalogs: [],
    pages: [],
    productLinks: [],
    bookmarks: [],
    qrLinks: []
  });
  const [activeCatalogId, setActiveCatalogId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loaded = loadCatalogData();
    setData(loaded);
    setActiveCatalogId(loaded.catalogs[0]?.id ?? null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      saveCatalogData(data);
    } catch {
      // 埋め込み表示では容量警告を出さず、閲覧体験を優先します。
    }
  }, [data, isReady]);

  const activeCatalog = useMemo(() => {
    return data.catalogs.find((catalog) => catalog.id === activeCatalogId) ?? data.catalogs[0] ?? null;
  }, [activeCatalogId, data.catalogs]);

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
    <CatalogViewer
      catalog={activeCatalog}
      data={data}
      onDataChange={setData}
      onCatalogPageCount={handleCatalogPageCount}
      variant="embed"
    />
  );
}
