"use client";

import type { InputsBase, Outputs, TipoVariante, VarianteOverride } from "@/lib/types";
import { fmtBRL, fmtInt, fmtNum } from "@/lib/format";
import CampoNumero from "./CampoNumero";

interface Props {
  base: InputsBase;
  setBase: (b: InputsBase) => void;
  variante: TipoVariante;
  override: VarianteOverride;
  setOverride: (o: VarianteOverride) => void;
  out: Outputs;
}

export default function SimuladorForm({ base, setBase, variante, override, setOverride, out }: Props) {
  const emVariante = variante !== "realista";
  const set = <K extends keyof InputsBase>(k: K, v: InputsBase[K]) =>
    setBase({ ...base, [k]: v });
  const setOv = <K extends keyof VarianteOverride>(k: K, v: VarianteOverride[K]) =>
    setOverride({ ...override, [k]: v });

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
          <CampoNumero
            label="Preço de compra"
            unidade="R$/@"
            moeda
            value={emVariante ? override.precoCompraArroba : base.precoCompraArroba}
            onChange={(v) => (emVariante ? setOv("precoCompraArroba", v) : set("precoCompraArroba", v))}
            dica="Preço da arroba do animal que está entrando na operação."
            destacado
          />
          <CampoNumero
            label="Peso de compra"
            unidade="kg"
            value={base.pesoCompraKg}
            onChange={(v) => set("pesoCompraKg", v)}
            bloqueado={emVariante}
            dica="Peso inicial do animal na entrada."
          />
          <CampoNumero
            label="Frete + comissão"
            unidade="R$/cab"
            moeda
            value={base.freteComissaoCab}
            onChange={(v) => set("freteComissaoCab", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="Quantidade de cabeças"
            inteiro
            value={base.qtdCabecas}
            onChange={(v) => set("qtdCabecas", v)}
            bloqueado={emVariante}
          />
        </div>
      </Secao>

      {/* Bloco 2 — Sistema produtivo */}
      <Secao
        titulo="2. Sistema produtivo"
        previa={[
          { label: "Peso de saída", val: `${fmtNum(out.pesoSaidaKg)} kg` },
          { label: "Peso de saída em @", val: `${fmtNum(out.pesoSaidaArroba)} @` },
          { label: "Lotação entrada", val: `${fmtNum(out.lotacaoEntrada)} U.A./ha` },
          { label: "Lotação saída", val: `${fmtNum(out.lotacaoSaida)} U.A./ha` },
          { label: "Lotação média", val: `${fmtNum(out.lotacaoMedia)} U.A./ha` },
          { label: "Lotação (cab/ha)", val: fmtNum(out.lotacaoMediaCabHa) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoNumero
            label="Área disponível"
            unidade="ha"
            value={base.areaHa}
            onChange={(v) => set("areaHa", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="GMD"
            unidade="kg/dia"
            decimais={3}
            value={emVariante ? override.gmd : base.gmd}
            onChange={(v) => (emVariante ? setOv("gmd", v) : set("gmd", v))}
            dica="Ganho de peso médio diário planejado (peso vivo)."
            destacado
          />
          <CampoNumero
            label="Período"
            unidade="dias"
            inteiro
            value={base.periodoDias}
            onChange={(v) => set("periodoDias", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="Mortalidade"
            unidade="%"
            percentual
            value={base.mortalidadePct}
            onChange={(v) => set("mortalidadePct", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="Rendimento de carcaça na venda"
            unidade="%"
            percentual
            value={base.rendimentoCarcacaPct}
            onChange={(v) => set("rendimentoCarcacaPct", v)}
            bloqueado={emVariante}
            dica="Rendimento esperado após abate (ou % combinada na venda)."
          />
        </div>
      </Secao>

      {/* Bloco 3 — Suplementação */}
      <Secao
        titulo="3. Suplementação"
        previa={[
          { label: "Consumo/cab/dia", val: `${fmtNum(out.consumoMedioCabDia)} kg` },
          { label: "Consumo do lote/dia", val: `${fmtNum(out.consumoMedioLoteDia)} kg` },
          { label: "Total do período", val: `${fmtInt(out.consumoTotalSuplementoKg)} kg` },
          { label: "Custo diário/cab", val: fmtBRL(out.custoDiarioSuplementoCab) },
          { label: "Custo total do período", val: fmtBRL(out.custoSuplementoTotal) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoNumero
            label="Consumo médio"
            unidade="% do P.V."
            percentual
            decimais={3}
            value={base.consumoSuplementoPctPV}
            onChange={(v) => set("consumoSuplementoPctPV", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="Preço do suplemento"
            unidade="R$/kg"
            moeda
            value={base.precoSuplementoKg}
            onChange={(v) => set("precoSuplementoKg", v)}
            bloqueado={emVariante}
          />
        </div>
      </Secao>

      {/* Bloco 4 — Custos */}
      <Secao
        titulo="4. Custos operacionais"
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
          />
          <CampoNumero
            label="Sanidade"
            unidade="R$/cab"
            moeda
            value={base.sanidadeCab}
            onChange={(v) => set("sanidadeCab", v)}
            bloqueado={emVariante}
            dica="Vacinas e vermífugos por cabeça (total da operação)."
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
          <CampoNumero
            label="Outros custos"
            unidade="R$/cab/mês"
            moeda
            value={base.outrosCustosCabMes}
            onChange={(v) => set("outrosCustosCabMes", v)}
            bloqueado={emVariante}
          />
        </div>
      </Secao>

      {/* Bloco 5 — Venda */}
      <Secao
        titulo="5. Venda"
        previa={[
          { label: "Preço de venda/cab", val: fmtBRL(out.precoVendaCab) },
          { label: "Faturamento total", val: fmtBRL(out.faturamentoTotal) },
          { label: "Taxas de venda (total)", val: fmtBRL(out.custoTaxasVenda) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoNumero
            label="Taxas para venda"
            unidade="R$/cab"
            moeda
            value={base.taxasVendaCab}
            onChange={(v) => set("taxasVendaCab", v)}
            bloqueado={emVariante}
          />
          <CampoNumero
            label="Preço de venda"
            unidade="R$/@"
            moeda
            value={emVariante ? override.precoVendaArroba : base.precoVendaArroba}
            onChange={(v) => (emVariante ? setOv("precoVendaArroba", v) : set("precoVendaArroba", v))}
            destacado
          />
        </div>
      </Secao>

      {/* Bloco 6 — Financiamento (opcional) */}
      <Secao
        titulo="6. Financiamento (opcional)"
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
