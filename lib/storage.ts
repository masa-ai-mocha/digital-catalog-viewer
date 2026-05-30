import type { Bookmark, Catalog, CatalogData, ProductLink, QrLink } from "@/lib/types";
import { stage1CatalogData } from "@/lib/stage1Catalog";

const STORAGE_KEY = "digital-catalog-viewer:v1";

export const emptyCatalogData: CatalogData = {
  catalogs: [],
  pages: [],
  productLinks: [],
  bookmarks: [],
  qrLinks: []
};

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function loadCatalogData(): CatalogData {
  if (typeof window === "undefined") {
    return stage1CatalogData;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return stage1CatalogData;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CatalogData>;
    if (!parsed.catalogs || parsed.catalogs.length === 0) {
      return stage1CatalogData;
    }

    return {
      catalogs: parsed.catalogs ?? [],
      pages: parsed.pages ?? [],
      productLinks: parsed.productLinks ?? [],
      bookmarks: parsed.bookmarks ?? [],
      qrLinks: parsed.qrLinks ?? []
    };
  } catch {
    return emptyCatalogData;
  }
}

export function saveCatalogData(data: CatalogData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function upsertCatalog(data: CatalogData, catalog: Catalog): CatalogData {
  const exists = data.catalogs.some((item) => item.id === catalog.id);
  return {
    ...data,
    catalogs: exists
      ? data.catalogs.map((item) => (item.id === catalog.id ? catalog : item))
      : [catalog, ...data.catalogs]
  };
}

export function deleteCatalog(data: CatalogData, catalogId: string): CatalogData {
  return {
    catalogs: data.catalogs.filter((catalog) => catalog.id !== catalogId),
    pages: data.pages.filter((page) => page.catalogId !== catalogId),
    productLinks: data.productLinks.filter((link) => link.catalogId !== catalogId),
    bookmarks: data.bookmarks.filter((bookmark) => bookmark.catalogId !== catalogId),
    qrLinks: data.qrLinks.filter((link) => link.catalogId !== catalogId)
  };
}

export function toggleBookmark(
  data: CatalogData,
  catalogId: string,
  pageNumber: number
): CatalogData {
  const existing = data.bookmarks.find(
    (bookmark) => bookmark.catalogId === catalogId && bookmark.pageNumber === pageNumber
  );

  if (existing) {
    return {
      ...data,
      bookmarks: data.bookmarks.filter((bookmark) => bookmark.id !== existing.id)
    };
  }

  const bookmark: Bookmark = {
    id: createId("bookmark"),
    catalogId,
    pageNumber,
    createdAt: nowIso()
  };

  return {
    ...data,
    bookmarks: [...data.bookmarks, bookmark]
  };
}

export function upsertProductLink(data: CatalogData, link: ProductLink): CatalogData {
  const exists = data.productLinks.some((item) => item.id === link.id);
  return {
    ...data,
    productLinks: exists
      ? data.productLinks.map((item) => (item.id === link.id ? link : item))
      : [...data.productLinks, link]
  };
}

export function deleteProductLink(data: CatalogData, linkId: string): CatalogData {
  return {
    ...data,
    productLinks: data.productLinks.filter((link) => link.id !== linkId)
  };
}

export function upsertQrLink(data: CatalogData, link: QrLink): CatalogData {
  const exists = data.qrLinks.some((item) => item.id === link.id);
  return {
    ...data,
    qrLinks: exists
      ? data.qrLinks.map((item) => (item.id === link.id ? link : item))
      : [...data.qrLinks, link]
  };
}

export function deleteQrLink(data: CatalogData, linkId: string): CatalogData {
  return {
    ...data,
    qrLinks: data.qrLinks.filter((link) => link.id !== linkId)
  };
}
