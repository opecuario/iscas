import { calcular } from "./calculations";
import { snapshotBase } from "./variantes";
import type { InputsBase, Outputs, VarianteOverride } from "./types";

/**
 * Preço de venda (R$/@) que zera o lucro, mantendo tudo o mais constante.
 * Fórmula: lucro = faturamento - desembolsado
 *          faturamento = precoVenda × arrobas × cabFinal
 *          No ponto de equilíbrio: precoVenda = totalDesembolsado / (arrobas × cabFinal)
 */
export function breakEvenPrecoVenda(out: Outputs): number {
  const arrobasVendidas = out.pesoSaidaArroba * out.cabFinal;
  if (arrobasVendidas <= 0) return 0;
  return out.totalDesembolsado / arrobasVendidas;
}

/** Margem de segurança: quanto (%) o preço de venda pode cair antes de zerar o lucro. */
export function margemSegurancaVenda(out: Outputs, precoVendaAtual: number): number {
  if (precoVendaAtual <= 0) return 0;
  const be = breakEvenPrecoVenda(out);
  return (precoVendaAtual - be) / precoVendaAtual;
}

export interface LinhaSensibilidade {
  variacaoPct: number; // -0.1, -0.05, 0, 0.05, 0.1
  lucro: number;
  deltaLucro: number; // lucro - lucroAtual
}

export interface TabelaSensibilidade {
  variavel: "precoCompra" | "precoVenda" | "gmdMedio";
  rotulo: string;
  linhas: LinhaSensibilidade[];
}

const DELTAS: number[] = [-0.1, -0.05, 0, 0.05, 0.1];

/**
 * Gera tabelas de sensibilidade para as 3 variáveis mais críticas:
 * preço de compra, preço de venda e GMD médio (aplicado proporcionalmente a todas as fases).
 */
export function analiseSensibilidade(
  base: InputsBase,
  override?: Partial<VarianteOverride>
): TabelaSensibilidade[] {
  const snap = snapshotBase(base);
  const precoCompra = override?.precoCompraArroba ?? snap.precoCompraArroba;
  const precoVenda = override?.precoVendaArroba ?? snap.precoVendaArroba;
  const gmdPorFase = { ...snap.gmdPorFase, ...(override?.gmdPorFase ?? {}) };

  const outAtual = calcular(base, { precoCompraArroba: precoCompra, precoVendaArroba: precoVenda, gmdPorFase });
  const lucroAtual = outAtual.lucro;

  function linhasPara(fn: (delta: number) => Outputs): LinhaSensibilidade[] {
    return DELTAS.map((d) => {
      const out = fn(d);
      return { variacaoPct: d, lucro: out.lucro, deltaLucro: out.lucro - lucroAtual };
    });
  }

  return [
    {
      variavel: "precoCompra",
      rotulo: "Preço de compra",
      linhas: linhasPara((d) =>
        calcular(base, {
          precoCompraArroba: precoCompra * (1 + d),
          precoVendaArroba: precoVenda,
          gmdPorFase,
        })
      ),
    },
    {
      variavel: "precoVenda",
      rotulo: "Preço de venda",
      linhas: linhasPara((d) =>
        calcular(base, {
          precoCompraArroba: precoCompra,
          precoVendaArroba: precoVenda * (1 + d),
          gmdPorFase,
        })
      ),
    },
    {
      variavel: "gmdMedio",
      rotulo: "GMD (todas fases)",
      linhas: linhasPara((d) => {
        const gmdAjustado: Record<string, number> = {};
        for (const [id, g] of Object.entries(gmdPorFase)) gmdAjustado[id] = g * (1 + d);
        return calcular(base, {
          precoCompraArroba: precoCompra,
          precoVendaArroba: precoVenda,
          gmdPorFase: gmdAjustado,
        });
      }),
    },
  ];
}

export interface PontoCurvaLucro {
  dia: number;
  pesoMedio: number; // kg, peso vivo por cabeça
  cabAtual: number;
  valorRebanho: number; // faturamento virtual se vendesse hoje (no preço final informado)
  desembolsoAcumulado: number; // compra + operacional parcial até este dia
  resultadoParcial: number; // valorRebanho - desembolsoAcumulado (só indicativo)
}

/**
 * Gera pontos (um por fase + início/fim) da curva de lucro ao longo do tempo.
 * Não é o lucro final (o preço de venda só acontece no fim), mas mostra a
 * evolução patrimonial: quanto o rebanho "vale" a cada fase vs. quanto
 * já foi desembolsado.
 */
export function curvaLucro(base: InputsBase, override?: Partial<VarianteOverride>): PontoCurvaLucro[] {
  const out = calcular(base, override);
  const snap = snapshotBase(base);
  const precoVenda = override?.precoVendaArroba ?? snap.precoVendaArroba;

  const pontos: PontoCurvaLucro[] = [];
  // Ponto inicial (dia 0): valor = compra desembolsada
  pontos.push({
    dia: 0,
    pesoMedio: base.pesoCompraKg,
    cabAtual: base.qtdCabecas,
    valorRebanho: out.totalCompra,
    desembolsoAcumulado: out.totalCompra,
    resultadoParcial: 0,
  });

  let dia = 0;
  let desembolsoAcum = out.totalCompra;
  for (const fc of out.fases) {
    dia += fc.dias;
    desembolsoAcum += fc.custoTotalFase;
    const arrobasCarcaca = (base.rendimentoCarcacaPct * fc.pesoFim) / 15;
    const valorRebanho = precoVenda * arrobasCarcaca * fc.cabFim;
    pontos.push({
      dia,
      pesoMedio: fc.pesoFim,
      cabAtual: fc.cabFim,
      valorRebanho,
      desembolsoAcumulado: desembolsoAcum,
      resultadoParcial: valorRebanho - desembolsoAcum,
    });
  }

  return pontos;
}

export interface MesFluxo {
  mes: number; // 1, 2, 3...
  compra: number;
  suplemento: number;
  operacional: number; // salários + sanidade + pastagem
  extras: number;
  taxasVenda: number;
  receita: number;
  saidas: number;
  entradas: number;
  saldoMes: number;
  desembolsadoAcumulado: number;
  caixaAcumulado: number; // entradas - saídas acumuladas
}

export interface FluxoCaixa {
  meses: MesFluxo[];
  picoNecessidadeCaixa: number; // quanto de capital precisa ter (maior déficit)
  mesPico: number; // mês em que o déficit de caixa é máximo
  totalDesembolsado: number;
  totalReceita: number;
  lucroFinal: number;
}

/**
 * Distribui os custos da operação mês a mês, considerando que:
 * - Compra + frete: 100% no mês 1
 * - Sanidade + custos extras pontuais (geral, por_cab_geral): mês 1
 * - Salários, pastagem, suplemento, extras recorrentes: proporcional por dia/mês
 * - Taxas de venda + receita: último mês
 */
export function fluxoCaixaMensal(
  base: InputsBase,
  override?: Partial<VarianteOverride>
): FluxoCaixa {
  const out = calcular(base, override);
  const diasTotal = out.diasTotal;
  const totalMeses = Math.max(1, Math.ceil(diasTotal / 30));
  const extras = base.custosExtras ?? [];

  const meses: MesFluxo[] = Array.from({ length: totalMeses }, (_, i) => ({
    mes: i + 1,
    compra: 0,
    suplemento: 0,
    operacional: 0,
    extras: 0,
    taxasVenda: 0,
    receita: 0,
    saidas: 0,
    entradas: 0,
    saldoMes: 0,
    desembolsadoAcumulado: 0,
    caixaAcumulado: 0,
  }));

  // Mês 1: compra, sanidade, extras pontuais
  const primeiro = meses[0];
  primeiro.compra += out.totalCompra;
  primeiro.operacional += base.sanidadeCab * base.qtdCabecas;
  for (const c of extras) {
    if (c.formato === "geral") primeiro.extras += c.valor;
    else if (c.formato === "por_cab_geral")
      primeiro.extras += c.valor * base.qtdCabecas;
  }

  // Distribui custos recorrentes por dia, alocando ao mês correspondente
  let diaGlobal = 0;
  for (const fc of out.fases) {
    if (fc.dias <= 0) continue;
    const custoSupDia = fc.custoSuplemento / fc.dias;
    const salarioDia = base.salariosMensal / 30;
    const pastagemDia = fc.confinamento
      ? 0
      : (base.pastagemCabMes * fc.cabMedia) / 30;
    for (let d = 0; d < fc.dias; d++) {
      const mesIdx = Math.min(Math.floor(diaGlobal / 30), totalMeses - 1);
      const ref = meses[mesIdx];
      ref.suplemento += custoSupDia;
      ref.operacional += salarioDia + pastagemDia;
      for (const c of extras) {
        if (c.formato === "mensal") ref.extras += c.valor / 30;
        else if (c.formato === "por_cab_mes")
          ref.extras += (c.valor * fc.cabMedia) / 30;
      }
      diaGlobal++;
    }
  }

  // Último mês: taxas + receita
  const ultimo = meses[totalMeses - 1];
  ultimo.taxasVenda += base.taxasVendaCab * out.cabFinal;
  ultimo.receita += out.faturamentoTotal;

  let desemAcum = 0;
  let caixaAcum = 0;
  let picoNecessidade = 0;
  let mesPico = 1;
  for (const m of meses) {
    m.saidas =
      m.compra + m.suplemento + m.operacional + m.extras + m.taxasVenda;
    m.entradas = m.receita;
    m.saldoMes = m.entradas - m.saidas;
    desemAcum += m.saidas;
    caixaAcum += m.saldoMes;
    m.desembolsadoAcumulado = desemAcum;
    m.caixaAcumulado = caixaAcum;
    // A receita de venda só acontece no fim do mês (depois de quitar os
    // custos desse mês). O pico de necessidade de caixa precisa olhar o
    // saldo ANTES da receita entrar — senão o pico fica disfarçado pelo
    // faturamento do último mês.
    const caixaAntesDaReceita = caixaAcum - m.receita;
    const necessidade = -caixaAntesDaReceita; // positivo = déficit
    if (necessidade > picoNecessidade) {
      picoNecessidade = necessidade;
      mesPico = m.mes;
    }
  }

  return {
    meses,
    picoNecessidadeCaixa: picoNecessidade,
    mesPico,
    totalDesembolsado: desemAcum,
    totalReceita: meses.reduce((s, m) => s + m.entradas, 0),
    lucroFinal: caixaAcum,
  };
}
