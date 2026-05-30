import type { CatalogData } from "@/lib/types";

const publishedAt = "2026-05-30T00:00:00.000Z";

export const stage1CatalogData: CatalogData = {
  catalogs: [
    {
      id: "stage1-catalog",
      title: process.env.NEXT_PUBLIC_STAGE1_CATALOG_TITLE || "確認用デジタルカタログ",
      pdfUrl: process.env.NEXT_PUBLIC_STAGE1_PDF_URL || "/catalogs/stage1-catalog.pdf",
      totalPages: Number(process.env.NEXT_PUBLIC_STAGE1_TOTAL_PAGES || 2),
      createdAt: publishedAt,
      updatedAt: publishedAt
    }
  ],
  pages: [],
  productLinks: [
    {
      id: "stage1-product-1",
      catalogId: "stage1-catalog",
      pageNumber: 1,
      productName: "サンプル商品 CLOUD",
      productCode: "CLD-001",
      productUrl: process.env.NEXT_PUBLIC_STAGE1_PRODUCT_URL_1 || "https://example.com/products/cloud",
      description: "第1段階の動作確認用商品リンクです。実運用時は実際の商品ページURLに変更してください。",
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0
    },
    {
      id: "stage1-product-2",
      catalogId: "stage1-catalog",
      pageNumber: 2,
      productName: "サンプル商品 BLANC",
      productCode: "BLC-002",
      productUrl: process.env.NEXT_PUBLIC_STAGE1_PRODUCT_URL_2 || "https://example.com/products/blanc",
      description: "ページ別の商品導線確認用リンクです。",
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0
    }
  ],
  bookmarks: [],
  qrLinks: [
    {
      id: "stage1-qr-inquiry",
      catalogId: "stage1-catalog",
      type: "inquiry",
      label: "お問い合わせ",
      url: process.env.NEXT_PUBLIC_STAGE1_INQUIRY_URL || "https://example.com/contact",
      description: "スマホで読み取って問い合わせページを開けます。"
    },
    {
      id: "stage1-qr-order",
      catalogId: "stage1-catalog",
      type: "order",
      label: "発注ページ",
      url: process.env.NEXT_PUBLIC_STAGE1_ORDER_URL || "https://example.com/order",
      description: "スマホで読み取って発注ページを開けます。"
    }
  ]
};
