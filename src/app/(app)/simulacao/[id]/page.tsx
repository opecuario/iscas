"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { alertasResultado } from "@/lib/validacoes";
import { snapshotBase, varianteEfetiva } from "@/lib/variantes";
import {
  analiseSensibilidade,
  breakEvenPrecoVenda,
  curvaLucro,
  fluxoCaixaMensal,
  margemSegurancaVenda,
} from "@/lib/analise";
import { recomendacoes } from "@/lib/recomendacoes";
import { BENCHMARKS, avaliar, corBenchmark, rotuloBenchmark } from "@/lib/benchmarks";
import BotaoBaixarPDF from "@/components/BotaoBaixarPDF";
import { useToast } from "@/components/ToastProvider";
import type { CenarioPDF } from "@/components/RelatorioPDF";

const NUM3 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const fmtGmd = (v: number) => (isFinite(v) ? NUM3.format(v) : "—");
import {
  deleteSimulacao,
  getSimulacao,
  type SimulacaoSalva,
} from "@/lib/storage";
import type {
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

export default function SimulacaoResumo() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const [sim, setSim] = useState<SimulacaoSalva | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [cenarioMobile, setCenarioMobile] = useState<TipoVariante>("realista");
  const [cenarioAnalise, setCenarioAnalise] = useState<TipoVariante>("realista");

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
    toast.sucesso("Simulação excluída.");
    router.replace("/");
  }

  async function compartilhar() {
    if (!sim) return;
    try {
      const payload = {
        v: 1,
        n: sim.nome,
        i: sim.inputs,
        o: sim.otimista,
        p: sim.pessimista,
      };
      const json = JSON.stringify(payload);
      const utf8 = new TextEncoder().encode(json);
      let bin = "";
      utf8.forEach((b) => (bin += String.fromCharCode(b)));
      const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const url = `${window.location.origin}/publica#${b64}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.sucesso("Link público copiado para a área de transferência.");
      } else {
        window.prompt("Copie o link público abaixo:", url);
      }
    } catch {
      toast.erro("Não foi possível gerar o link. Tente novamente.");
    }
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
            observacoes={sim.observacoes}
          />
          <button
            onClick={compartilhar}
            className="rounded-md border border-brand-800 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Compartilhar
          </button>
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

      {(() => {
        const alertas = alertasResultado(cenarios[0].out, sim.inputs);
        if (alertas.length === 0) return null;
        return (
          <section className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl leading-none">⚠</span>
              <div className="flex-1">
                <h2 className="text-sm font-bold uppercase tracking-wide text-red-800">
                  Resultado fora do padrão — reveja os números
                </h2>
                <p className="mt-1 text-xs text-red-800/80">
                  O simulador calcula exatamente o que você digitou. Se o
                  resultado parece bom/ruim demais, quase sempre é um valor em
                  unidade errada (ex.: preço em R$/@ no lugar de R$/kg, ou
                  custo esquecido).
                </p>
                <ul className="mt-3 space-y-2">
                  {alertas.map((a, i) => (
                    <li
                      key={i}
                      className={`rounded-md border p-2 text-xs ${
                        a.nivel === "vermelho"
                          ? "border-red-200 bg-white text-red-800"
                          : "border-amber-200 bg-white text-amber-900"
                      }`}
                    >
                      <span className="font-semibold">{a.titulo}:</span>{" "}
                      {a.mensagem}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/nova?id=${sim.id}&etapa=realista`}
                  className="mt-3 inline-block rounded-md border border-red-400 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                >
                  Editar valores
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Cards executivos — estilo capa do PDF */}
      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
          Resumo executivo
        </h2>
        <div
          className={`grid grid-cols-1 gap-4 ${
            cenarios.length === 2
              ? "md:grid-cols-2"
              : cenarios.length >= 3
              ? "md:grid-cols-3"
              : ""
          }`}
        >
          {cenarios.map((c) => {
            const lucroPos = c.out.lucro >= 0;
            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md"
              >
                <div className={`${c.cor} px-5 py-3 text-center`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Cenário {c.label}
                  </h3>
                </div>
                <div className="p-5">
                  <div className="text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                      Lucro total
                    </div>
                    <div
                      className={`mt-1 flex items-center justify-center gap-1 text-3xl font-bold tabular-nums ${
                        lucroPos ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      <span aria-hidden>{lucroPos ? "↑" : "↓"}</span>
                      <span>{fmtBRL(c.out.lucro)}</span>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-center">
                    {c.out.areaMaxima > 0 && (
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                          Lucro/ha
                        </dt>
                        <dd
                          className={`mt-1 text-xl font-bold tabular-nums ${
                            c.out.lucroHa >= 0 ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {fmtBRL(c.out.lucroHa)}
                        </dd>
                      </div>
                    )}
                    <div className={c.out.areaMaxima > 0 ? "" : "col-span-2"}>
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Rentab. ao ano
                      </dt>
                      <dd
                        className={`mt-1 text-xl font-bold tabular-nums ${
                          c.out.rentabilidadeAno >= 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {fmtPct(c.out.rentabilidadeAno)}
                      </dd>
                    </div>
                  </dl>
                  <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 text-center">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Lucro/cab
                      </dt>
                      <dd
                        className={`mt-0.5 text-sm font-semibold tabular-nums ${
                          c.out.lucroCab >= 0 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {fmtBRL(c.out.lucroCab)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Custo da @ produzida
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-brand-900">
                        {fmtBRL(c.out.custoArrobaProduzida)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Faturamento
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-brand-900">
                        {fmtBRL(c.out.faturamentoTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Desembolsado
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-brand-900">
                        {fmtBRL(c.out.totalDesembolsado)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gráfico simples de lucro — só faz sentido com 2+ cenários */}
      {cenarios.length > 1 && (
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
      )}

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
                    className={`px-4 py-3 text-center font-bold tracking-wider text-white ${c.cor} ${
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
              {sim.inputs.fases.length > 1 &&
                sim.inputs.fases.map((f, idx) => (
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
              {sim.inputs.fases.length === 1 && (
                <>
                  <LinhaCen
                    label="GMD"
                    cenarios={cenarios}
                    pick={(c) =>
                      c.override.gmdPorFase?.[sim.inputs.fases[0].id] ??
                      sim.inputs.fases[0].gmd
                    }
                    fmt={fmtGmd}
                    unidade="kg/dia"
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Consumo do suplemento"
                    cenarios={cenarios}
                    pick={(c) =>
                      c.out.fases.find((f) => f.id === sim.inputs.fases[0].id)
                        ?.consumoSuplementoPctPV ?? 0
                    }
                    fmt={fmtPct}
                    unidade="do P.V."
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Suplemento consumido"
                    cenarios={cenarios}
                    pick={(c) => c.out.consumoTotalSuplementoKg}
                    fmt={fmtInt}
                    unidade="kg"
                    cenarioMobile={cenarioMobile}
                  />
                  <LinhaCen
                    label="Preço do suplemento (R$/kg)"
                    cenarios={cenarios}
                    pick={() => sim.inputs.fases[0].precoSuplementoKg}
                    fmt={fmtBRL}
                    cenarioMobile={cenarioMobile}
                  />
                </>
              )}
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

      {/* Benchmarks */}
      <BenchmarksSection cenarios={cenarios} inputs={sim.inputs} />

      {/* Break-even + recomendações + sensibilidade + curva — selector por cenário */}
      {cenarios.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Analisar cenário:
          </span>
          {cenarios.map((c) => {
            const ativo = cenarioAnalise === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCenarioAnalise(c.id)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  ativo ? `${c.cor} text-white` : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      <BreakEvenSection
        cenario={
          cenarios.find((c) => c.id === cenarioAnalise) ?? cenarios[0]
        }
      />
      <RecomendacoesSection sim={sim} />
      <SensibilidadeSection
        sim={sim}
        cenario={
          cenarios.find((c) => c.id === cenarioAnalise) ?? cenarios[0]
        }
      />
      <CurvaLucroSection
        sim={sim}
        cenario={
          cenarios.find((c) => c.id === cenarioAnalise) ?? cenarios[0]
        }
      />
      <FluxoCaixaSection
        sim={sim}
        cenario={
          cenarios.find((c) => c.id === cenarioAnalise) ?? cenarios[0]
        }
      />

      {sim.observacoes && (
        <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Anotações
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-brand-900">
            {sim.observacoes}
          </p>
        </section>
      )}

      <footer className="mt-10 rounded-lg border border-brand-200 bg-brand-50 p-5 text-center">
        <h3 className="text-base font-semibold text-brand-900">
          Quer melhorar os resultados desta operação?
        </h3>
        <p className="mt-1 text-sm text-brand-900/80">
          Nossa consultoria ajuda você a transformar esses cenários em decisões
          concretas de manejo, nutrição e compra/venda para elevar o retorno.
        </p>
        <a
          href={whatsappComContexto(sim, cenarios[0].out)}
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

function whatsappComContexto(sim: SimulacaoSalva, out: Outputs): string {
  const base = "https://wa.me/556699852419";
  const lucroStr = fmtBRL(out.lucro);
  const rentStr = fmtPct(out.rentabilidadeAno);
  const msg =
    `Olá! Rodei a simulação "${sim.nome}" (${sim.inputs.qtdCabecas} cab). ` +
    `No cenário realista deu ${lucroStr} de lucro (rent. ${rentStr} a.a.). ` +
    `Queria conversar sobre como melhorar esses números.`;
  return `${base}?text=${encodeURIComponent(msg)}`;
}

function BreakEvenSection({ cenario }: { cenario: CenarioAtivo }) {
  const be = breakEvenPrecoVenda(cenario.out);
  const margem = margemSegurancaVenda(cenario.out, cenario.override.precoVendaArroba);
  const precoAtual = cenario.override.precoVendaArroba;
  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Ponto de equilíbrio — {cenario.label}
      </h2>
      <p className="mt-1 text-xs text-neutral-600">
        A quantos R$/@ você pode vender sem sair no prejuízo, mantendo todo o
        resto igual.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Preço de equilíbrio
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-brand-900">
            {fmtBRL(be)}
            <span className="ml-1 text-xs font-normal text-neutral-500">/@</span>
          </div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Preço de venda atual
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-brand-900">
            {fmtBRL(precoAtual)}
            <span className="ml-1 text-xs font-normal text-neutral-500">/@</span>
          </div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Margem de segurança
          </div>
          <div
            className={`mt-1 text-2xl font-bold tabular-nums ${
              margem >= 0.1
                ? "text-emerald-700"
                : margem >= 0
                ? "text-amber-700"
                : "text-red-700"
            }`}
          >
            {fmtPct(margem)}
          </div>
          <div className="mt-0.5 text-[11px] text-neutral-500">
            Quanto o preço pode cair antes de zerar o lucro
          </div>
        </div>
      </div>
    </section>
  );
}

function RecomendacoesSection({ sim }: { sim: SimulacaoSalva }) {
  const recs = useMemo(() => recomendacoes(sim.inputs), [sim.inputs]);
  if (recs.length === 0) return null;
  return (
    <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
        Onde concentrar esforços
      </h2>
      <p className="mt-1 text-xs text-emerald-900/80">
        Ajustes pequenos, simulados em cima do seu cenário realista, com maior
        impacto no resultado.
      </p>
      <ul className="mt-4 space-y-2">
        {recs.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-md border border-emerald-200 bg-white p-3"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <div className="flex-1 text-sm">
              <div className="font-semibold text-brand-900">{r.titulo}</div>
              <div className="mt-0.5 text-xs text-neutral-600">{r.descricao}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Ganho estimado
              </div>
              <div className="text-sm font-bold tabular-nums text-emerald-700">
                +{fmtBRL(r.ganhoEstimado)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SensibilidadeSection({
  sim,
  cenario,
}: {
  sim: SimulacaoSalva;
  cenario: CenarioAtivo;
}) {
  const tabelas = useMemo(
    () => analiseSensibilidade(sim.inputs, cenario.override),
    [sim.inputs, cenario]
  );
  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Sensibilidade do lucro — {cenario.label}
      </h2>
      <p className="mt-1 text-xs text-neutral-600">
        Quanto o lucro muda se cada variável oscilar ±5% ou ±10%.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {tabelas.map((t) => (
          <div
            key={t.variavel}
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
              {t.rotulo}
            </div>
            <table className="mt-2 w-full text-xs">
              <thead>
                <tr className="text-neutral-500">
                  <th className="py-1 text-left font-normal">Variação</th>
                  <th className="py-1 text-right font-normal">Lucro</th>
                  <th className="py-1 text-right font-normal">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {t.linhas.map((l) => {
                  const zero = l.variacaoPct === 0;
                  return (
                    <tr key={l.variacaoPct} className={zero ? "font-semibold" : ""}>
                      <td className="py-1 text-left tabular-nums">
                        {l.variacaoPct > 0 ? "+" : ""}
                        {(l.variacaoPct * 100).toFixed(0)}%
                      </td>
                      <td
                        className={`py-1 text-right tabular-nums ${
                          l.lucro >= 0 ? "text-brand-900" : "text-red-700"
                        }`}
                      >
                        {fmtBRL(l.lucro)}
                      </td>
                      <td
                        className={`py-1 text-right tabular-nums ${
                          l.deltaLucro > 0
                            ? "text-emerald-700"
                            : l.deltaLucro < 0
                            ? "text-red-700"
                            : "text-neutral-400"
                        }`}
                      >
                        {zero
                          ? "—"
                          : `${l.deltaLucro > 0 ? "+" : ""}${fmtBRL(l.deltaLucro)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

function CurvaLucroSection({
  sim,
  cenario,
}: {
  sim: SimulacaoSalva;
  cenario: CenarioAtivo;
}) {
  const pontos = useMemo(
    () => curvaLucro(sim.inputs, cenario.override),
    [sim.inputs, cenario]
  );
  if (pontos.length < 2) return null;
  const W = 600;
  const H = 200;
  const pad = 24;
  const maxDia = pontos[pontos.length - 1].dia || 1;
  const valores = pontos.flatMap((p) => [p.valorRebanho, p.desembolsoAcumulado]);
  const maxV = Math.max(...valores, 1);
  const minV = Math.min(...valores, 0);
  const rangeV = maxV - minV || 1;
  const x = (d: number) => pad + ((d / maxDia) * (W - 2 * pad));
  const y = (v: number) => H - pad - (((v - minV) / rangeV) * (H - 2 * pad));
  const toPath = (pick: (p: (typeof pontos)[number]) => number) =>
    pontos.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.dia).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Curva patrimonial — {cenario.label}
      </h2>
      <p className="mt-1 text-xs text-neutral-600">
        Como o valor do rebanho evolui ao longo das fases vs. o desembolso
        acumulado. No fim da última fase é quando sai a venda.
      </p>
      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]">
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#d4d4d4" />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#d4d4d4" />
          {/* desembolso */}
          <path d={toPath((p) => p.desembolsoAcumulado)} fill="none" stroke="#b45309" strokeWidth={2} />
          {/* valor do rebanho */}
          <path d={toPath((p) => p.valorRebanho)} fill="none" stroke="#047857" strokeWidth={2.5} />
          {pontos.map((p, i) => (
            <g key={i}>
              <circle cx={x(p.dia)} cy={y(p.valorRebanho)} r={3} fill="#047857" />
              <circle cx={x(p.dia)} cy={y(p.desembolsoAcumulado)} r={2.5} fill="#b45309" />
              <text x={x(p.dia)} y={H - pad + 14} textAnchor="middle" fontSize={9} fill="#737373">
                {p.dia === 0 ? "início" : `d${p.dia}`}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded" style={{ background: "#047857" }} />
          Valor do rebanho
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded" style={{ background: "#b45309" }} />
          Desembolso acumulado
        </span>
      </div>
    </section>
  );
}

function FluxoCaixaSection({
  sim,
  cenario,
}: {
  sim: SimulacaoSalva;
  cenario: CenarioAtivo;
}) {
  const fc = useMemo(
    () => fluxoCaixaMensal(sim.inputs, cenario.override),
    [sim.inputs, cenario]
  );
  if (fc.meses.length === 0) return null;
  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Fluxo de caixa mensal — {cenario.label}
      </h2>
      <p className="mt-1 text-xs text-neutral-600">
        Quando o dinheiro sai (mês a mês) e quando entra (venda no fim). Útil
        pra dimensionar capital de giro ou financiamento.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Maior necessidade de caixa
          </div>
          <div className="mt-1 text-lg font-bold text-amber-900 tabular-nums">
            {fmtBRL(fc.picoNecessidadeCaixa)}
          </div>
          <div className="text-[11px] text-amber-800/80">
            pico no mês {fc.mesPico}
          </div>
        </div>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Total desembolsado
          </div>
          <div className="mt-1 text-lg font-bold text-brand-900 tabular-nums">
            {fmtBRL(fc.totalDesembolsado)}
          </div>
          <div className="text-[11px] text-neutral-500">
            ao longo de {fc.meses.length} meses
          </div>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            Resultado final
          </div>
          <div
            className={`mt-1 text-lg font-bold tabular-nums ${
              fc.lucroFinal >= 0 ? "text-emerald-800" : "text-red-700"
            }`}
          >
            {fmtBRL(fc.lucroFinal)}
          </div>
          <div className="text-[11px] text-emerald-800/80">
            após venda no mês {fc.meses.length}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2 text-left font-normal">Mês</th>
              <th className="py-2 text-right font-normal">Saídas</th>
              <th className="py-2 text-right font-normal">Entradas</th>
              <th className="py-2 text-right font-normal">Saldo do mês</th>
              <th className="py-2 text-right font-normal">Caixa acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {fc.meses.map((m) => {
              const isPico = m.mes === fc.mesPico && fc.picoNecessidadeCaixa > 0;
              return (
                <tr
                  key={m.mes}
                  className={isPico ? "bg-amber-50/60" : ""}
                >
                  <td className="py-1.5 text-left font-medium text-brand-900">
                    {m.mes}
                    {isPico && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        pico
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-neutral-700">
                    {m.saidas > 0 ? fmtBRL(m.saidas) : "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-emerald-700">
                    {m.entradas > 0 ? fmtBRL(m.entradas) : "—"}
                  </td>
                  <td
                    className={`py-1.5 text-right tabular-nums ${
                      m.saldoMes >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {fmtBRL(m.saldoMes)}
                  </td>
                  <td
                    className={`py-1.5 text-right tabular-nums font-semibold ${
                      m.caixaAcumulado >= 0 ? "text-brand-900" : "text-red-700"
                    }`}
                  >
                    {fmtBRL(m.caixaAcumulado)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BenchmarksSection({
  cenarios,
  inputs,
}: {
  cenarios: CenarioAtivo[];
  inputs: SimulacaoSalva["inputs"];
}) {
  const realista = cenarios[0];
  const mortalidade =
    inputs.qtdCabecas > 0
      ? (inputs.qtdCabecas - realista.out.cabFinal) / inputs.qtdCabecas
      : 0;
  const arrobasProduzidas =
    realista.out.cabFinal * realista.out.pesoSaidaArroba -
    (inputs.qtdCabecas * inputs.pesoCompraKg * inputs.rendimentoCarcacaPct) / 15;
  const arrobasPorHa =
    realista.out.areaMaxima > 0
      ? arrobasProduzidas / realista.out.areaMaxima
      : 0;
  const gmdMedio =
    inputs.fases.length > 0
      ? inputs.fases.reduce((s, f) => s + f.gmd, 0) / inputs.fases.length
      : 0;

  const cards: Array<{
    bench: typeof BENCHMARKS.gmd;
    valor: number;
    valorFmt: string;
    inverso?: boolean;
  }> = [];
  if (realista.out.areaMaxima > 0) {
    cards.push({
      bench: BENCHMARKS.arrobasPorHa,
      valor: arrobasPorHa,
      valorFmt: `${fmtNum(arrobasPorHa)} @/ha`,
    });
  }
  cards.push({
    bench: BENCHMARKS.gmd,
    valor: gmdMedio,
    valorFmt: `${fmtGmd(gmdMedio)} kg/dia`,
  });
  cards.push({
    bench: BENCHMARKS.mortalidade,
    valor: mortalidade,
    valorFmt: fmtPct(mortalidade),
    inverso: true,
  });
  cards.push({
    bench: BENCHMARKS.rentabilidadeAno,
    valor: realista.out.rentabilidadeAno,
    valorFmt: fmtPct(realista.out.rentabilidadeAno),
  });
  if (realista.out.areaMaxima > 0) {
    cards.push({
      bench: BENCHMARKS.lotacaoMedia,
      valor: realista.out.lotacaoMedia,
      valorFmt: `${fmtNum(realista.out.lotacaoMedia)} U.A./ha`,
    });
  }

  return (
    <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Como você se compara
      </h2>
      <p className="mt-1 text-xs text-neutral-600">
        Avaliação do cenário realista nos principais indicadores da operação.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => {
          const nivel = avaliar(c.bench, c.valor, c.inverso);
          return (
            <div key={i} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
                {c.bench.rotulo}
              </div>
              <div className={`mt-1 text-lg font-bold tabular-nums ${corBenchmark(nivel)}`}>
                {c.valorFmt}
              </div>
              <div
                className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  nivel === "bom"
                    ? "bg-emerald-100 text-emerald-800"
                    : nivel === "ruim"
                    ? "bg-red-100 text-red-800"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {rotuloBenchmark(nivel)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
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
