"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";
import BotaoBaixarPDF from "@/components/BotaoBaixarPDF";
import type { CenarioPDF } from "@/components/RelatorioPDF";

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
    override.precoCompraArroba !== base.precoCompraArroba ||
    override.precoVendaArroba !== base.precoVendaArroba
  ) {
    return override;
  }
  for (const f of base.fases) {
    const gmdOv = override.gmdPorFase?.[f.id];
    if (gmdOv !== undefined && gmdOv !== f.gmd) return override;
  }
  return null;
}

function snapshotBase(base: InputsBase): VarianteOverride {
  const gmdPorFase: Record<string, number> = {};
  for (const f of base.fases) gmdPorFase[f.id] = f.gmd;
  return {
    precoCompraArroba: base.precoCompraArroba,
    precoVendaArroba: base.precoVendaArroba,
    gmdPorFase,
  };
}

export default function SimulacaoResumo() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sim, setSim] = useState<SimulacaoSalva | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [cenarioMobile, setCenarioMobile] = useState<TipoVariante>("realista");

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
    const snap = snapshotBase(sim.inputs);
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

  const CORES_PDF: Record<TipoVariante, string> = {
    realista: "#063d1f",
    otimista: "#047857",
    pessimista: "#b45309",
  };
  const cenariosPDF: CenarioPDF[] = cenarios.map((c) => ({
    id: c.id,
    label: c.label,
    corHex: CORES_PDF[c.id],
    override: c.override,
    out: c.out,
  }));

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
            {sim.inputs.qtdCabecas || 0} cabeças ·{" "}
            {cenarios[0]?.out.areaMaxima || 0} ha ·{" "}
            {cenarios[0]?.out.diasTotal || 0} dias
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoBaixarPDF
            simNome={sim.nome}
            inputs={sim.inputs}
            cenarios={cenariosPDF}
          />
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
        {cenarios.length > 1 && (
          <div className="flex gap-2 border-b border-neutral-200 p-3 md:hidden">
            {cenarios.map((c) => {
              const ativo = cenarioMobile === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCenarioMobile(c.id)}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${
                    ativo
                      ? `${c.cor} text-white shadow-sm`
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Indicador</th>
                {cenarios.map((c) => (
                  <th
                    key={c.id}
                    className={`px-4 py-3 font-semibold ${
                      cenarios.length > 1 && c.id !== cenarioMobile
                        ? "hidden md:table-cell"
                        : ""
                    }`}
                  >
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
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Preço de venda (R$/@)"
                cenarios={cenarios}
                pick={(c) => c.override.precoVendaArroba}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              {sim.inputs.fases.map((f, idx) => (
                <FaseBloco
                  key={f.id}
                  faseId={f.id}
                  faseNome={f.nome}
                  faseGmdBase={f.gmd}
                  ordem={idx + 1}
                  cenarios={cenarios}
                  cenarioMobile={cenarioMobile}
                />
              ))}
              <LinhaSeparador
                label="Resumo do gado"
                colSpan={cenarios.length + 1}
              />
              <LinhaCen
                label="Cabeças compradas"
                cenarios={cenarios}
                pick={() => sim.inputs.qtdCabecas}
                fmt={fmtInt}
                unidade="cab"
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Cabeças vendidas"
                cenarios={cenarios}
                pick={(c) => c.out.cabFinal}
                fmt={fmtInt}
                unidade="cab"
                cenarioMobile={cenarioMobile}
              />
              {cenarios.some(
                (c) => sim.inputs.qtdCabecas - c.out.cabFinal > 0.5
              ) && (
                <>
                  <LinhaCen
                    label="Cabeças mortas"
                    cenarios={cenarios}
                    pick={(c) => sim.inputs.qtdCabecas - c.out.cabFinal}
                    fmt={fmtInt}
                    unidade="cab"
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Mortalidade"
                    cenarios={cenarios}
                    pick={(c) =>
                      sim.inputs.qtdCabecas > 0
                        ? (sim.inputs.qtdCabecas - c.out.cabFinal) /
                          sim.inputs.qtdCabecas
                        : 0
                    }
                    fmt={fmtPct}
                    cenarioMobile={cenarioMobile}
                  />
                </>
              )}
              <LinhaCen
                label="Peso de entrada"
                cenarios={cenarios}
                pick={() => sim.inputs.pesoCompraKg}
                fmt={fmtInt}
                unidade="kg"
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Peso de saída"
                cenarios={cenarios}
                pick={(c) => c.out.pesoSaidaKg}
                fmt={fmtInt}
                unidade="kg"
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Peso de saída (carcaça)"
                cenarios={cenarios}
                pick={(c) => c.out.pesoSaidaArroba}
                fmt={fmtNum}
                unidade="@"
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Arrobas compradas"
                cenarios={cenarios}
                pick={() =>
                  (sim.inputs.qtdCabecas * sim.inputs.pesoCompraKg) / 30
                }
                fmt={fmtNum}
                unidade="@"
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Arrobas vendidas (carcaça)"
                cenarios={cenarios}
                pick={(c) => c.out.cabFinal * c.out.pesoSaidaArroba}
                fmt={fmtNum}
                unidade="@"
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Período total"
                cenarios={cenarios}
                pick={(c) => c.out.diasTotal}
                fmt={fmtInt}
                unidade="dias"
                cenarioMobile={cenarioMobile}
              />
              {cenarios[0].out.areaMaxima > 0 && (
                <>
                  <LinhaCen
                    label="Área total (pasto)"
                    cenarios={cenarios}
                    pick={(c) => c.out.areaMaxima}
                    fmt={fmtNum}
                    unidade="ha"
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Lotação de entrada"
                    cenarios={cenarios}
                    pick={(c) => c.out.lotacaoEntrada}
                    fmt={fmtNum}
                    unidade="U.A./ha"
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Lotação média"
                    cenarios={cenarios}
                    pick={(c) => c.out.lotacaoMedia}
                    fmt={fmtNum}
                    unidade="U.A./ha"
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Lotação de saída"
                    cenarios={cenarios}
                    pick={(c) => c.out.lotacaoSaida}
                    fmt={fmtNum}
                    unidade="U.A./ha"
                    cenarioMobile={cenarioMobile}
                  />
                </>
              )}

              <LinhaSeparador
                label="Custos detalhados"
                colSpan={cenarios.length + 1}
              />
              <LinhaCen
                label="Compra dos animais"
                cenarios={cenarios}
                pick={(c) => c.out.totalCompra}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Suplemento (total das fases)"
                cenarios={cenarios}
                pick={(c) => c.out.custoSuplementoTotal}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Operacionais (salários + sanidade + pastagem + taxas)"
                cenarios={cenarios}
                pick={(c) =>
                  c.out.custoSalarios +
                  c.out.custoSanidade +
                  c.out.custoPastagem +
                  c.out.custoTaxasVenda
                }
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              {(sim.inputs.custosExtras ?? []).length > 0 && (
                <>
                  <LinhaCen
                    label="Custos personalizados"
                    cenarios={cenarios}
                    pick={(c) => c.out.custosExtrasTotal}
                    fmt={fmtBRL}
                    cenarioMobile={cenarioMobile}
                  />
                  {cenarios[0].out.custosExtrasDetalhado.map((c, i) => (
                    <LinhaCen
                      key={i}
                      label={`↳ ${c.nome || `Custo #${i + 1}`}`}
                      cenarios={cenarios}
                      pick={(cc) =>
                        cc.out.custosExtrasDetalhado[i]?.valor ?? 0
                      }
                      fmt={fmtBRL}
                      indentada
                      cenarioMobile={cenarioMobile}
                    />
                  ))}
                </>
              )}
              <LinhaCen
                label="Total desembolsado"
                cenarios={cenarios}
                pick={(c) => c.out.totalDesembolsado}
                fmt={fmtBRL}
                totalizador
                cenarioMobile={cenarioMobile}
              />

              <LinhaSeparador
                label="Resultado"
                colSpan={cenarios.length + 1}
              />
              <LinhaCen
                label="Faturamento total"
                cenarios={cenarios}
                pick={(c) => c.out.faturamentoTotal}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Lucro total"
                cenarios={cenarios}
                pick={(c) => c.out.lucro}
                fmt={fmtBRL}
                destacar
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Lucro por cabeça"
                cenarios={cenarios}
                pick={(c) => c.out.lucroCab}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Lucro por hectare"
                cenarios={cenarios}
                pick={(c) => c.out.lucroHa}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Rentabilidade da operação"
                cenarios={cenarios}
                pick={(c) => c.out.rentabilidadeOperacao}
                fmt={fmtPct}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Rentabilidade anual"
                cenarios={cenarios}
                pick={(c) => c.out.rentabilidadeAno}
                fmt={fmtPct}
                cenarioMobile={cenarioMobile}
              />
              <LinhaCen
                label="Custo da @ produzida"
                cenarios={cenarios}
                pick={(c) => c.out.custoArrobaProduzida}
                fmt={fmtBRL}
                cenarioMobile={cenarioMobile}
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
  totalizador,
  indentada,
  unidade,
  cenarioMobile,
}: {
  label: string;
  cenarios: CenarioAtivo[];
  pick: (c: CenarioAtivo) => number;
  fmt: (v: number) => string;
  destacar?: boolean;
  totalizador?: boolean;
  indentada?: boolean;
  unidade?: string;
  cenarioMobile?: TipoVariante;
}) {
  const ocultaNoMobile = (c: CenarioAtivo) =>
    cenarios.length > 1 && cenarioMobile && c.id !== cenarioMobile
      ? "hidden md:table-cell"
      : "";
  const trCls = totalizador
    ? "border-y-2 border-brand-800 bg-brand-100"
    : destacar
    ? "bg-brand-50/40"
    : "";
  const labelCls = totalizador
    ? "px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-brand-900"
    : destacar
    ? "px-4 py-2.5 font-semibold text-brand-900"
    : indentada
    ? "py-2 pl-10 pr-4 text-xs text-neutral-600"
    : "px-4 py-2.5 text-neutral-700";
  return (
    <tr className={trCls}>
      <td className={labelCls}>{label}</td>
      {cenarios.map((c) => {
        const v = pick(c);
        const valorCls = totalizador
          ? "px-4 py-3 text-base font-bold tabular-nums text-brand-900"
          : destacar
          ? `px-4 py-2.5 font-medium tabular-nums ${
              v >= 0 ? "text-emerald-700" : "text-red-700"
            }`
          : indentada
          ? "px-4 py-2 text-xs tabular-nums text-neutral-600"
          : "px-4 py-2.5 font-medium tabular-nums text-brand-900";
        return (
          <td key={c.id} className={`${valorCls} ${ocultaNoMobile(c)}`}>
            {fmt(v)}
            {unidade && (
              <span className="hidden text-neutral-500 md:inline">
                {" "}
                {unidade}
              </span>
            )}
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

function FaseBloco({
  faseId,
  faseNome,
  faseGmdBase,
  ordem,
  cenarios,
  cenarioMobile,
}: {
  faseId: string;
  faseNome: string;
  faseGmdBase: number;
  ordem: number;
  cenarios: CenarioAtivo[];
  cenarioMobile: TipoVariante;
}) {
  const calcDe = (c: CenarioAtivo) => c.out.fases.find((f) => f.id === faseId);
  // Confinamento/área são propriedades da fase (inputs), não variam entre cenários —
  // basta ler do cenário realista.
  const calcRealista = calcDe(cenarios[0]);
  const confinada = !!calcRealista?.confinamento;
  return (
    <>
      <LinhaSeparador
        label={`Fase ${ordem} — ${faseNome || "Sem nome"}${confinada ? " (confinamento)" : ""}`}
        colSpan={cenarios.length + 1}
      />
      <LinhaCen
        label="GMD"
        cenarios={cenarios}
        pick={(c) => c.override.gmdPorFase?.[faseId] ?? faseGmdBase}
        fmt={fmtGmd}
        unidade="kg/dia"
        cenarioMobile={cenarioMobile}
      />
      <LinhaCen
        label="Peso de entrada"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.pesoInicio ?? 0}
        fmt={fmtInt}
        unidade="kg"
        cenarioMobile={cenarioMobile}
      />
      <LinhaCen
        label="Peso de saída"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.pesoFim ?? 0}
        fmt={fmtInt}
        unidade="kg"
        cenarioMobile={cenarioMobile}
      />
      <LinhaCen
        label="Período"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.dias ?? 0}
        fmt={fmtInt}
        unidade="dias"
        cenarioMobile={cenarioMobile}
      />
      {!confinada && (
        <>
          <LinhaCen
            label="Área"
            cenarios={cenarios}
            pick={(c) => calcDe(c)?.areaHa ?? 0}
            fmt={fmtNum}
            unidade="ha"
            cenarioMobile={cenarioMobile}
          />
          <LinhaCen
            label="Lotação média"
            cenarios={cenarios}
            pick={(c) => calcDe(c)?.lotacaoMediaCabHa ?? 0}
            fmt={fmtNum}
            unidade="cab/ha"
            cenarioMobile={cenarioMobile}
          />
          <LinhaCen
            label="Lotação média"
            cenarios={cenarios}
            pick={(c) => calcDe(c)?.lotacaoMedia ?? 0}
            fmt={fmtNum}
            unidade="U.A./ha"
            cenarioMobile={cenarioMobile}
          />
        </>
      )}
      <LinhaCen
        label="Consumo do suplemento"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.consumoSuplementoPctPV ?? 0}
        fmt={fmtPct}
        unidade="do P.V."
        cenarioMobile={cenarioMobile}
      />
      <LinhaCen
        label="Suplemento consumido"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.consumoTotalKg ?? 0}
        fmt={fmtInt}
        unidade="kg"
        cenarioMobile={cenarioMobile}
      />
      <LinhaCen
        label="Preço do suplemento (R$/kg)"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.precoSuplementoKg ?? 0}
        fmt={fmtBRL}
        cenarioMobile={cenarioMobile}
      />
      <LinhaCen
        label="Custo do suplemento"
        cenarios={cenarios}
        pick={(c) => calcDe(c)?.custoSuplemento ?? 0}
        fmt={fmtBRL}
        cenarioMobile={cenarioMobile}
      />
    </>
  );
}
