"use client";

import { Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import type { QrLink } from "@/lib/types";

type QrPanelProps = {
  link: QrLink;
};

export function QrPanel({ link }: QrPanelProps) {
  const canvasId = `qr-${link.id}`;

  function downloadQr() {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = `${link.label || link.type}-qr.png`;
    anchor.click();
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
      <div className="rounded-lg border border-slateLine bg-white p-4">
        <QRCodeCanvas id={canvasId} value={link.url} size={184} includeMargin />
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-navy">{link.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {link.description || "スマートフォンで読み取って該当ページを開けます。"}
          </p>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block break-all text-sm font-medium text-catalogBlue hover:underline"
          >
            {link.url}
          </a>
        </div>
        <button
          type="button"
          onClick={downloadQr}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          QRコードをダウンロード
        </button>
      </div>
    </div>
  );
}
