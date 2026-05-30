export type Catalog = {
  id: string;
  title: string;
  pdfUrl: string;
  totalPages: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogPage = {
  id: string;
  catalogId: string;
  pageNumber: number;
  imageUrl?: string;
  canvasData?: string;
  thumbnailUrl?: string;
};

export type ProductLink = {
  id: string;
  catalogId: string;
  pageNumber: number;
  productName: string;
  productCode: string;
  productUrl: string;
  description: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
};

export type Bookmark = {
  id: string;
  catalogId: string;
  pageNumber: number;
  createdAt: string;
};

export type QrLinkType = "inquiry" | "order" | "custom";

export type QrLink = {
  id: string;
  catalogId: string;
  type: QrLinkType;
  label: string;
  url: string;
  description: string;
};

export type CatalogData = {
  catalogs: Catalog[];
  pages: CatalogPage[];
  productLinks: ProductLink[];
  bookmarks: Bookmark[];
  qrLinks: QrLink[];
};

export type ViewerMode = "viewer" | "admin";
