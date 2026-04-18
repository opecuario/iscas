import type {
  CustoExtra,
  Fase,
  FaseCalculada,
  InputsBase,
  Outputs,
  VarianteOverride,
} from "./types";

function gerarIdFase(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function novaFase(nome = "Nova fase"): Fase {
  return {
    id: gerarIdFase(),
    nome,
    diasNoPeriodo: 0,
    areaHa: 0,
    gmd: 0,
    mortalidadePct: 0,
    consumoSuplementoPctPV: 0,
    precoSuplementoKg: 0,
    confinamento: false,
  };
}

/** Aplica o override de preços e GMD-por-fase sobre a base. */
function aplicarOverride(
  base: InputsBase,
  override?: Partial<VarianteOverride>
): { precoCompraArroba: number; precoVendaArroba: number; fases: Fase[] } {
  const precoCompraArroba =
    override?.precoCompraArroba ?? base.precoCompraArroba;
  const precoVendaArroba =
    override?.precoVendaArroba ?? base.precoVendaArroba;
  const gmdPorFase = override?.gmdPorFase ?? {};
  const fases = base.fases.map((f) => ({
    ...f,
    gmd: gmdPorFase[f.id] ?? f.gmd,
  }));
  return { precoCompraArroba, precoVendaArroba, fases };
}

/**
 * Cálculo incremental por fase.
 * Cada fase tem: dias, área, GMD, mortalidade, consumo/preço de suplemento.
 * Custos globais (salários, pastagem, extras recorrentes) são distribuídos
 * proporcionalmente aos dias de cada fase. Sanidade e custos "por cab geral"
 * ficam pontuais na primeira fase.
 */
export function calcular(
  base: InputsBase,
  override?: Partial<VarianteOverride>
): Outputs {
  const { precoCompraArroba, precoVendaArroba, fases } = aplicarOverride(
    base,
    override
  );

  const {
    pesoCompraKg: pesoCompra,
    freteComissaoCab: frete,
    qtdCabecas: cabInicialTotal,
    rendimentoCarcacaPct: rendimento,
    salariosMensal: salarios,
    sanidadeCab: sanidade,
    pastagemCabMes: pastagem,
    taxasVendaCab: taxas,
    financiamentoAtivo,
    financiamentoTaxaAnualPct: taxaFin,
    financiamentoValorCaptado: valorFin,
  } = base;

  const extras: CustoExtra[] = base.custosExtras ?? [];
  const diasTotal = fases.reduce((s, f) => s + f.diasNoPeriodo, 0);
  // Área máxima considera apenas fases a pasto (confinadas não ocupam pasto).
  const areaMaxima = fases.reduce(
    (m, f) => (f.confinamento ? m : Math.max(m, f.areaHa)),
    0
  );
  const diasPasto = fases.reduce(
    (s, f) => (f.confinamento ? s : s + f.diasNoPeriodo),
    0
  );
  const mesesTotais = diasTotal / 30;

  // --- Compra
  const arrobasCompra = pesoCompra > 0 ? pesoCompra / 30 : 0;
  const precoCompraCab = arrobasCompra * precoCompraArroba + frete;
  const precoCompraFinalArroba =
    arrobasCompra > 0 ? precoCompraCab / arrobasCompra : 0;
  const precoCompraFinalKg =
    pesoCompra > 0 ? precoCompraCab / pesoCompra : 0;
  const custoCompraAnimaisTotal =
    cabInicialTotal * precoCompraFinalKg * pesoCompra;

  // --- Fases
  let pesoAtual = pesoCompra;
  let cabAtual = cabInicialTotal;
  const fasesCalc: FaseCalculada[] = fases.map((f, idx) => {
    const confinada = !!f.confinamento;
    const pesoInicio = pesoAtual;
    const cabInicio = cabAtual;
    const pesoFim = pesoInicio + f.gmd * f.diasNoPeriodo;
    const cabFim = cabInicio * (1 - (f.mortalidadePct || 0));
    const pesoMedio = (pesoInicio + pesoFim) / 2;
    const cabMedia = (cabInicio + cabFim) / 2;
    const mesesFase = f.diasNoPeriodo / 30;

    const consumoMedioCabDia = f.consumoSuplementoPctPV * pesoMedio;
    const consumoTotalKg = consumoMedioCabDia * f.diasNoPeriodo * cabMedia;
    const custoSuplemento = consumoTotalKg * f.precoSuplementoKg;

    const custoSalariosFase = salarios * mesesFase;
    // Pastagem não se aplica a fases em confinamento
    const custoPastagemFase = confinada
      ? 0
      : pastagem * mesesFase * cabMedia;

    // Custos extras na fase
    let custosExtrasFase = 0;
    for (const c of extras) {
      if (c.formato === "por_cab_geral") {
        // pontual → vai inteiro na fase 1
        if (idx === 0) custosExtrasFase += c.valor * cabInicialTotal;
      } else if (c.formato === "por_cab_mes") {
        custosExtrasFase += c.valor * cabMedia * mesesFase;
      } else if (c.formato === "mensal") {
        custosExtrasFase += c.valor * mesesFase;
      }
    }

    // Sanidade pontual — também vai inteira na fase 1
    const custoSanidadeFase = idx === 0 ? sanidade * cabInicialTotal : 0;

    // Lotação só existe em fases a pasto
    const lotacaoMediaFase =
      !confinada && f.areaHa > 0
        ? (cabMedia * pesoMedio) / 450 / f.areaHa
        : 0;
    const lotacaoMediaCabHaFase =
      !confinada && f.areaHa > 0 ? cabMedia / f.areaHa : 0;

    const custoTotalFase =
      custoSuplemento +
      custoSalariosFase +
      custoPastagemFase +
      custoSanidadeFase +
      custosExtrasFase;

    pesoAtual = pesoFim;
    cabAtual = cabFim;

    return {
      id: f.id,
      nome: f.nome,
      dias: f.diasNoPeriodo,
      areaHa: f.areaHa,
      gmd: f.gmd,
      mortalidadePct: f.mortalidadePct,
      confinamento: confinada,
      pesoInicio,
      pesoFim,
      pesoMedio,
      cabInicio,
      cabFim,
      cabMedia,
      lotacaoMedia: lotacaoMediaFase,
      lotacaoMediaCabHa: lotacaoMediaCabHaFase,
      consumoSuplementoPctPV: f.consumoSuplementoPctPV,
      consumoMedioCabDia,
      consumoTotalKg,
      precoSuplementoKg: f.precoSuplementoKg,
      custoSuplemento,
      custoSalariosFase,
      custoPastagemFase,
      custoSanidadeFase,
      custosExtrasFase,
      custoTotalFase,
    };
  });

  // --- Agregados
  const pesoSaidaKg = pesoAtual;
  const cabFinal = cabAtual;
  const pesoSaidaArroba = (rendimento * pesoSaidaKg) / 15;
  const gmdMedio =
    diasTotal > 0 ? (pesoSaidaKg - pesoCompra) / diasTotal : 0;

  const custoSuplementoTotal = fasesCalc.reduce(
    (s, f) => s + f.custoSuplemento,
    0
  );
  const consumoTotalSuplementoKg = fasesCalc.reduce(
    (s, f) => s + f.consumoTotalKg,
    0
  );
  const custoSalarios = fasesCalc.reduce(
    (s, f) => s + f.custoSalariosFase,
    0
  );
  const custoPastagem = fasesCalc.reduce(
    (s, f) => s + f.custoPastagemFase,
    0
  );
  const custoSanidade = fasesCalc.reduce(
    (s, f) => s + f.custoSanidadeFase,
    0
  );

  // Custos extras detalhados (para exibição "por linha")
  const custosExtrasDetalhado = extras.map((c) => {
    let valor = 0;
    if (c.formato === "por_cab_geral") {
      valor = c.valor * cabInicialTotal;
    } else if (c.formato === "por_cab_mes") {
      valor = fasesCalc.reduce(
        (s, f) => s + c.valor * f.cabMedia * (f.dias / 30),
        0
      );
    } else if (c.formato === "mensal") {
      valor = c.valor * mesesTotais;
    }
    return { nome: c.nome, valor };
  });
  const custosExtrasTotal = custosExtrasDetalhado.reduce(
    (s, x) => s + x.valor,
    0
  );

  const custoOperacionalTotal =
    custoSalarios +
    custoSanidade +
    custoPastagem +
    custoSuplementoTotal +
    custosExtrasTotal;
  const custoOperacionalCab =
    cabInicialTotal > 0 ? custoOperacionalTotal / cabInicialTotal : 0;
  const diariaOperacao =
    cabInicialTotal > 0 && diasTotal > 0
      ? custoOperacionalTotal / cabInicialTotal / diasTotal
      : 0;
  const desembolsoCabMes = diariaOperacao * 30;

  // --- Venda
  const custoTaxasVenda = taxas * cabFinal;
  const precoVendaCab = precoVendaArroba * pesoSaidaArroba;
  const faturamentoTotal = precoVendaCab * cabFinal;

  // --- Fechamento
  const totalCompra = custoCompraAnimaisTotal;
  const totalOperacaoComTaxas = custoOperacionalTotal + custoTaxasVenda;
  const totalDesembolsado = totalOperacaoComTaxas + totalCompra;
  const lucro = faturamentoTotal - totalDesembolsado;
  const lucroCab = cabInicialTotal > 0 ? lucro / cabInicialTotal : 0;
  const lucroHa = areaMaxima > 0 ? lucro / areaMaxima : 0;

  // --- Financiamento
  // Taxa informada é a.a. composta; aplicamos pelo prazo real da operação.
  let financiamentoPagoFinal: number | null = null;
  let lucroLiquidoFinanciado: number | null = null;
  if (financiamentoAtivo && valorFin > 0) {
    const anosOperacao = diasTotal > 0 ? diasTotal / 365 : 0;
    financiamentoPagoFinal = valorFin * Math.pow(1 + taxaFin, anosOperacao);
    lucroLiquidoFinanciado = lucro - (financiamentoPagoFinal - valorFin);
  }

  // --- Indicadores
  const arrobasProduzidasCab = pesoSaidaArroba - arrobasCompra;
  const arrobasGanhasPesoVivo = (pesoSaidaKg - pesoCompra) / 30;
  const custoArrobaProduzida =
    arrobasGanhasPesoVivo > 0 ? custoOperacionalCab / arrobasGanhasPesoVivo : 0;
  const arrobasProduzidasTotal = arrobasProduzidasCab * cabFinal;
  const arrobasProduzidasHa =
    areaMaxima > 0 ? arrobasProduzidasTotal / areaMaxima : 0;
  const lotacaoMediaCabHa =
    areaMaxima > 0 ? cabInicialTotal / areaMaxima : 0;

  // Lotação média/entrada/saída (usa área máxima como referência)
  const lotacaoEntrada =
    areaMaxima > 0 ? (cabInicialTotal * pesoCompra) / 450 / areaMaxima : 0;
  const lotacaoSaida =
    areaMaxima > 0 ? (cabFinal * pesoSaidaKg) / 450 / areaMaxima : 0;
  // Lotação média ponderada pelos dias — só conta fases a pasto (confinadas têm lotação 0).
  const lotacaoMedia =
    diasPasto > 0
      ? fasesCalc.reduce((s, f) => s + f.lotacaoMedia * f.dias, 0) / diasPasto
      : 0;

  const rentabilidadeOperacao =
    totalDesembolsado > 0 ? lucro / totalDesembolsado : 0;
  // Juros compostos: (1 + r)^(365/dias) − 1 para anual, (1 + r)^(30.4375/dias) − 1 para mensal.
  // Protegemos a base contra (1 + r) ≤ 0 (impossível em condições normais,
  // mas evita NaN caso lucro seja ≤ −totalDesembolsado).
  const baseRent = Math.max(1 + rentabilidadeOperacao, 0);
  const rentabilidadeMes =
    diasTotal > 0 ? Math.pow(baseRent, 30.4375 / diasTotal) - 1 : 0;
  const rentabilidadeAno =
    diasTotal > 0 ? Math.pow(baseRent, 365 / diasTotal) - 1 : 0;

  return {
    precoCompraCab,
    precoCompraFinalArroba,
    precoCompraFinalKg,
    custoCompraAnimaisTotal,
    diasTotal,
    pesoSaidaKg,
    pesoSaidaArroba,
    gmdMedio,
    cabFinal,
    areaMaxima,
    lotacaoEntrada,
    lotacaoSaida,
    lotacaoMedia,
    fases: fasesCalc,
    consumoTotalSuplementoKg,
    custoSuplementoTotal,
    custoSalarios,
    custoSanidade,
    custoPastagem,
    custosExtrasTotal,
    custosExtrasDetalhado,
    custoTaxasVenda,
    custoOperacionalTotal,
    custoOperacionalCab,
    diariaOperacao,
    desembolsoCabMes,
    precoVendaCab,
    faturamentoTotal,
    totalCompra,
    totalOperacaoComTaxas,
    totalDesembolsado,
    lucro,
    lucroCab,
    lucroHa,
    financiamentoPagoFinal,
    lucroLiquidoFinanciado,
    custoArrobaProduzida,
    arrobasProduzidasCab,
    arrobasProduzidasTotal,
    arrobasProduzidasHa,
    lotacaoMediaCabHa,
    rentabilidadeOperacao,
    rentabilidadeMes,
    rentabilidadeAno,
  };
}

/** Valores iniciais — uma fase única zerada. */
export const INPUTS_PADRAO: InputsBase = {
  precoCompraArroba: 0,
  pesoCompraKg: 0,
  freteComissaoCab: 0,
  qtdCabecas: 0,
  fases: [
    {
      id: "fase-inicial",
      nome: "Fase 1",
      diasNoPeriodo: 0,
      areaHa: 0,
      gmd: 0,
      mortalidadePct: 0,
      consumoSuplementoPctPV: 0,
      precoSuplementoKg: 0,
    },
  ],
  salariosMensal: 0,
  sanidadeCab: 0,
  pastagemCabMes: 0,
  custosExtras: [],
  taxasVendaCab: 0,
  precoVendaArroba: 0,
  rendimentoCarcacaPct: 0.5,
  financiamentoAtivo: false,
  financiamentoTaxaAnualPct: 0,
  financiamentoValorCaptado: 0,
};
