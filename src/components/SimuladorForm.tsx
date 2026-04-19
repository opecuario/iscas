"use client";

import type {
  CustoExtra,
  Fase,
  FaseCalculada,
  FormatoCustoExtra,
  InputsBase,
  Outputs,
  TipoVariante,
  VarianteOverride,
} from "@/lib/types";
import { fmtBRL, fmtInt, fmtNum } from "@/lib/format";
import { novaFase } from "@/lib/calculations";
import {
  alertaGmd,
  alertaMortalidade,
  alertaObrigatorio,
  alertaPrecoArroba,
  alertaVendaMenorQueCompra,
} from "@/lib/validacoes";
import CampoNumero from "./CampoNumero";

const FORMATO_LABEL: Record<FormatoCustoExtra, string> = {
  geral: "R$ total",
  por_cab_geral: "R$/cab (total)",
  por_cab_mes: "R$/cab/mês",
  mensal: "R$ mensal",
};

function novoCustoExtra(): CustoExtra {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return { id, nome: "", formato: "por_cab_mes", valor: 0 };
}

interface Props {
  base: InputsBase;
  setBase: (b: InputsBase) => void;
  variante: TipoVariante;
  override: VarianteOverride;
  setOverride: (o: VarianteOverride) => void;
  out: Outputs;
  /** Quando true, campos obrigatórios zerados ganham alerta vermelho. */
  validarObrigatorios?: boolean;
  /** Refs para scroll-to-error em campos obrigatórios. */
  refPrecoCompra?: React.RefObject<HTMLDivElement | null>;
  refPesoCompra?: React.RefObject<HTMLDivElement | null>;
  refQtdCabecas?: React.RefObject<HTMLDivElement | null>;
  refPrecoVenda?: React.RefObject<HTMLDivElement | null>;
}

export default function SimuladorForm({
  base,
  setBase,
  variante,
  override,
  setOverride,
  out,
  validarObrigatorios,
  refPrecoCompra,
  refPesoCompra,
  refQtdCabecas,
  refPrecoVenda,
}: Props) {
  const emVariante = variante !== "realista";
  const set = <K extends keyof InputsBase>(k: K, v: InputsBase[K]) =>
    setBase({ ...base, [k]: v });

  function setFase(idx: number, patch: Partial<Fase>) {
    const fases = base.fases.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    setBase({ ...base, fases });
  }
  function adicionarFase() {
    const novaF = novaFase(`Fase ${base.fases.length + 1}`);
    setBase({ ...base, fases: [...base.fases, novaF] });
    // Mantém override alinhado ao novo conjunto de fases
    setOverride({
      ...override,
      gmdPorFase: { ...override.gmdPorFase, [novaF.id]: novaF.gmd },
    });
  }
  function removerFase(idx: number) {
    if (base.fases.length <= 1) return;
    const removida = base.fases[idx];
    const fases = base.fases.filter((_, i) => i !== idx);
    setBase({ ...base, fases });
    if (removida) {
      const g = { ...override.gmdPorFase };
      delete g[removida.id];
      setOverride({ ...override, gmdPorFase: g });
    }
  }
  function setGmdOverrideFase(faseId: string, v: number) {
    setOverride({
      ...override,
      gmdPorFase: { ...override.gmdPorFase, [faseId]: v },
    });
  }

  return (
    <div className="space-y-6">
      {/* Bloco 1 — Compra */}
      <Secao
        titulo="1. Compra do animal"
        previa={[
          { label: "Preço final (R$/cab)", val: fmtBRL(out.precoCompraCab) },
          { label: "Preço final (R$/@)", val: fmtBRL(out.precoCompraFinalArroba) },
          { label: "Preço final (R$/kg)", val: fmtBRL(out.precoCompraFinalKg) },
          { label: "Desembolso total na compra", val: fmtBRL(out.custoCompraAnimaisTotal) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div ref={refPrecoCompra}>
            <CampoNumero
              label="Preço de compra"
              unidade="R$/@"
              moeda
              value={emVariante ? override.precoCompraArroba : base.precoCompraArroba}
              onChange={(v) =>
                emVariante
                  ? setOverride({ ...override, precoCompraArroba: v })
                  : set("precoCompraArroba", v)
              }
              dica="Preço da arroba do animal que está entrando na operação."
              destacado
              alerta={
                (validarObrigatorios &&
                  alertaObrigatorio(
                    emVariante ? override.precoCompraArroba : base.precoCompraArroba
                  )) ||
                alertaPrecoArroba(
                  emVariante ? override.precoCompraArroba : base.precoCompraArroba,
                  "compra"
                )
              }
            />
          </div>
          <div ref={refPesoCompra}>
            <CampoNumero
              label="Peso de compra"
              unidade="kg"
              value={base.pesoCompraKg}
              onChange={(v) => set("pesoCompraKg", v)}
              bloqueado={emVariante}
              dica="Peso inicial do animal na entrada."
              alerta={validarObrigatorios ? alertaObrigatorio(base.pesoCompraKg) : null}
            />
          </div>
          <CampoNumero
            label="Frete + comissão"
            unidade="R$/cab"
            moeda
            value={base.freteComissaoCab}
            onChange={(v) => set("freteComissaoCab", v)}
            bloqueado={emVariante}
          />
          <div ref={refQtdCabecas}>
            <CampoNumero
              label="Quantidade de cabeças"
              inteiro
              value={base.qtdCabecas}
              onChange={(v) => set("qtdCabecas", v)}
              bloqueado={emVariante}
              alerta={validarObrigatorios ? alertaObrigatorio(base.qtdCabecas) : null}
            />
          </div>
        </div>
      </Secao>

      {/* Bloco 2 — Fases do manejo */}
      <Secao
        titulo="2. Fases do manejo"
        previa={[
          { label: "Período total", val: `${fmtInt(out.diasTotal)} dias` },
          { label: "GMD médio", val: `${fmtNum(out.gmdMedio)} kg/dia` },
          { label: "Peso de saída", val: `${fmtNum(out.pesoSaidaKg)} kg` },
          { label: "Peso de saída (@ carcaça)", val: `${fmtNum(out.pesoSaidaArroba)} @` },
          { label: "Lotação média", val: `${fmtNum(out.lotacaoMedia)} U.A./ha` },
          { label: "Consumo total suplemento", val: `${fmtInt(out.consumoTotalSuplementoKg)} kg` },
        ]}
        extra={
          !emVariante && (
            <button
              type="button"
              onClick={adicionarFase}
              className="rounded-md border border-brand-800 bg-white px-3 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              + Adicionar fase
            </button>
          )
        }
      >
        <p className="mb-4 text-xs text-neutral-500">
          Divida a operação em fases (ex.: seca, águas, terminação). Cada fase
          tem seu próprio GMD, área, mortalidade e suplementação.
        </p>
        <div className="space-y-4">
          {base.fases.map((f, idx) => {
            const calc = out.fases.find((fc) => fc.id === f.id);
            const gmdOv = override.gmdPorFase?.[f.id] ?? f.gmd;
            return (
              <FaseCard
                key={f.id}
                fase={f}
                idx={idx}
                total={base.fases.length}
                calc={calc}
                emVariante={emVariante}
                gmdOverride={gmdOv}
                validarObrigatorios={validarObrigatorios}
                onChange={(patch) => setFase(idx, patch)}
                onRemover={() => removerFase(idx)}
                onGmdOverride={(v) => setGmdOverrideFase(f.id, v)}
              />
            );
          })}
        </div>
        {!emVariante && (
          <button
            type="button"
            onClick={adicionarFase}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-300 bg-brand-50/40 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:bg-brand-50"
          >
            + Adicionar fase
          </button>
        )}
      </Secao>

      {/* Bloco 3 — Custos operacionais */}
      <Secao
        titulo="3. Custos operacionais"
        previa={[
          { label: "Custo operacional total", val: fmtBRL(out.custoOperacionalTotal) },
          { label: "Custo/cab", val: fmtBRL(out.custoOperacionalCab) },
          { label: "Diária da operação", val: fmtBRL(out.diariaOperacao) },
          { label: "Desembolso/cab/mês", val: fmtBRL(out.desembolsoCabMes) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoNumero
            label="Salários"
            unidade="R$/mês"
            moeda
            value={base.salariosMensal}
            onChange={(v) => set("salariosMensal", v)}
            bloqueado={emVariante}
            dica="Distribuído proporcionalmente aos dias de cada fase."
          />
          <CampoNumero
            label="Sanidade"
            unidade="R$/cab"
            moeda
            value={base.sanidadeCab}
            onChange={(v) => set("sanidadeCab", v)}
            bloqueado={emVariante}
            dica="Vacinas e vermífugos por cabeça — custo pontual na 1ª fase."
          />
          <CampoNumero
            label="Pastagem"
            unidade="R$/cab/mês"
            moeda
            value={base.pastagemCabMes}
            onChange={(v) => set("pastagemCabMes", v)}
            bloqueado={emVariante}
            dica="Arrendamento, manutenção e adubação por cabeça por mês."
          />
        </div>

        <CustosExtrasBloco
          custos={base.custosExtras ?? []}
          onChange={(lista) => set("custosExtras", lista)}
          bloqueado={emVariante}
          detalhado={out.custosExtrasDetalhado}
        />
      </Secao>

      {/* Bloco 4 — Venda */}
      <Secao
        titulo="4. Venda"
        previa={[
          { label: "Preço de venda/cab", val: fmtBRL(out.precoVendaCab) },
          { label: "Faturamento total", val: fmtBRL(out.faturamentoTotal) },
          { label: "Taxas de venda (total)", val: fmtBRL(out.custoTaxasVenda) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div ref={refPrecoVenda}>
            <CampoNumero
              label="Preço de venda"
              unidade="R$/@"
              moeda
              value={emVariante ? override.precoVendaArroba : base.precoVendaArroba}
              onChange={(v) =>
                emVariante
                  ? setOverride({ ...override, precoVendaArroba: v })
                  : set("precoVendaArroba", v)
              }
              destacado
              alerta={(() => {
                const compra = emVariante ? override.precoCompraArroba : base.precoCompraArroba;
                const venda = emVariante ? override.precoVendaArroba : base.precoVendaArroba;
                if (validarObrigatorios) {
                  const obrig = alertaObrigatorio(venda);
                  if (obrig) return obrig;
                }
                return alertaPrecoArroba(venda, "venda") ?? alertaVendaMenorQueCompra(compra, venda);
              })()}
            />
          </div>
          <CampoNumero
            label="Taxas para venda"
            unidade="R$/cab"
            moeda
            value={base.taxasVendaCab}
            onChange={(v) => set("taxasVendaCab", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="Rendimento de carcaça"
            unidade="%"
            percentual
            value={base.rendimentoCarcacaPct}
            onChange={(v) => set("rendimentoCarcacaPct", v)}
            bloqueado={emVariante}
            dica="Faixa usual 48%–54%. Padrão 50% — cruzamento industrial tende a 52-54%."
          />
        </div>
      </Secao>

      {/* Bloco 5 — Financiamento (opcional) */}
      <Secao
        titulo="5. Financiamento (opcional)"
        extra={
          <label className="flex items-center gap-2 text-sm text-brand-900/80">
            <input
              type="checkbox"
              checked={base.financiamentoAtivo}
              onChange={(e) => set("financiamentoAtivo", e.target.checked)}
              disabled={emVariante}
              className="h-4 w-4 accent-brand-700"
            />
            Usar financiamento
          </label>
        }
        previa={
          base.financiamentoAtivo && out.financiamentoPagoFinal !== null
            ? [
                { label: "Total a pagar no final", val: fmtBRL(out.financiamentoPagoFinal) },
                {
                  label: "Juros pagos",
                  val: fmtBRL(out.financiamentoPagoFinal - base.financiamentoValorCaptado),
                },
                {
                  label: "Lucro descontando financiamento",
                  val: fmtBRL(out.lucroLiquidoFinanciado ?? 0),
                },
              ]
            : undefined
        }
      >
        {base.financiamentoAtivo ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoNumero
              label="Taxa do financiamento"
              unidade="% a.a."
              percentual
              value={base.financiamentoTaxaAnualPct}
              onChange={(v) => set("financiamentoTaxaAnualPct", v)}
              bloqueado={emVariante}
            />
            <CampoNumero
              label="Valor captado"
              unidade="R$"
              moeda
              value={base.financiamentoValorCaptado}
              onChange={(v) => set("financiamentoValorCaptado", v)}
              bloqueado={emVariante}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Ative o financiamento se a operação será total ou parcialmente financiada — o simulador descontará os juros do lucro.
          </p>
        )}
      </Secao>
    </div>
  );
}

function FaseCard({
  fase,
  idx,
  total,
  calc,
  emVariante,
  gmdOverride,
  validarObrigatorios,
  onChange,
  onRemover,
  onGmdOverride,
}: {
  fase: Fase;
  idx: number;
  total: number;
  calc: FaseCalculada | undefined;
  emVariante: boolean;
  gmdOverride: number;
  validarObrigatorios?: boolean;
  onChange: (patch: Partial<Fase>) => void;
  onRemover: () => void;
  onGmdOverride: (v: number) => void;
}) {
  const gmdEfetivo = emVariante ? gmdOverride : fase.gmd;
  return (
    <div data-fase-id={fase.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="flex flex-1 items-center gap-2 text-sm">
          <span className="rounded-full bg-brand-800 px-2 py-0.5 text-[11px] font-semibold text-white">
            {idx + 1}
          </span>
          <input
            type="text"
            value={fase.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            disabled={emVariante}
            placeholder="Nome da fase (ex.: Seca, Águas, Terminação)"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
        </label>
        {!emVariante && total > 1 && (
          <button
            type="button"
            onClick={onRemover}
            title="Remover fase"
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
          >
            Remover
          </button>
        )}
      </div>

      <label
        className={`mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
          fase.confinamento
            ? "border-brand-300 bg-brand-50 text-brand-900"
            : "border-neutral-200 bg-white text-neutral-700"
        } ${emVariante ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-brand-300"}`}
      >
        <input
          type="checkbox"
          checked={!!fase.confinamento}
          disabled={emVariante}
          onChange={(e) =>
            onChange({
              confinamento: e.target.checked,
              ...(e.target.checked ? { areaHa: 0 } : {}),
            })
          }
          className="h-4 w-4 accent-brand-800"
        />
        <span>
          Confinamento nesta fase
          <span className="ml-1 text-[11px] font-normal text-neutral-500">
            (sem área/lotação; pastagem não é cobrada)
          </span>
        </span>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CampoNumero
          label="Dias no período"
          unidade="dias"
          inteiro
          value={fase.diasNoPeriodo}
          onChange={(v) => onChange({ diasNoPeriodo: v })}
          bloqueado={emVariante}
          alerta={validarObrigatorios ? alertaObrigatorio(fase.diasNoPeriodo) : null}
        />
        {!fase.confinamento && (
          <CampoNumero
            label="Área disponível"
            unidade="ha"
            value={fase.areaHa}
            onChange={(v) => onChange({ areaHa: v })}
            bloqueado={emVariante}
            alerta={validarObrigatorios ? alertaObrigatorio(fase.areaHa) : null}
          />
        )}
        <CampoNumero
          label="GMD"
          unidade="kg/dia"
          decimais={3}
          value={gmdEfetivo}
          onChange={(v) => (emVariante ? onGmdOverride(v) : onChange({ gmd: v }))}
          dica="Ganho de peso diário nesta fase."
          destacado
          alerta={
            (validarObrigatorios && alertaObrigatorio(gmdEfetivo)) ||
            alertaGmd(gmdEfetivo)
          }
        />
        <CampoNumero
          label="Mortalidade"
          unidade="%"
          percentual
          value={fase.mortalidadePct}
          onChange={(v) => onChange({ mortalidadePct: v })}
          bloqueado={emVariante}
          alerta={alertaMortalidade(fase.mortalidadePct)}
        />
        <CampoNumero
          label="Consumo do suplemento"
          unidade="% do P.V."
          percentual
          decimais={3}
          value={fase.consumoSuplementoPctPV}
          onChange={(v) => onChange({ consumoSuplementoPctPV: v })}
          bloqueado={emVariante}
        />
        <CampoNumero
          label="Preço do suplemento"
          unidade="R$/kg"
          moeda
          value={fase.precoSuplementoKg}
          onChange={(v) => onChange({ precoSuplementoKg: v })}
          bloqueado={emVariante}
        />
      </div>

      {calc && (
        <div className="mt-4 rounded-md bg-white p-3 text-xs">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            Resumo desta fase
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            <ItemResumo label="Peso final" val={`${fmtNum(calc.pesoFim)} kg`} />
            <ItemResumo label="Ganho no período" val={`${fmtNum(calc.pesoFim - calc.pesoInicio)} kg`} />
            <ItemResumo label="Cabeças no fim" val={fmtInt(calc.cabFim)} />
            {!calc.confinamento && (
              <ItemResumo label="Lotação média" val={`${fmtNum(calc.lotacaoMedia)} U.A./ha`} />
            )}
            <ItemResumo label="Suplemento" val={`${fmtInt(calc.consumoTotalKg)} kg`} />
            <ItemResumo label="Custo da fase" val={fmtBRL(calc.custoTotalFase)} />
          </dl>
        </div>
      )}
    </div>
  );
}

function ItemResumo({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold tabular-nums text-brand-900">{val}</dd>
    </div>
  );
}

function CustosExtrasBloco({
  custos,
  onChange,
  bloqueado,
  detalhado,
}: {
  custos: CustoExtra[];
  onChange: (lista: CustoExtra[]) => void;
  bloqueado: boolean;
  detalhado: { nome: string; valor: number }[];
}) {
  function atualizar(id: string, patch: Partial<CustoExtra>) {
    onChange(custos.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function remover(id: string) {
    onChange(custos.filter((c) => c.id !== id));
  }
  function adicionar() {
    onChange([...custos, novoCustoExtra()]);
  }

  return (
    <div className="mt-6 border-t border-neutral-100 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          Outros custos (personalizados)
        </h3>
        <button
          type="button"
          onClick={adicionar}
          disabled={bloqueado}
          className="rounded-md border border-brand-800 bg-white px-3 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Adicionar custo
        </button>
      </div>

      {custos.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Adicione custos específicos da sua operação — ex.: ITR, seguro,
          energia, contador. Escolha o formato (por cabeça, por cabeça/mês ou
          mensal) que entrará no custo operacional.
        </p>
      ) : (
        <ul className="space-y-3">
          {custos.map((c, idx) => (
            <li
              key={c.id}
              className="grid grid-cols-1 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[1fr_180px_160px_auto]"
            >
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-brand-900/80">
                  Nome do custo
                </span>
                <input
                  type="text"
                  value={c.nome}
                  onChange={(e) => atualizar(c.id, { nome: e.target.value })}
                  disabled={bloqueado}
                  placeholder="Ex.: ITR, seguro, energia…"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-brand-900/80">
                  Formato
                </span>
                <select
                  value={c.formato}
                  onChange={(e) =>
                    atualizar(c.id, {
                      formato: e.target.value as FormatoCustoExtra,
                    })
                  }
                  disabled={bloqueado}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-100"
                >
                  <option value="geral">R$ total</option>
                  <option value="por_cab_geral">R$/cab (total)</option>
                  <option value="por_cab_mes">R$/cab/mês</option>
                  <option value="mensal">R$ mensal</option>
                </select>
              </label>
              <CampoNumero
                label="Valor"
                unidade="R$"
                moeda
                value={c.valor}
                onChange={(v) => atualizar(c.id, { valor: v })}
                bloqueado={bloqueado}
              />
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => remover(c.id)}
                  disabled={bloqueado}
                  title="Remover este custo"
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
              <div className="sm:col-span-4 text-[11px] text-neutral-500">
                #{idx + 1} · {FORMATO_LABEL[c.formato]} · Contribuição no
                período:{" "}
                <span className="font-semibold text-brand-900">
                  {fmtBRL(detalhado[idx]?.valor ?? 0)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ItemPrevia {
  label: string;
  val: string;
}

function Secao({
  titulo,
  extra,
  previa,
  children,
}: {
  titulo: string;
  extra?: React.ReactNode;
  previa?: ItemPrevia[];
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-800">
          {titulo}
        </h2>
        {extra}
      </header>
      {children}
      {previa && previa.length > 0 && (
        <div className="mt-5 rounded-md bg-brand-50 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            Cálculo imediato
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {previa.map(({ label, val }) => (
              <div key={label} className="flex items-baseline justify-between gap-2">
                <dt className="text-xs text-neutral-600">{label}</dt>
                <dd className="text-sm font-semibold tabular-nums text-brand-900">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
