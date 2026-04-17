"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtPct } from "@/lib/format";

const NUM3 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const fmtGmd = (v: number) => (isFinite(v) ? NUM3.format(v) : "—");
import {
  deleteSimulacao,
  getSimulacao,
  type SimulacaoSalva,
} from "@/lib/storage";
import type { Outputs, TipoVariante, VarianteOverride } from "@/lib/types";

const VARIANTES: { id: TipoVariante; label: string; cor: string }[] = [
  { id: "realista", label: "Realista", cor: "bg-brand-800" },
  { id: "otimista", label: "Otimista", cor: "bg-emerald-700" },
  { id: "pessimista", label: "Pessimista", cor: "bg-amber-700" },
];

export default function SimulacaoResumo() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sim, setSim] = useState<SimulacaoSalva | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  useEffect(() => {
    let ativo = true;
    getSimulacao(id).then((s) => {
      if (!ativo) return;
      if (!s) setNaoEncontrada(true);
      else setSim(s);
    });
    return () => {
      ativo = false;
    };
  }, [id]);

  const saidas = useMemo(() => {
    if (!sim) return null;
    const snap: VarianteOverride = {
      gmd: sim.inputs.gmd,
      precoCompraArroba: sim.inputs.precoCompraArroba,
      precoVendaArroba: sim.inputs.precoVendaArroba,
    };
    return {
      realista: calcular(sim.inputs),
      otimista: calcular(sim.inputs, sim.otimista ?? snap),
      pessimista: calcular(sim.inputs, sim.pessimista ?? snap),
    };
  }, [sim]);

  if (naoEncontrada) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-brand-900">
          Simulação não encontrada
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          A simulação pode ter sido excluída.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  if (!sim || !saidas) {
    return (
      <div className="p-10 text-sm text-neutral-500">Carregando simulação…</div>
    );
  }

  const lucros = [
    saidas.realista.lucro,
    saidas.otimista.lucro,
    saidas.pessimista.lucro,
  ];
  const maxAbs = Math.max(...lucros.map(Math.abs), 1);

  async function excluir() {
    if (!confirm("Tem certeza que deseja excluir esta simulação?")) return;
    await deleteSimulacao(id);
    router.replace("/");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs text-neutral-500 hover:text-brand-800"
          >
            ← Voltar ao dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-brand-900">{sim.nome}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {sim.inputs.qtdCabecas || 0} cabeças · {sim.inputs.areaHa || 0} ha ·{" "}
            {sim.inputs.periodoDias || 0} dias
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/nova?id=${sim.id}&etapa=realista`}
            className="rounded-md border border-brand-800 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Editar
          </Link>
          <button
            onClick={excluir}
            className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Excluir
          </button>
        </div>
      </header>

      {/* Gráfico simples de lucro */}
      <section className="mb-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Comparativo de lucro total
        </h2>
        <div className="mt-4 space-y-3">
          {VARIANTES.map((v, i) => {
            const lucro = lucros[i];
            const pct = (Math.abs(lucro) / maxAbs) * 100;
            const positivo = lucro >= 0;
            return (
              <div key={v.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-brand-900">{v.label}</span>
                  <span
                    className={
                      positivo ? "text-emerald-700" : "text-red-700"
                    }
                  >
                    {fmtBRL(lucro)}
                  </span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded bg-neutral-100">
                  <div
                    className={`h-full ${
                      positivo ? v.cor : "bg-red-600"
                    } transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tabela comparativa */}
      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Indicador</th>
                {VARIANTES.map((v) => (
                  <th key={v.id} className="px-4 py-3 font-semibold">
                    {v.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <LinhaComparativa
                label="Preço de compra (R$/@)"
                valores={[
                  sim.inputs.precoCompraArroba,
                  sim.otimista?.precoCompraArroba ?? sim.inputs.precoCompraArroba,
                  sim.pessimista?.precoCompraArroba ?? sim.inputs.precoCompraArroba,
                ]}
                fmt={fmtBRL}
              />
              <LinhaComparativa
                label="GMD (kg/dia)"
                valores={[
                  sim.inputs.gmd,
                  sim.otimista?.gmd ?? sim.inputs.gmd,
                  sim.pessimista?.gmd ?? sim.inputs.gmd,
                ]}
                fmt={fmtGmd}
              />
              <LinhaComparativa
                label="Preço de venda (R$/@)"
                valores={[
                  sim.inputs.precoVendaArroba,
                  sim.otimista?.precoVendaArroba ?? sim.inputs.precoVendaArroba,
                  sim.pessimista?.precoVendaArroba ?? sim.inputs.precoVendaArroba,
                ]}
                fmt={fmtBRL}
              />
              {(sim.inputs.custosExtras ?? []).length > 0 && (
                <>
                  <LinhaSeparador label="Outros custos personalizados" />
                  {saidas.realista.custosExtrasDetalhado.map((c, i) => (
                    <LinhaOut
                      key={i}
                      label={c.nome || `Custo #${i + 1}`}
                      saidas={saidas}
                      pick={(o) => o.custosExtrasDetalhado[i]?.valor ?? 0}
                      fmt={fmtBRL}
                    />
                  ))}
                  <LinhaOut
                    label="Total outros custos"
                    saidas={saidas}
                    pick={(o) => o.custosExtrasTotal}
                    fmt={fmtBRL}
                  />
                </>
              )}
              <LinhaSeparador label="Resultado" />
              <LinhaOut
                label="Lucro total"
                saidas={saidas}
                pick={(o) => o.lucro}
                fmt={fmtBRL}
                destacar
              />
              <LinhaOut
                label="Lucro por cabeça"
                saidas={saidas}
                pick={(o) => o.lucroCab}
                fmt={fmtBRL}
              />
              <LinhaOut
                label="Lucro por hectare"
                saidas={saidas}
                pick={(o) => o.lucroHa}
                fmt={fmtBRL}
              />
              <LinhaOut
                label="Rentabilidade da operação"
                saidas={saidas}
                pick={(o) => o.rentabilidadeOperacao}
                fmt={fmtPct}
              />
              <LinhaOut
                label="Rentabilidade anual"
                saidas={saidas}
                pick={(o) => o.rentabilidadeAno}
                fmt={fmtPct}
              />
              <LinhaOut
                label="Custo da @ produzida"
                saidas={saidas}
                pick={(o) => o.custoArrobaProduzida}
                fmt={fmtBRL}
              />
              <LinhaOut
                label="Faturamento total"
                saidas={saidas}
                pick={(o) => o.faturamentoTotal}
                fmt={fmtBRL}
              />
              <LinhaOut
                label="Desembolso total"
                saidas={saidas}
                pick={(o) => o.totalDesembolsado}
                fmt={fmtBRL}
              />
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 rounded-lg border border-brand-200 bg-brand-50 p-5 text-center">
        <h3 className="text-base font-semibold text-brand-900">
          Quer aprofundar a análise desta operação?
        </h3>
        <p className="mt-1 text-sm text-brand-900/80">
          Nossa consultoria ajuda você a transformar estes cenários em plano de
          ação.
        </p>
        <a
          href="https://wa.me/5511999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Falar com um especialista
        </a>
      </footer>
    </div>
  );
}

function LinhaComparativa({
  label,
  valores,
  fmt,
}: {
  label: string;
  valores: number[];
  fmt: (v: number) => string;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-neutral-700">{label}</td>
      {valores.map((v, i) => (
        <td key={i} className="px-4 py-2.5 font-medium text-brand-900">
          {fmt(v)}
        </td>
      ))}
    </tr>
  );
}

function LinhaOut({
  label,
  saidas,
  pick,
  fmt,
  destacar,
}: {
  label: string;
  saidas: { realista: Outputs; otimista: Outputs; pessimista: Outputs };
  pick: (o: Outputs) => number;
  fmt: (v: number) => string;
  destacar?: boolean;
}) {
  const vals = [pick(saidas.realista), pick(saidas.otimista), pick(saidas.pessimista)];
  return (
    <tr className={destacar ? "bg-brand-50/40" : ""}>
      <td className={`px-4 py-2.5 ${destacar ? "font-semibold text-brand-900" : "text-neutral-700"}`}>
        {label}
      </td>
      {vals.map((v, i) => (
        <td
          key={i}
          className={`px-4 py-2.5 font-medium ${
            destacar
              ? v >= 0
                ? "text-emerald-700"
                : "text-red-700"
              : "text-brand-900"
          }`}
        >
          {fmt(v)}
        </td>
      ))}
    </tr>
  );
}

function LinhaSeparador({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={4}
        className="border-t-2 border-brand-200 bg-brand-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-brand-800"
      >
        {label}
      </td>
    </tr>
  );
}
