"use client";

import type { InputsCria, OutputsCria } from "@/lib/types";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";

export default function ResultadosCriaPainel({
  inputs,
  out,
}: {
  inputs: InputsCria;
  out: OutputsCria;
}) {
  const temArea = inputs.areaHa > 0;

  return (
    <div className="space-y-4" aria-live="polite">
      {/* Destaques */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          titulo="Lucro no ciclo"
          valor={fmtBRL(out.lucro)}
          destaque={out.lucro >= 0 ? "positivo" : "negativo"}
        />
        <Kpi
          titulo="Lucro por matriz"
          valor={fmtBRL(out.lucroPorMatriz)}
          destaque={out.lucroPorMatriz >= 0 ? "positivo" : "negativo"}
        />
        {temArea && (
          <Kpi
            titulo="Lucro por hectare"
            valor={fmtBRL(out.lucroPorHa)}
            destaque={out.lucroPorHa >= 0 ? "positivo" : "negativo"}
          />
        )}
        <Kpi
          titulo="Rentabilidade a.a."
          valor={fmtPct(out.rentabilidadeAno)}
        />
        <Kpi
          titulo="Rentabilidade no ciclo"
          valor={fmtPct(out.rentabilidadeCiclo)}
        />
        <Kpi
          titulo="Custo por bezerro desmamado"
          valor={fmtBRL(out.custoPorBezerroDesmamado)}
        />
      </div>

      {/* Fechamento */}
      <FechamentoCria out={out} />

      {/* Ciclo */}
      <Grupo titulo="Ciclo reprodutivo">
        <Linha
          label="Dias de reprodução"
          val={`${fmtInt(out.diasReproducao)} dias`}
        />
        <Linha
          label="Gestação"
          val={`${fmtInt(out.diasGestacao)} dias`}
        />
        <Linha
          label="Até desmame"
          val={`${fmtInt(out.diasAteDesmame)} dias`}
        />
        <Linha
          label="Ciclo total"
          val={`${fmtInt(out.diasCiclo)} dias (${fmtNum(
            out.mesesCiclo
          )} meses)`}
        />
      </Grupo>

      {/* Reprodução */}
      <Grupo titulo="Reprodução">
        <Linha
          label="Matrizes cobertas (total)"
          val={fmtInt(out.matrizesCobertasTotal)}
        />
        <Linha
          label="Bezerros previstos"
          val={fmtInt(out.bezerrosPrevistosTotal)}
        />
        <Linha
          label="Bezerros nascidos"
          val={fmtInt(out.bezerrosNascidos)}
        />
        <Linha
          label="Bezerros desmamados"
          val={fmtInt(out.bezerrosDesmamados)}
        />
        <Linha
          label="Machos desmamados"
          val={fmtInt(out.machosDesmamados)}
        />
        <Linha
          label="Bezerras desmamadas"
          val={fmtInt(out.femeasDesmamadas)}
        />
        <Linha label="Bezerras retidas" val={fmtInt(out.bezerrasRetidas)} />
        <Linha label="Bezerras vendidas" val={fmtInt(out.bezerrasVendidas)} />
      </Grupo>

      {/* Fases de reprodução */}
      {out.fasesReproducao.length > 0 && (
        <Grupo titulo="Fases da estação de monta">
          {out.fasesReproducao.map((f) => (
            <Linha
              key={f.id}
              label={`${f.nome} (${f.tipo === "iatf" ? "IATF" : "Monta natural"})`}
              val={`${fmtInt(f.matrizesCobertas)} cob · prenhez ${fmtPct(
                f.taxaPrenhez
              )} · ${fmtInt(f.bezerrosPrevistos)} bezerros · ${fmtBRL(
                f.custoFase
              )}`}
            />
          ))}
        </Grupo>
      )}

      {/* Plantel */}
      <Grupo titulo="Plantel">
        <Linha label="Matrizes no início" val={fmtInt(out.qtdMatrizesInicio)} />
        <Linha label="Matrizes no fim" val={fmtInt(out.qtdMatrizesFim)} />
        <Linha label="Touros" val={fmtInt(out.qtdTouros)} />
      </Grupo>

      {/* Lotação */}
      {temArea && (
        <Grupo titulo="Lotação (UA/ha)">
          <Linha
            label="Só reprodução (matrizes + touros)"
            val={`${fmtNum(out.lotacaoReproducao)} UA/ha`}
          />
          <Linha
            label="Pico aleitamento (+bezerros)"
            val={`${fmtNum(out.lotacaoAleitamento)} UA/ha`}
          />
          <Linha
            label="Média ponderada no ciclo"
            val={`${fmtNum(out.lotacaoMediaPonderada)} UA/ha`}
          />
          <Linha
            label="UA média — matrizes"
            val={fmtNum(out.uaMediaMatrizes)}
          />
          <Linha label="UA média — touros" val={fmtNum(out.uaMediaTouros)} />
          <Linha
            label="UA média — bezerros"
            val={fmtNum(out.uaMediaBezerros)}
          />
        </Grupo>
      )}

      {/* Desembolso por matriz */}
      <Grupo titulo="Indicadores de eficiência">
        <Linha
          label="Desembolso por matriz (a.a.)"
          val={fmtBRL(out.desembolsoPorMatrizAno)}
        />
        <Linha
          label="Kg produzidos (bezerros vendidos/desmamados)"
          val={`${fmtInt(out.kgProduzidosBezerros)} kg`}
        />
        {out.arrobasDescarte > 0 && (
          <Linha
            label="Arrobas de descarte"
            val={`${fmtNum(out.arrobasDescarte)} @`}
          />
        )}
      </Grupo>
    </div>
  );
}

function FechamentoCria({ out }: { out: OutputsCria }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-800">
        Fechamento financeiro
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-[11px] uppercase tracking-wide text-neutral-500">
            <th className="py-1.5 text-left font-medium">Item</th>
            <th className="py-1.5 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          <LinhaTabela
            label="(+) Receita — bezerros machos"
            val={fmtBRL(out.receitaBezerrosMachos)}
          />
          <LinhaTabela
            label="(+) Receita — bezerras"
            val={fmtBRL(out.receitaBezerras)}
          />
          <LinhaTabela
            label="(+) Receita — descarte de matrizes"
            val={fmtBRL(out.receitaDescarteMatriz)}
          />
          <LinhaTabela
            label="= Receita total"
            val={fmtBRL(out.receitaTotal)}
            destaque
          />
          <LinhaTabela
            label="(−) Reprodução (IATF)"
            val={`−${fmtBRL(out.custoReproducaoIATF)}`}
          />
          <LinhaTabela
            label="(−) Compra de touros"
            val={`−${fmtBRL(out.custoComprarTouros)}`}
          />
          {out.custoManutencaoTouros > 0 && (
            <LinhaTabela
              label="(−) Manutenção dos touros"
              val={`−${fmtBRL(out.custoManutencaoTouros)}`}
            />
          )}
          <LinhaTabela
            label="(−) Salários"
            val={`−${fmtBRL(out.custoSalarios)}`}
          />
          <LinhaTabela
            label="(−) Sanidade"
            val={`−${fmtBRL(out.custoSanidade)}`}
          />
          <LinhaTabela
            label="(−) Pastagem"
            val={`−${fmtBRL(out.custoPastagem)}`}
          />
          <LinhaTabela
            label="(−) Custos extras"
            val={`−${fmtBRL(out.custosExtrasTotal)}`}
          />
          <LinhaTabela
            label="(−) Taxas de venda"
            val={`−${fmtBRL(out.custoTaxasVenda)}`}
          />
          <LinhaTabela
            label="= Total desembolsado"
            val={`−${fmtBRL(out.totalDesembolsado)}`}
            destaque
          />
          <tr
            className={`border-b-2 ${
              out.lucro >= 0
                ? "border-brand-600 bg-brand-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <td
              className={`py-2.5 font-bold uppercase tracking-wide ${
                out.lucro >= 0 ? "text-brand-900" : "text-red-900"
              }`}
            >
              = Lucro no ciclo
            </td>
            <td
              className={`py-2.5 text-right text-base font-bold tabular-nums ${
                out.lucro >= 0 ? "text-brand-900" : "text-red-900"
              }`}
            >
              {fmtBRL(out.lucro)}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function LinhaTabela({
  label,
  val,
  destaque,
}: {
  label: string;
  val: string;
  destaque?: boolean;
}) {
  return (
    <tr
      className={`border-b border-neutral-100 ${
        destaque ? "font-semibold text-brand-900" : ""
      }`}
    >
      <td className="py-1.5">{label}</td>
      <td className="py-1.5 text-right tabular-nums">{val}</td>
    </tr>
  );
}

function Kpi({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: "positivo" | "negativo";
}) {
  const cor =
    destaque === "positivo"
      ? "text-brand-700"
      : destaque === "negativo"
      ? "text-red-700"
      : "text-neutral-900";
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {titulo}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${cor}`}>
        {valor}
      </div>
    </div>
  );
}

function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
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
