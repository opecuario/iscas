"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";

const NUM3 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const fmtGmd = (v: number) => (isFinite(v) ? NUM3.format(v) : "—");
import {
  deleteSimulacao,
  getSimulacao,
  type SimulacaoSalva,
} from "@/lib/storage";
import type {
  InputsBase,
  Outputs,
  TipoVariante,
  VarianteOverride,
} from "@/lib/types";

type CenarioAtivo = {
  id: TipoVariante;
  label: string;
  cor: string;
  override: VarianteOverride; // já aplicado (para realista, igual ao snapshot do base)
  out: Outputs;
};

function varianteEfetiva(
  base: InputsBase,
  override: VarianteOverride | null
): VarianteOverride | null {
  if (!override) return null;
  if (
    override.gmd === base.gmd &&
    override.precoCompraArroba === base.precoCompraArroba &&
    override.precoVendaArroba === base.precoVendaArroba
  ) {
    return null;
  }
  return override;
}

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

  const cenarios = useMemo<CenarioAtivo[]>(() => {
    if (!sim) return [];
    const snap: VarianteOverride = {
      gmd: sim.inputs.gmd,
      precoCompraArroba: sim.inputs.precoCompraArroba,
      precoVendaArroba: sim.inputs.precoVendaArroba,
    };
    const arr: CenarioAtivo[] = [
      {
        id: "realista",
        label: "Realista",
        cor: "bg-brand-800",
        override: snap,
        out: calcular(sim.inputs),
      },
    ];
    const o = varianteEfetiva(sim.inputs, sim.otimista);
    if (o) {
      arr.push({
        id: "otimista",
        label: "Otimista",
        cor: "bg-emerald-700",
        override: o,
        out: calcular(sim.inputs, o),
      });
    }
    const p = varianteEfetiva(sim.inputs, sim.pessimista);
    if (p) {
      arr.push({
        id: "pessimista",
        label: "Pessimista",
        cor: "bg-amber-700",
        override: p,
        out: calcular(sim.inputs, p),
      });
    }
    return arr;
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

  if (!sim || cenarios.length === 0) {
    return (
      <div className="p-10 text-sm text-neutral-500">Carregando simulação…</div>
    );
  }

  const lucros = cenarios.map((c) => c.out.lucro);
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
          {cenarios.map((c) => {
            const lucro = c.out.lucro;
            const pct = (Math.abs(lucro) / maxAbs) * 100;
            const positivo = lucro >= 0;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-brand-900">{c.label}</span>
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
                      positivo ? c.cor : "bg-red-600"
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
                {cenarios.map((c) => (
                  <th key={c.id} className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <LinhaCen
                label="Preço de compra (R$/@)"
                cenarios={cenarios}
                pick={(c) => c.override.precoCompraArroba}
                fmt={fmtBRL}
              />
              <LinhaCen
                label="GMD (kg/dia)"
                cenarios={cenarios}
                pick={(c) => c.override.gmd}
                fmt={fmtGmd}
              />
              <LinhaCen
                label="Preço de venda (R$/@)"
                cenarios={cenarios}
                pick={(c) => c.override.precoVendaArroba}
                fmt={fmtBRL}
              />
              <LinhaSeparador
                label="Resumo do gado"
                colSpan={cenarios.length + 1}
              />
              <LinhaCen
                label="Peso de entrada (kg)"
                cenarios={cenarios}
                pick={() => sim.inputs.pesoCompraKg}
                fmt={fmtInt}
              />
              <LinhaCen
                label="Peso de saída (kg)"
                cenarios={cenarios}
                pick={(c) => c.out.pesoSaidaKg}
                fmt={fmtInt}
              />
              <LinhaCen
                label="Peso de saída (@ carcaça)"
                cenarios={cenarios}
                pick={(c) => c.out.pesoSaidaArroba}
                fmt={fmtNum}
              />
              <LinhaCen
                label="Período (dias)"
                cenarios={cenarios}
                pick={() => sim.inputs.periodoDias}
                fmt={fmtInt}
              />
              {(sim.inputs.custosExtras ?? []).length > 0 && (
                <>
                  <LinhaSeparador
                    label="Outros custos personalizados"
                    colSpan={cenarios.length + 1}
                  />
                  {cenarios[0].out.custosExtrasDetalhado.map((c, i) => (
                    <LinhaCen
                      key={i}
                      label={c.nome || `Custo #${i + 1}`}
                      cenarios={cenarios}
                      pick={(cc) =>
                        cc.out.custosExtrasDetalhado[i]?.valor ?? 0
                      }
                      fmt={fmtBRL}
                    />
                  ))}
                  <LinhaCen
                    label="Total outros custos"
                    cenarios={cenarios}
                    pick={(c) => c.out.custosExtrasTotal}
                    fmt={fmtBRL}
                  />
                </>
              )}
              <LinhaSeparador
                label="Resultado"
                colSpan={cenarios.length + 1}
              />
              <LinhaCen
                label="Lucro total"
                cenarios={cenarios}
                pick={(c) => c.out.lucro}
                fmt={fmtBRL}
                destacar
              />
              <LinhaCen
                label="Lucro por cabeça"
                cenarios={cenarios}
                pick={(c) => c.out.lucroCab}
                fmt={fmtBRL}
              />
              <LinhaCen
                label="Lucro por hectare"
                cenarios={cenarios}
                pick={(c) => c.out.lucroHa}
                fmt={fmtBRL}
              />
              <LinhaCen
                label="Rentabilidade da operação"
                cenarios={cenarios}
                pick={(c) => c.out.rentabilidadeOperacao}
                fmt={fmtPct}
              />
              <LinhaCen
                label="Rentabilidade anual"
                cenarios={cenarios}
                pick={(c) => c.out.rentabilidadeAno}
                fmt={fmtPct}
              />
              <LinhaCen
                label="Custo da @ produzida"
                cenarios={cenarios}
                pick={(c) => c.out.custoArrobaProduzida}
                fmt={fmtBRL}
              />
              <LinhaCen
                label="Faturamento total"
                cenarios={cenarios}
                pick={(c) => c.out.faturamentoTotal}
                fmt={fmtBRL}
              />
              <LinhaCen
                label="Desembolso total"
                cenarios={cenarios}
                pick={(c) => c.out.totalDesembolsado}
                fmt={fmtBRL}
              />
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 rounded-lg border border-brand-200 bg-brand-50 p-5 text-center">
        <h3 className="text-base font-semibold text-brand-900">
          Quer melhorar os resultados desta operação?
        </h3>
        <p className="mt-1 text-sm text-brand-900/80">
          Nossa consultoria ajuda você a transformar esses cenários em decisões
          concretas de manejo, nutrição e compra/venda para elevar o retorno.
        </p>
        <a
          href="https://wa.me/556699852419"
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

function LinhaCen({
  label,
  cenarios,
  pick,
  fmt,
  destacar,
}: {
  label: string;
  cenarios: CenarioAtivo[];
  pick: (c: CenarioAtivo) => number;
  fmt: (v: number) => string;
  destacar?: boolean;
}) {
  return (
    <tr className={destacar ? "bg-brand-50/40" : ""}>
      <td
        className={`px-4 py-2.5 ${
          destacar ? "font-semibold text-brand-900" : "text-neutral-700"
        }`}
      >
        {label}
      </td>
      {cenarios.map((c) => {
        const v = pick(c);
        return (
          <td
            key={c.id}
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
        );
      })}
    </tr>
  );
}

function LinhaSeparador({
  label,
  colSpan,
}: {
  label: string;
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="border-t-2 border-brand-200 bg-brand-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-brand-800"
      >
        {label}
      </td>
    </tr>
  );
}
