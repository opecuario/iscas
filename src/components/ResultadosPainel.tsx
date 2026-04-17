"use client";

import type { InputsBase, Outputs } from "@/lib/types";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";

export default function ResultadosPainel({
  out,
  cab,
  inputs,
}: {
  out: Outputs;
  cab: number;
  inputs: InputsBase;
}) {
  return (
    <div className="space-y-4">
      {/* Destaques */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi titulo="Lucro total" valor={fmtBRL(out.lucro)} destaque={out.lucro >= 0 ? "positivo" : "negativo"} />
        <Kpi titulo="Lucro por cabeça" valor={fmtBRL(out.lucroCab)} destaque={out.lucroCab >= 0 ? "positivo" : "negativo"} />
        <Kpi titulo="Lucro por hectare" valor={fmtBRL(out.lucroHa)} destaque={out.lucroHa >= 0 ? "positivo" : "negativo"} />
        <Kpi titulo="Rentabilidade da operação" valor={fmtPct(out.rentabilidadeOperacao)} />
        <Kpi titulo="Rentabilidade a.a." valor={fmtPct(out.rentabilidadeAno)} />
        <Kpi titulo="Custo da @ produzida" valor={fmtBRL(out.custoArrobaProduzida)} />
      </div>

      {out.lucroLiquidoFinanciado !== null && (
        <Kpi
          titulo="Lucro descontando financiamento"
          valor={fmtBRL(out.lucroLiquidoFinanciado)}
          destaque={out.lucroLiquidoFinanciado >= 0 ? "positivo" : "negativo"}
          largo
        />
      )}

      {/* Fechamento financeiro */}
      <FechamentoFinanceiro out={out} cab={cab} />

      {/* Resumo do gado */}
      <Grupo titulo="Resumo do gado">
        <Linha label="Peso de entrada" val={`${fmtInt(inputs.pesoCompraKg)} kg`} />
        <Linha
          label="Peso de saída"
          val={`${fmtInt(out.pesoSaidaKg)} kg (${fmtNum(out.pesoSaidaArroba)} @ carcaça)`}
        />
        <Linha label="Período" val={`${fmtInt(inputs.periodoDias)} dias`} />
        <Linha label="GMD" val={`${fmtNum(inputs.gmd)} kg/dia`} />
      </Grupo>

      {/* Indicadores-chave (todos) */}
      <Grupo titulo="Indicadores-chave" destaque>
        <Linha label="Custo da @ produzida" val={fmtBRL(out.custoArrobaProduzida)} />
        <Linha label="@ produzidas por cabeça" val={fmtNum(out.arrobasProduzidasCab)} />
        <Linha label="@ produzidas totais" val={fmtNum(out.arrobasProduzidasTotal)} />
        <Linha label="@ produzidas por hectare" val={`${fmtNum(out.arrobasProduzidasHa)} (média BR ≈ 5,5)`} />
        <Linha label="Lotação média (U.A./ha)" val={fmtNum(out.lotacaoMedia)} />
        <Linha label="Lotação média (cab/ha)" val={fmtNum(out.lotacaoMediaCabHa)} />
        <Linha label="Rentabilidade da operação" val={fmtPct(out.rentabilidadeOperacao)} />
        <Linha label="Rentabilidade mensal" val={fmtPct(out.rentabilidadeMes)} />
        <Linha label="Rentabilidade anual" val={fmtPct(out.rentabilidadeAno)} />
      </Grupo>
    </div>
  );
}

function FechamentoFinanceiro({ out, cab }: { out: Outputs; cab: number }) {
  const porCab = (v: number) => v / Math.max(cab, 1);

  const linhasSaida: { label: string; total: number; extra?: string }[] = [
    { label: "Compra dos animais", total: out.totalCompra },
    { label: "Salários", total: out.custoSalarios },
    { label: "Sanidade", total: out.custoSanidade },
    { label: "Pastagem", total: out.custoPastagem },
    { label: "Suplementação", total: out.custoSuplementoTotal },
    ...out.custosExtrasDetalhado.map((c, i) => ({
      label: c.nome || `Outro custo #${i + 1}`,
      total: c.valor,
    })),
    { label: "Taxas de venda", total: out.custoTaxasVenda },
  ];

  const totalDesembolsado = out.totalDesembolsado;
  const faturamento = out.faturamentoTotal;
  const lucro = out.lucro;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-800">
        Fechamento financeiro
      </h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-[11px] uppercase tracking-wide text-neutral-500">
            <th className="py-1 text-left font-medium">Descrição</th>
            <th className="py-1 text-right font-medium">Total</th>
            <th className="py-1 text-right font-medium">R$/cab</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-neutral-50/50">
            <td colSpan={3} className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Saídas
            </td>
          </tr>
          {linhasSaida.map((l) => (
            <tr key={l.label} className="border-b border-neutral-100">
              <td className="py-1.5 text-neutral-700">{l.label}</td>
              <td className="py-1.5 text-right tabular-nums">{fmtBRL(l.total)}</td>
              <td className="py-1.5 text-right tabular-nums text-neutral-500">{fmtBRL(porCab(l.total))}</td>
            </tr>
          ))}
          <tr className="border-y-2 border-neutral-300 bg-neutral-50">
            <td className="py-2 font-semibold text-neutral-900">Total desembolsado</td>
            <td className="py-2 text-right font-semibold tabular-nums text-neutral-900">
              {fmtBRL(totalDesembolsado)}
            </td>
            <td className="py-2 text-right font-semibold tabular-nums text-neutral-700">
              {fmtBRL(porCab(totalDesembolsado))}
            </td>
          </tr>

          <tr className="bg-neutral-50/50">
            <td colSpan={3} className="pt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Entradas
            </td>
          </tr>
          <tr className="border-y-2 border-neutral-300 bg-neutral-50">
            <td className="py-2 font-semibold text-neutral-900">Faturamento total</td>
            <td className="py-2 text-right font-semibold tabular-nums text-neutral-900">{fmtBRL(faturamento)}</td>
            <td className="py-2 text-right font-semibold tabular-nums text-neutral-700">
              {fmtBRL(porCab(faturamento))}
            </td>
          </tr>

          <tr className={`border-b-2 ${lucro >= 0 ? "border-brand-600 bg-brand-50" : "border-red-500 bg-red-50"}`}>
            <td className={`py-2.5 font-bold uppercase tracking-wide ${lucro >= 0 ? "text-brand-900" : "text-red-900"}`}>
              = Lucro
            </td>
            <td className={`py-2.5 text-right text-base font-bold tabular-nums ${lucro >= 0 ? "text-brand-900" : "text-red-900"}`}>
              {fmtBRL(lucro)}
            </td>
            <td className={`py-2.5 text-right text-base font-bold tabular-nums ${lucro >= 0 ? "text-brand-900" : "text-red-900"}`}>
              {fmtBRL(porCab(lucro))}
            </td>
          </tr>

          {out.lucroLiquidoFinanciado !== null && out.financiamentoPagoFinal !== null && (
            <>
              <tr>
                <td className="pt-3 text-neutral-700">Juros do financiamento</td>
                <td className="pt-3 text-right tabular-nums text-neutral-700">
                  −{fmtBRL(out.lucro - out.lucroLiquidoFinanciado)}
                </td>
                <td />
              </tr>
              <tr className={`border-b-2 ${out.lucroLiquidoFinanciado >= 0 ? "border-brand-600 bg-brand-50" : "border-red-500 bg-red-50"}`}>
                <td className={`py-2.5 font-bold uppercase tracking-wide ${out.lucroLiquidoFinanciado >= 0 ? "text-brand-900" : "text-red-900"}`}>
                  = Lucro líquido (pós financiamento)
                </td>
                <td className={`py-2.5 text-right text-base font-bold tabular-nums ${out.lucroLiquidoFinanciado >= 0 ? "text-brand-900" : "text-red-900"}`}>
                  {fmtBRL(out.lucroLiquidoFinanciado)}
                </td>
                <td className={`py-2.5 text-right text-base font-bold tabular-nums ${out.lucroLiquidoFinanciado >= 0 ? "text-brand-900" : "text-red-900"}`}>
                  {fmtBRL(porCab(out.lucroLiquidoFinanciado))}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </section>
  );
}

function Kpi({
  titulo,
  valor,
  destaque,
  largo,
}: {
  titulo: string;
  valor: string;
  destaque?: "positivo" | "negativo";
  largo?: boolean;
}) {
  const cor =
    destaque === "positivo"
      ? "text-brand-700"
      : destaque === "negativo"
      ? "text-red-700"
      : "text-neutral-900";
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white p-3 shadow-sm ${
        largo ? "col-span-2" : ""
      }`}
    >
      <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {titulo}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${cor}`}>{valor}</div>
    </div>
  );
}

function Grupo({
  titulo,
  destaque,
  children,
}: {
  titulo: string;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-lg border p-4 shadow-sm ${
        destaque ? "border-brand-300 bg-brand-50" : "border-neutral-200 bg-white"
      }`}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-800">
        {titulo}
      </h3>
      <dl className="divide-y divide-neutral-100 text-sm">{children}</dl>
    </section>
  );
}

function Linha({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-medium tabular-nums text-neutral-900">{val}</dd>
    </div>
  );
}
