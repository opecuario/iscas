"use client";

import { useEffect } from "react";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";
import type { InputsBase, Outputs } from "@/lib/types";
import {
  alertaGmd,
  alertaMortalidade,
  alertaPrecoArroba,
  alertaVendaMenorQueCompra,
  alertasResultado,
  type Alerta,
  type AlertaResultado,
} from "@/lib/validacoes";

interface Props {
  aberto: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  inputs: InputsBase;
  out: Outputs;
}

export default function ConfirmacaoFinalModal({
  aberto,
  onConfirmar,
  onCancelar,
  inputs,
  out,
}: Props) {
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  const avisos: { label: string; alerta: Alerta }[] = [];
  const a1 = alertaPrecoArroba(inputs.precoCompraArroba, "compra");
  if (a1) avisos.push({ label: "Preço de compra", alerta: a1 });
  const a2 = alertaPrecoArroba(inputs.precoVendaArroba, "venda");
  if (a2) avisos.push({ label: "Preço de venda", alerta: a2 });
  const a3 = alertaVendaMenorQueCompra(inputs.precoCompraArroba, inputs.precoVendaArroba);
  if (a3 && !a1 && !a2) avisos.push({ label: "Preços de compra/venda", alerta: a3 });
  inputs.fases.forEach((f, i) => {
    const ag = alertaGmd(f.gmd);
    if (ag) avisos.push({ label: `GMD (fase ${i + 1})`, alerta: ag });
    const am = alertaMortalidade(f.mortalidadePct);
    if (am) avisos.push({ label: `Mortalidade (fase ${i + 1})`, alerta: am });
  });
  const alertasOut: AlertaResultado[] = alertasResultado(out, inputs);

  const precoCompraCab = out.precoCompraCab;
  const lucroPct = out.rentabilidadeAno;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancelar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-bold text-brand-900">Confirme os números</h2>
          <p className="mt-1 text-xs text-neutral-600">
            Dê uma última olhada antes de finalizar. Erros de digitação são comuns.
          </p>
        </header>

        <div className="px-6 py-4">
          <div className="rounded-md border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">
            <p>
              Você está comprando{" "}
              <strong>{fmtInt(inputs.qtdCabecas)} cabeças</strong> de{" "}
              <strong>{fmtInt(inputs.pesoCompraKg)} kg</strong> por{" "}
              <strong>{fmtBRL(inputs.precoCompraArroba)}/@</strong>{" "}
              <span className="text-brand-900/70">
                (≈ {fmtBRL(precoCompraCab)}/cab)
              </span>
              .
            </p>
            <p className="mt-2">
              Em <strong>{fmtInt(out.diasTotal)} dias</strong> sairão com{" "}
              <strong>{fmtInt(out.pesoSaidaKg)} kg</strong> (GMD médio{" "}
              <strong>{fmtNum(out.gmdMedio)} kg/dia</strong>), vendidas a{" "}
              <strong>{fmtBRL(inputs.precoVendaArroba)}/@</strong>.
            </p>
            <p className="mt-2">
              Resultado previsto:{" "}
              <strong
                className={out.lucro >= 0 ? "text-emerald-700" : "text-red-700"}
              >
                {fmtBRL(out.lucro)}
              </strong>{" "}
              de lucro ({fmtPct(lucroPct)} ao ano).
            </p>
          </div>

          {avisos.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                Atenção — valores fora do comum
              </h3>
              <ul className="space-y-2">
                {avisos.map((a, i) => (
                  <li
                    key={i}
                    className={`rounded-md border p-2 text-xs ${
                      a.alerta.nivel === "vermelho"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <span className="font-semibold">{a.label}:</span>{" "}
                    {a.alerta.mensagem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alertasOut.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-800">
                Atenção — resultado incomum
              </h3>
              <ul className="space-y-2">
                {alertasOut.map((a, i) => (
                  <li
                    key={i}
                    className={`rounded-md border p-2 text-xs ${
                      a.nivel === "vermelho"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <span className="font-semibold">{a.titulo}:</span> {a.mensagem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {avisos.length === 0 && alertasOut.length === 0 && (
            <p className="mt-4 text-xs text-emerald-700">
              ✓ Todos os valores estão dentro de faixas comuns.
            </p>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Revisar valores
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-md bg-brand-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Confirmar e finalizar
          </button>
        </footer>
      </div>
    </div>
  );
}
