"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ToastTipo = "sucesso" | "erro" | "aviso" | "info";

export interface Toast {
  id: string;
  tipo: ToastTipo;
  mensagem: string;
  duracaoMs?: number;
}

interface ToastCtx {
  mostrar: (mensagem: string, tipo?: ToastTipo, duracaoMs?: number) => void;
  sucesso: (m: string) => void;
  erro: (m: string) => void;
  aviso: (m: string) => void;
  info: (m: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const v = useContext(Ctx);
  if (!v) {
    return {
      mostrar: (m) => {
        if (typeof window !== "undefined") window.alert(m);
      },
      sucesso: (m) => typeof window !== "undefined" && window.alert(m),
      erro: (m) => typeof window !== "undefined" && window.alert(m),
      aviso: (m) => typeof window !== "undefined" && window.alert(m),
      info: (m) => typeof window !== "undefined" && window.alert(m),
    };
  }
  return v;
}

function novoId(): string {
  return Math.random().toString(36).slice(2);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback<ToastCtx["mostrar"]>((mensagem, tipo = "info", duracaoMs = 3500) => {
    const id = novoId();
    setToasts((atual) => [...atual, { id, tipo, mensagem, duracaoMs }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((atual) => atual.filter((x) => x.id !== t.id));
      }, t.duracaoMs ?? 3500)
    );
    return () => {
      for (const id of timers) clearTimeout(id);
    };
  }, [toasts]);

  const api: ToastCtx = {
    mostrar,
    sucesso: (m) => mostrar(m, "sucesso"),
    erro: (m) => mostrar(m, "erro", 5000),
    aviso: (m) => mostrar(m, "aviso", 4500),
    info: (m) => mostrar(m, "info"),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notificações"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastVisual
            key={t.id}
            toast={t}
            onFechar={() => setToasts((atual) => atual.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastVisual({ toast, onFechar }: { toast: Toast; onFechar: () => void }) {
  const cor =
    toast.tipo === "sucesso"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : toast.tipo === "erro"
      ? "border-red-300 bg-red-50 text-red-900"
      : toast.tipo === "aviso"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-brand-200 bg-white text-brand-900";
  const icone =
    toast.tipo === "sucesso" ? "✓" : toast.tipo === "erro" ? "✕" : toast.tipo === "aviso" ? "⚠" : "ℹ";
  return (
    <div
      role="status"
      className={`pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-2 rounded-md border px-4 py-3 text-sm shadow-lg ${cor}`}
    >
      <span aria-hidden className="font-bold">
        {icone}
      </span>
      <span className="flex-1">{toast.mensagem}</span>
      <button
        onClick={onFechar}
        aria-label="Fechar notificação"
        className="text-xs opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
