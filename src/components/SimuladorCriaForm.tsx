"use client";

import type {
  CustoExtra,
  FaseReproducao,
  FormatoCustoExtra,
  InputsCria,
  OutputsCria,
  TipoFaseReproducao,
} from "@/lib/types";
import { fmtBRL, fmtInt, fmtNum, fmtPct } from "@/lib/format";
import { novaFaseReproducao } from "@/lib/calculationsCria";
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
  base: InputsCria;
  setBase: (b: InputsCria) => void;
  out: OutputsCria;
}

export default function SimuladorCriaForm({ base, setBase, out }: Props) {
  const set = <K extends keyof InputsCria>(k: K, v: InputsCria[K]) =>
    setBase({ ...base, [k]: v });

  function setFase(idx: number, patch: Partial<FaseReproducao>) {
    const fases = base.fasesReproducao.map((f, i) =>
      i === idx ? { ...f, ...patch } : f
    );
    setBase({ ...base, fasesReproducao: fases });
  }
  function adicionarFase() {
    const nova = novaFaseReproducao(
      `Fase ${base.fasesReproducao.length + 1}`
    );
    setBase({ ...base, fasesReproducao: [...base.fasesReproducao, nova] });
  }
  function removerFase(idx: number) {
    setBase({
      ...base,
      fasesReproducao: base.fasesReproducao.filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Plantel de matrizes */}
      <Secao
        titulo="1. Plantel de matrizes"
        previa={[
          { label: "Matrizes início", val: fmtInt(out.qtdMatrizesInicio) },
          { label: "Matrizes fim", val: fmtInt(out.qtdMatrizesFim) },
          { label: "Touros", val: fmtInt(out.qtdTouros) },
          { label: "Dias do ciclo", val: fmtInt(out.diasCiclo) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoNumero
            label="Quantidade de matrizes"
            unidade="cab"
            inteiro
            value={base.qtdMatrizes}
            onChange={(v) => set("qtdMatrizes", v)}
          />
          <CampoNumero
            label="Peso médio da matriz"
            unidade="kg"
            value={base.pesoMedioMatrizKg}
            onChange={(v) => set("pesoMedioMatrizKg", v)}
          />
        </div>

        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
            Área total do sistema
          </div>
          <p className="mb-3 text-xs text-neutral-600">
            Área usada por <strong>todo o sistema de cria</strong> — matrizes,
            touros, bezerros antes do desmame e bezerras retidas entram juntos
            no cálculo de lotação (UA/ha).
          </p>
          <div className="max-w-xs">
            <CampoNumero
              label="Área total"
              unidade="ha"
              value={base.areaHa}
              onChange={(v) => set("areaHa", v)}
            />
          </div>
        </div>
      </Secao>

      {/* 2. Fases de reprodução */}
      <Secao
        titulo="2. Reprodução (estação de monta)"
        previa={[
          {
            label: "Matrizes cobertas total",
            val: fmtInt(out.matrizesCobertasTotal),
          },
          {
            label: "Prenhas totais",
            val: `${fmtInt(out.matrizesPrenhasTotal)} / ${fmtInt(
              base.qtdMatrizes
            )}`,
          },
          {
            label: "Prenhez geral",
            val: fmtPct(out.prenhezGeralPct),
          },
          {
            label: "Matrizes vazias ao final",
            val: fmtInt(out.matrizesVaziasFinal),
          },
          {
            label: "Bezerros previstos",
            val: fmtInt(out.bezerrosPrevistosTotal),
          },
          {
            label: "Custo reprodução (IATF)",
            val: fmtBRL(out.custoReproducaoIATF),
          },
        ]}
      >
        <p className="mb-4 text-xs text-neutral-500">
          Divida a estação em fases (ex.: IATF inicial, repasse com touro). Cada
          fase só pode cobrir matrizes que ainda estão vazias.
        </p>
        {base.fasesReproducao.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs text-neutral-500">
            Adicione pelo menos uma fase (IATF ou monta natural).
          </p>
        ) : (
          <ul className="space-y-4">
            {base.fasesReproducao.map((f, idx) => (
              <FaseReproducaoCard
                key={f.id}
                idx={idx}
                fase={f}
                onChange={(patch) => setFase(idx, patch)}
                onRemove={() => removerFase(idx)}
                calculada={out.fasesReproducao[idx]}
              />
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={adicionarFase}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-300 bg-brand-50/40 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:bg-brand-50"
        >
          + Adicionar fase
        </button>
      </Secao>

      {/* 3. Touros */}
      <Secao
        titulo="3. Touros"
        previa={[
          {
            label: "Touros (total)",
            val: fmtInt(out.qtdTouros),
          },
          {
            label: "Compra de touros",
            val: fmtBRL(out.custoComprarTouros),
          },
          {
            label: "Manutenção no ciclo",
            val: fmtBRL(out.custoManutencaoTouros),
          },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CampoNumero
            label="Comprar no ciclo"
            unidade="cab"
            inteiro
            value={base.qtdTourosComprarCiclo}
            onChange={(v) => set("qtdTourosComprarCiclo", v)}
            dica="Sai no fluxo de caixa deste ciclo."
          />
          <CampoNumero
            label="Preço unitário"
            unidade="R$/cab"
            moeda
            value={base.precoUnitTouro}
            onChange={(v) => set("precoUnitTouro", v)}
            bloqueado={base.qtdTourosComprarCiclo <= 0}
          />
          <CampoNumero
            label="Já possui"
            unidade="cab"
            inteiro
            value={base.qtdTourosJaPossui}
            onChange={(v) => set("qtdTourosJaPossui", v)}
            dica="Não gera custo de compra neste ciclo."
          />
          <CampoNumero
            label="Peso médio do touro"
            unidade="kg"
            value={base.pesoMedioTouroKg}
            onChange={(v) => set("pesoMedioTouroKg", v)}
          />
        </div>

        <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-900">
            <input
              type="checkbox"
              checked={base.considerarManutencaoTouro}
              onChange={(e) =>
                set("considerarManutencaoTouro", e.target.checked)
              }
              className="h-4 w-4 rounded border-neutral-300 text-brand-800 focus:ring-brand-600"
            />
            <span className="font-medium">
              Considerar depreciação/manutenção do touro
            </span>
          </label>
          <p className="mt-1 pl-6 text-[11px] text-neutral-600">
            Use esse campo para representar a depreciação anual do touro — ex.:
            (preço de compra − valor residual) ÷ vida útil em anos — ou a
            manutenção anual (sanidade, reprodução, alimentação extra).
          </p>
          {base.considerarManutencaoTouro && (
            <div className="mt-3">
              <CampoNumero
                label="Depreciação/manutenção por touro (ano)"
                unidade="R$/cab/ano"
                moeda
                value={base.custoManutencaoTouroAno}
                onChange={(v) => set("custoManutencaoTouroAno", v)}
                dica="Será rateado proporcionalmente aos dias do ciclo."
              />
            </div>
          )}
        </div>
      </Secao>

      {/* 4. Gestação / desmame / bezerros */}
      <Secao
        titulo="4. Gestação, desmame e bezerros"
        previa={[
          { label: "Bezerros nascidos", val: fmtInt(out.bezerrosNascidos) },
          { label: "Bezerros desmamados", val: fmtInt(out.bezerrosDesmamados) },
          { label: "Machos desmamados", val: fmtInt(out.machosDesmamados) },
          { label: "Bezerras desmamadas", val: fmtInt(out.femeasDesmamadas) },
          { label: "Bezerras retidas", val: fmtInt(out.bezerrasRetidas) },
          { label: "Bezerras vendidas", val: fmtInt(out.bezerrasVendidas) },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CampoNumero
            label="Dias de gestação"
            unidade="dias"
            inteiro
            value={base.diasGestacao}
            onChange={(v) => set("diasGestacao", v)}
            dica="Padrão ~270."
          />
          <CampoNumero
            label="Dias até desmame"
            unidade="dias"
            inteiro
            value={base.diasAteDesmame}
            onChange={(v) => set("diasAteDesmame", v)}
            dica="Padrão ~210."
          />
          <CampoNumero
            label="Peso ao desmame"
            unidade="kg"
            value={base.pesoDesmameKg}
            onChange={(v) => set("pesoDesmameKg", v)}
          />
          <CampoNumero
            label="Mortalidade nascimento → desmame"
            unidade="%"
            percentual
            value={base.mortalidadeBezerroPct}
            onChange={(v) => set("mortalidadeBezerroPct", v)}
          />
          <CampoNumero
            label="Proporção de machos"
            unidade="%"
            percentual
            value={base.proporcaoMachoPct}
            onChange={(v) => set("proporcaoMachoPct", v)}
            dica="50% é o esperado biológico."
          />
          <CampoNumero
            label="Retenção de bezerras"
            unidade="% das fêmeas"
            percentual
            value={base.retencaoBezerrasPct}
            onChange={(v) => set("retencaoBezerrasPct", v)}
            dica="% das bezerras desmamadas que ficam na fazenda."
          />
        </div>
      </Secao>

      {/* 5. Preços de venda dos bezerros */}
      <Secao
        titulo="5. Preços de venda dos bezerros"
        previa={[
          {
            label: "Receita bezerros machos",
            val: fmtBRL(out.receitaBezerrosMachos),
          },
          {
            label: "Receita bezerras",
            val: fmtBRL(out.receitaBezerras),
          },
          {
            label: "Kg produzidos (bezerros)",
            val: `${fmtInt(out.kgProduzidosBezerros)} kg`,
          },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CampoPreco
            titulo="Bezerro macho"
            modo={base.modoPrecoBezerroMacho}
            setModo={(m) => set("modoPrecoBezerroMacho", m)}
            preco={base.precoBezerroMacho}
            setPreco={(v) => set("precoBezerroMacho", v)}
          />
          <CampoPreco
            titulo="Bezerra (venda)"
            modo={base.modoPrecoBezerra}
            setModo={(m) => set("modoPrecoBezerra", m)}
            preco={base.precoBezerra}
            setPreco={(v) => set("precoBezerra", v)}
          />
        </div>
      </Secao>

      {/* 6. Matriz — mortalidade e descarte */}
      <Secao
        titulo="6. Matriz — mortalidade e descarte"
        previa={[
          {
            label: "Arrobas de descarte",
            val: `${fmtNum(out.arrobasDescarte)} @`,
          },
          {
            label: "Receita descarte",
            val: fmtBRL(out.receitaDescarteMatriz),
          },
        ]}
      >
        {out.matrizesVaziasFinal > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-200 bg-brand-50/60 px-3 py-2 text-[12px] text-brand-900">
            <span>
              <strong>{fmtInt(out.matrizesVaziasFinal)}</strong> matriz
              {out.matrizesVaziasFinal === 1 ? "" : "es"} ficou vazia ao final
              da estação — candidatas naturais para descarte.
            </span>
            {base.qtdDescarteMatriz !== Math.round(out.matrizesVaziasFinal) && (
              <button
                type="button"
                onClick={() =>
                  set(
                    "qtdDescarteMatriz",
                    Math.round(out.matrizesVaziasFinal)
                  )
                }
                className="rounded-md border border-brand-800 bg-white px-3 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                Usar como descarte ({fmtInt(out.matrizesVaziasFinal)})
              </button>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CampoNumero
            label="Mortalidade de matrizes (ciclo)"
            unidade="%"
            percentual
            value={base.mortalidadeMatrizPct}
            onChange={(v) => set("mortalidadeMatrizPct", v)}
          />
          <CampoNumero
            label="Descarte de matrizes"
            unidade="cab"
            inteiro
            value={base.qtdDescarteMatriz}
            onChange={(v) => set("qtdDescarteMatriz", v)}
            dica={
              out.matrizesVaziasFinal > 0
                ? `${fmtInt(out.matrizesVaziasFinal)} vazia(s) disponíveis.`
                : undefined
            }
          />
          <CampoNumero
            label="Peso médio do descarte"
            unidade="kg"
            value={base.pesoMedioDescarteKg}
            onChange={(v) => set("pesoMedioDescarteKg", v)}
            bloqueado={base.qtdDescarteMatriz <= 0}
          />
          <CampoNumero
            label="Preço de descarte"
            unidade="R$/@"
            moeda
            value={base.precoDescarteArroba}
            onChange={(v) => set("precoDescarteArroba", v)}
            bloqueado={base.qtdDescarteMatriz <= 0}
          />
          <CampoNumero
            label="Rendimento de carcaça"
            unidade="%"
            percentual
            value={base.rendimentoCarcacaDescarte}
            onChange={(v) => set("rendimentoCarcacaDescarte", v)}
            bloqueado={base.qtdDescarteMatriz <= 0}
          />
        </div>
      </Secao>

      {/* 7. Custos operacionais */}
      <Secao
        titulo="7. Custos operacionais"
        previa={[
          { label: "Salários", val: fmtBRL(out.custoSalarios) },
          { label: "Sanidade", val: fmtBRL(out.custoSanidade) },
          { label: "Pastagem", val: fmtBRL(out.custoPastagem) },
          { label: "Extras", val: fmtBRL(out.custosExtrasTotal) },
          { label: "Taxas de venda", val: fmtBRL(out.custoTaxasVenda) },
          {
            label: "Total operacional",
            val: fmtBRL(out.custoOperacionalTotal),
          },
        ]}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CampoNumero
            label="Salários mensais"
            unidade="R$/mês"
            moeda
            value={base.salariosMensal}
            onChange={(v) => set("salariosMensal", v)}
          />
          <CampoNumero
            label="Sanidade por matriz"
            unidade="R$/matriz/ano"
            moeda
            value={base.sanidadeMatrizAno}
            onChange={(v) => set("sanidadeMatrizAno", v)}
          />
          <CampoNumero
            label="Pastagem"
            unidade="R$/cab/mês"
            moeda
            value={base.pastagemCabMes}
            onChange={(v) => set("pastagemCabMes", v)}
          />
          <CampoNumero
            label="Taxas de venda"
            unidade="R$/cab vendida"
            moeda
            value={base.taxasVendaCab}
            onChange={(v) => set("taxasVendaCab", v)}
          />
        </div>

        <CustosExtrasBloco
          custos={base.custosExtras}
          onChange={(lista) => set("custosExtras", lista)}
          detalhado={out.custosExtrasDetalhado}
        />
      </Secao>
    </div>
  );
}

// ============================================================
// Card de fase de reprodução
// ============================================================
function FaseReproducaoCard({
  idx,
  fase,
  onChange,
  onRemove,
  calculada,
}: {
  idx: number;
  fase: FaseReproducao;
  onChange: (patch: Partial<FaseReproducao>) => void;
  onRemove: () => void;
  calculada?: {
    bezerrosPrevistos: number;
    custoFase: number;
    vaziasDisponiveis: number;
    prenhasNaFase: number;
    vaziasAposFase: number;
    excessoCobertura: boolean;
  };
}) {
  const excesso = calculada?.excessoCobertura ?? false;
  return (
    <li
      className={`rounded-md border bg-neutral-50 p-4 ${
        excesso ? "border-red-300" : "border-neutral-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
            #{idx + 1}
          </span>
          <input
            type="text"
            value={fase.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            placeholder="Nome da fase"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
          <select
            value={fase.tipo}
            onChange={(e) =>
              onChange({ tipo: e.target.value as TipoFaseReproducao })
            }
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="monta_natural">Monta natural</option>
            <option value="iatf">IATF</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remover fase"
          className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
        >
          Remover
        </button>
      </div>

      {calculada && (
        <div className="mb-3 rounded-md border border-brand-100 bg-white px-3 py-2 text-[11px] text-neutral-600">
          Vazias disponíveis antes desta fase:{" "}
          <span className="font-semibold text-brand-900">
            {fmtInt(calculada.vaziasDisponiveis)}
          </span>{" "}
          · limite máximo de cobertura coerente.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CampoNumero
          label="Matrizes cobertas"
          unidade="cab"
          inteiro
          value={fase.matrizesCobertas}
          onChange={(v) => onChange({ matrizesCobertas: v })}
        />
        <CampoNumero
          label="Duração da fase"
          unidade="dias"
          inteiro
          value={fase.diasNoPeriodo}
          onChange={(v) => onChange({ diasNoPeriodo: v })}
        />
        <CampoNumero
          label="Taxa de prenhez"
          unidade="%"
          percentual
          value={fase.taxaPrenhez}
          onChange={(v) => onChange({ taxaPrenhez: v })}
        />
        {fase.tipo === "iatf" && (
          <CampoNumero
            label="Custo IATF"
            unidade="R$/matriz"
            moeda
            value={fase.custoIATFPorMatriz}
            onChange={(v) => onChange({ custoIATFPorMatriz: v })}
          />
        )}
      </div>

      {excesso && calculada && (
        <div
          role="alert"
          className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-800"
        >
          Você informou <strong>{fmtInt(fase.matrizesCobertas)}</strong>{" "}
          cobertas, mas só há{" "}
          <strong>{fmtInt(calculada.vaziasDisponiveis)}</strong> matrizes vazias
          antes desta fase. O cálculo usa o limite coerente (
          {fmtInt(calculada.vaziasDisponiveis)}) para evitar contar a mesma
          matriz duas vezes.
        </div>
      )}

      {calculada && (
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-neutral-200 pt-3 text-[11px] text-neutral-600">
          <span>
            Prenhas nesta fase:{" "}
            <span className="font-semibold text-brand-900">
              {fmtInt(calculada.prenhasNaFase)}
            </span>
          </span>
          <span>
            Vazias após esta fase:{" "}
            <span className="font-semibold text-brand-900">
              {fmtInt(calculada.vaziasAposFase)}
            </span>
          </span>
          <span>
            Bezerros previstos:{" "}
            <span className="font-semibold text-brand-900">
              {fmtInt(calculada.bezerrosPrevistos)}
            </span>
          </span>
          <span>
            Custo da fase:{" "}
            <span className="font-semibold text-brand-900">
              {fmtBRL(calculada.custoFase)}
            </span>
          </span>
        </div>
      )}
    </li>
  );
}

// ============================================================
// Campo de preço (por cab vs por kg)
// ============================================================
function CampoPreco({
  titulo,
  modo,
  setModo,
  preco,
  setPreco,
}: {
  titulo: string;
  modo: "cab" | "kg";
  setModo: (m: "cab" | "kg") => void;
  preco: number;
  setPreco: (v: number) => void;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-brand-900">{titulo}</h3>
        <div className="flex overflow-hidden rounded-md border border-neutral-300 bg-white text-xs">
          <button
            type="button"
            onClick={() => setModo("cab")}
            className={`px-3 py-1.5 font-semibold transition ${
              modo === "cab"
                ? "bg-brand-800 text-white"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            R$/cab
          </button>
          <button
            type="button"
            onClick={() => setModo("kg")}
            className={`px-3 py-1.5 font-semibold transition ${
              modo === "kg"
                ? "bg-brand-800 text-white"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            R$/kg
          </button>
        </div>
      </div>
      <CampoNumero
        label={modo === "cab" ? "Preço por cabeça" : "Preço por kg vivo"}
        unidade={modo === "cab" ? "R$/cab" : "R$/kg"}
        moeda
        value={preco}
        onChange={setPreco}
      />
    </div>
  );
}

// ============================================================
// Custos extras (mesma estrutura do recria/engorda)
// ============================================================
function CustosExtrasBloco({
  custos,
  onChange,
  detalhado,
}: {
  custos: CustoExtra[];
  onChange: (lista: CustoExtra[]) => void;
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
          className="rounded-md border border-brand-800 bg-white px-3 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          + Adicionar custo
        </button>
      </div>

      {custos.length === 0 ? (
        <p className="text-xs text-neutral-500">
          Adicione custos específicos da sua operação — ex.: ITR, seguro,
          energia, contador.
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
                  placeholder="Ex.: ITR, seguro, energia…"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
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
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
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
              />
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => remover(c.id)}
                  title="Remover este custo"
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Remover
                </button>
              </div>
              <div className="sm:col-span-4 text-[11px] text-neutral-500">
                #{idx + 1} · {FORMATO_LABEL[c.formato]} · Contribuição no
                ciclo:{" "}
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

// ============================================================
// Seção genérica
// ============================================================
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
              <div
                key={label}
                className="flex items-baseline justify-between gap-2"
              >
                <dt className="text-xs text-neutral-600">{label}</dt>
                <dd className="text-sm font-semibold tabular-nums text-brand-900">
                  {val}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
