"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export function Modal({ title, children, onClose, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section className="max-h-[92vh] w-full overflow-hidden rounded-t-lg bg-white shadow-2xl sm:max-w-2xl sm:rounded-lg">
        <header className="flex items-center justify-between border-b border-slateLine px-5 py-4">
          <h2 className="text-base font-semibold text-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <footer className="border-t border-slateLine px-5 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
