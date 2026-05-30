"use client";

import { FilePlus2, Link2, Plus, QrCode, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { getPdfPageCount } from "@/lib/pdf";
import {
  createId,
  deleteCatalog,
  deleteProductLink,
  deleteQrLink,
  nowIso,
  upsertCatalog,
  upsertProductLink,
  upsertQrLink
} from "@/lib/storage";
import type { Catalog, CatalogData, ProductLink, QrLink, QrLinkType } from "@/lib/types";

type AdminPanelProps = {
  data: CatalogData;
  activeCatalogId: string | null;
  onActiveCatalogChange: (catalogId: string | null) => void;
  onDataChange: (data: CatalogData) => void;
};

type ProductDraft = {
  pageNumber: string;
  productName: string;
  productCode: string;
  productUrl: string;
  description: string;
};

type QrDraft = {
  type: QrLinkType;
  label: string;
  url: string;
  description: string;
};

const initialProductDraft: ProductDraft = {
  pageNumber: "1",
  productName: "",
  productCode: "",
  productUrl: "",
  description: ""
};

const initialQrDraft: QrDraft = {
  type: "inquiry",
  label: "お問い合わせ",
  url: "",
  description: "スマホで読み取って問い合わせページを開けます。"
};

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AdminPanel({
  data,
  activeCatalogId,
  onActiveCatalogChange,
  onDataChange
}: AdminPanelProps) {
  const [catalogTitle, setCatalogTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [productDraft, setProductDraft] = useState<ProductDraft>(initialProductDraft);
  const [qrDraft, setQrDraft] = useState<QrDraft>(initialQrDraft);
  const [formError, setFormError] = useState("");

  const activeCatalog = useMemo(
    () => data.catalogs.find((catalog) => catalog.id === activeCatalogId) ?? data.catalogs[0] ?? null,
    [activeCatalogId, data.catalogs]
  );

  const productLinks = useMemo(() => {
    if (!activeCatalog) {
      return [];
    }

    return data.productLinks
      .filter((link) => link.catalogId === activeCatalog.id)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }, [activeCatalog, data.productLinks]);

  const qrLinks = useMemo(() => {
    if (!activeCatalog) {
      return [];
    }

    return data.qrLinks.filter((link) => link.catalogId === activeCatalog.id);
  }, [activeCatalog, data.qrLinks]);

  async function handlePdfUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setUploadMessage("PDFファイルを選択してください。");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const pdfUrl = await readFileAsDataUrl(file);
      const totalPages = await getPdfPageCount(pdfUrl);
      const timestamp = nowIso();
      const catalog: Catalog = {
        id: createId("catalog"),
        title: catalogTitle.trim() || file.name.replace(/\.pdf$/i, ""),
        pdfUrl,
        totalPages,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const nextData = upsertCatalog(data, catalog);
      onDataChange(nextData);
      onActiveCatalogChange(catalog.id);
      setCatalogTitle("");
      setUploadMessage(`${catalog.title} を追加しました。`);
    } catch {
      setUploadMessage("PDFの読み込みに失敗しました。ファイルサイズや形式を確認してください。");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function updateCatalogTitle(catalog: Catalog, title: string) {
    onDataChange(
      upsertCatalog(data, {
        ...catalog,
        title,
        updatedAt: nowIso()
      })
    );
  }

  function handleDeleteCatalog(catalogId: string) {
    const nextData = deleteCatalog(data, catalogId);
    onDataChange(nextData);
    onActiveCatalogChange(nextData.catalogs[0]?.id ?? null);
  }

  function addProductLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!activeCatalog) {
      setFormError("先にPDFカタログを追加してください。");
      return;
    }

    const pageNumber = Number(productDraft.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > activeCatalog.totalPages) {
      setFormError("ページ番号を確認してください。");
      return;
    }

    if (!productDraft.productName.trim()) {
      setFormError("商品名を入力してください。");
      return;
    }

    if (!isValidUrl(productDraft.productUrl)) {
      setFormError("商品URLは http または https のURLを入力してください。");
      return;
    }

    const link: ProductLink = {
      id: createId("product"),
      catalogId: activeCatalog.id,
      pageNumber,
      productName: productDraft.productName.trim(),
      productCode: productDraft.productCode.trim(),
      productUrl: productDraft.productUrl.trim(),
      description: productDraft.description.trim(),
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0
    };

    onDataChange(upsertProductLink(data, link));
    setProductDraft(initialProductDraft);
  }

  function addQrLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!activeCatalog) {
      setFormError("先にPDFカタログを追加してください。");
      return;
    }

    if (!qrDraft.label.trim()) {
      setFormError("QRコードのラベルを入力してください。");
      return;
    }

    if (!isValidUrl(qrDraft.url)) {
      setFormError("QRコード用URLは http または https のURLを入力してください。");
      return;
    }

    const existingSameType = data.qrLinks.find(
      (link) => link.catalogId === activeCatalog.id && link.type === qrDraft.type
    );
    const qrLink: QrLink = {
      id: existingSameType?.id ?? createId("qr"),
      catalogId: activeCatalog.id,
      type: qrDraft.type,
      label: qrDraft.label.trim(),
      url: qrDraft.url.trim(),
      description: qrDraft.description.trim()
    };

    onDataChange(upsertQrLink(data, qrLink));
    setQrDraft({
      type: qrDraft.type === "inquiry" ? "order" : "custom",
      label: qrDraft.type === "inquiry" ? "発注ページ" : "",
      url: "",
      description:
        qrDraft.type === "inquiry"
          ? "スマホで読み取って発注ページを開けます。"
          : "スマートフォンで読み取って該当ページを開けます。"
    });
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-slateLine bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-navy">
          <FilePlus2 className="h-5 w-5" />
          <h2 className="font-semibold">カタログ管理</h2>
        </div>

        <div className="mt-4 space-y-2">
          {data.catalogs.length > 0 ? (
            data.catalogs.map((catalog) => (
              <button
                type="button"
                key={catalog.id}
                onClick={() => onActiveCatalogChange(catalog.id)}
                className={`w-full rounded-md border px-3 py-3 text-left text-sm transition ${
                  activeCatalog?.id === catalog.id
                    ? "border-catalogBlue bg-blue-50 text-navy"
                    : "border-slateLine bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                <span className="block font-semibold">{catalog.title}</span>
                <span className="mt-1 block text-xs text-slate-500">{catalog.totalPages}ページ</span>
              </button>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-slateLine px-3 py-4 text-sm leading-6 text-slate-500">
              まだカタログがありません。
            </p>
          )}
        </div>
      </aside>

      <div className="space-y-5">
        <section className="rounded-lg border border-slateLine bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-navy">
            <UploadCloud className="h-5 w-5" />
            <h2 className="font-semibold">PDFアップロード</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={catalogTitle}
              onChange={(event) => setCatalogTitle(event.target.value)}
              placeholder="カタログ名"
              className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
            />
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-slate-800">
              <UploadCloud className="h-4 w-4" />
              {isUploading ? "処理中" : "PDFを選択"}
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
          {uploadMessage ? <p className="mt-3 text-sm text-slate-600">{uploadMessage}</p> : null}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            MVPではPDFをブラウザ内に保存します。大容量PDFはlocalStorage容量を超えることがあるため、
            本番ではSupabase Storageなどへ置き換える想定です。
          </p>
        </section>

        {activeCatalog ? (
          <section className="rounded-lg border border-slateLine bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-navy">選択中のカタログ</h2>
                <p className="mt-1 text-sm text-slate-500">{activeCatalog.totalPages}ページ</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteCatalog(activeCatalog.id)}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </button>
            </div>
            <input
              type="text"
              value={activeCatalog.title}
              onChange={(event) => updateCatalogTitle(activeCatalog, event.target.value)}
              className="mt-4 h-11 w-full rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
              aria-label="カタログ名"
            />
          </section>
        ) : null}

        <section className="rounded-lg border border-slateLine bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-navy">
            <Link2 className="h-5 w-5" />
            <h2 className="font-semibold">商品URL登録</h2>
          </div>
          <form onSubmit={addProductLink} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-[120px_1fr_1fr]">
              <input
                type="number"
                min={1}
                max={activeCatalog?.totalPages ?? 1}
                value={productDraft.pageNumber}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, pageNumber: event.target.value }))
                }
                className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
                placeholder="ページ"
              />
              <input
                type="text"
                value={productDraft.productName}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, productName: event.target.value }))
                }
                className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
                placeholder="商品名"
              />
              <input
                type="text"
                value={productDraft.productCode}
                onChange={(event) =>
                  setProductDraft((draft) => ({ ...draft, productCode: event.target.value }))
                }
                className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
                placeholder="品番"
              />
            </div>
            <input
              type="url"
              value={productDraft.productUrl}
              onChange={(event) =>
                setProductDraft((draft) => ({ ...draft, productUrl: event.target.value }))
              }
              className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
              placeholder="https://example.com/products/..."
            />
            <textarea
              value={productDraft.description}
              onChange={(event) =>
                setProductDraft((draft) => ({ ...draft, description: event.target.value }))
              }
              className="min-h-20 rounded-md border border-slateLine px-3 py-2 outline-none focus:border-catalogBlue"
              placeholder="説明"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              商品リンクを追加
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            {productLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slateLine px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">
                    P.{link.pageNumber} {link.productName}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-500">{link.productUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDataChange(deleteProductLink(data, link.id))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                  aria-label="商品リンクを削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slateLine bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-navy">
            <QrCode className="h-5 w-5" />
            <h2 className="font-semibold">QRリンク設定</h2>
          </div>
          <form onSubmit={addQrLink} className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-[160px_1fr]">
              <select
                value={qrDraft.type}
                onChange={(event) =>
                  setQrDraft((draft) => ({ ...draft, type: event.target.value as QrLinkType }))
                }
                className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
              >
                <option value="inquiry">問い合わせ</option>
                <option value="order">発注</option>
                <option value="custom">その他</option>
              </select>
              <input
                type="text"
                value={qrDraft.label}
                onChange={(event) => setQrDraft((draft) => ({ ...draft, label: event.target.value }))}
                className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
                placeholder="表示ラベル"
              />
            </div>
            <input
              type="url"
              value={qrDraft.url}
              onChange={(event) => setQrDraft((draft) => ({ ...draft, url: event.target.value }))}
              className="h-11 rounded-md border border-slateLine px-3 outline-none focus:border-catalogBlue"
              placeholder="https://example.com/contact"
            />
            <textarea
              value={qrDraft.description}
              onChange={(event) =>
                setQrDraft((draft) => ({ ...draft, description: event.target.value }))
              }
              className="min-h-20 rounded-md border border-slateLine px-3 py-2 outline-none focus:border-catalogBlue"
              placeholder="QRコードの説明"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              QRリンクを保存
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            {qrLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slateLine px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">{link.label}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">{link.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDataChange(deleteQrLink(data, link.id))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                  aria-label="QRリンクを削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}
      </div>
    </main>
  );
}
