"use client";

import { ExternalLink } from "lucide-react";
import type { ProductLink } from "@/lib/types";

type ProductLinksPanelProps = {
  links: ProductLink[];
};

export function ProductLinksPanel({ links }: ProductLinksPanelProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slateLine bg-white/70 px-4 py-5 text-sm text-slate-500">
        このページの商品リンクはまだ登録されていません。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <article key={link.id} className="rounded-md border border-slateLine bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">{link.productName}</h3>
              {link.productCode ? (
                <p className="mt-1 text-xs font-medium text-slate-500">品番: {link.productCode}</p>
              ) : null}
            </div>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
              P.{link.pageNumber}
            </span>
          </div>
          {link.description ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">{link.description}</p>
          ) : null}
          <a
            href={link.productUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-catalogBlue px-3 py-2 text-sm font-semibold text-catalogBlue hover:bg-blue-50"
          >
            <ExternalLink className="h-4 w-4" />
            オンラインショップで見る
          </a>
        </article>
      ))}
    </div>
  );
}
