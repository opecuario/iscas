import type {
  CustoExtra,
  FaseReproducao,
  FaseReproducaoCalculada,
  InputsCria,
  OutputsCria,
} from "./types";

function gerarIdFase(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function novaFaseReproducao(nome = "Estação de monta"): FaseReproducao {
  return {
    id: gerarIdFase(),
    nome,
    tipo: "monta_natural",
    matrizesCobertas: 0,
    diasNoPeriodo: 0,
    taxaPrenhez: 0,
    custoIATFPorMatriz: 0,
  };
}

const PESO_NASC_BEZERRO_KG = 30;
const UA_KG = 450;

export function calcularCria(base: InputsCria): OutputsCria {
  const fases = base.fasesReproducao ?? [];
  const extras = base.custosExtras ?? [];

  // --- Tempo ---
  const diasReproducao = fases.reduce((s, f) => s + (f.diasNoPeriodo || 0), 0);
  const diasGestacao = base.diasGestacao || 0;
  const diasAteDesmame = base.diasAteDesmame || 0;
  const diasCiclo = Math.max(1, diasReproducao + diasGestacao + diasAteDesmame);
  const mesesCiclo = diasCiclo / 30;

  // --- Reprodução: bezerros por fase (sequencial) ---
  const qtdMatrizesParaReproducao = Math.max(0, base.qtdMatrizes || 0);
  let vaziasCorrente = qtdMatrizesParaReproducao;
  const fasesCalc: FaseReproducaoCalculada[] = fases.map((f) => {
    const cobertas = Math.max(0, f.matrizesCobertas || 0);
    const prenhez = Math.max(0, Math.min(1, f.taxaPrenhez || 0));
    const vaziasAntes = vaziasCorrente;
    const excesso = cobertas > vaziasAntes;
    // Para previstos: respeita o limite biológico (não pode cobrir mais do que há vazias).
    const cobertasEfetivas = Math.min(cobertas, vaziasAntes);
    const previstos = cobertasEfetivas * prenhez;
    vaziasCorrente = Math.max(0, vaziasAntes - previstos);
    const custoFase =
      f.tipo === "iatf" ? cobertas * (f.custoIATFPorMatriz || 0) : 0;
    return {
      id: f.id,
      nome: f.nome,
      tipo: f.tipo,
      matrizesCobertas: cobertas,
      taxaPrenhez: prenhez,
      bezerrosPrevistos: previstos,
      custoFase,
      vaziasDisponiveis: vaziasAntes,
      prenhasNaFase: previstos,
      vaziasAposFase: vaziasCorrente,
      excessoCobertura: excesso,
    };
  });
  const matrizesCobertasTotal = fasesCalc.reduce(
    (s, f) => s + f.matrizesCobertas,
    0
  );
  const bezerrosPrevistosTotal = fasesCalc.reduce(
    (s, f) => s + f.bezerrosPrevistos,
    0
  );
  const matrizesPrenhasTotal = fasesCalc.reduce(
    (s, f) => s + f.prenhasNaFase,
    0
  );
  const matrizesVaziasFinal = vaziasCorrente;
  const prenhezGeralPct =
    qtdMatrizesParaReproducao > 0
      ? matrizesPrenhasTotal / qtdMatrizesParaReproducao
      : 0;

  // --- Bezerros nascidos e desmamados ---
  const bezerrosNascidos = bezerrosPrevistosTotal;
  const mortBezerro = Math.max(0, Math.min(1, base.mortalidadeBezerroPct));
  const bezerrosDesmamados = bezerrosNascidos * (1 - mortBezerro);

  const propMacho = Math.max(0, Math.min(1, base.proporcaoMachoPct || 0.5));
  const machosDesmamados = bezerrosDesmamados * propMacho;
  const femeasDesmamadas = bezerrosDesmamados * (1 - propMacho);

  const retPct = Math.max(0, Math.min(1, base.retencaoBezerrasPct || 0));
  const bezerrasRetidas = femeasDesmamadas * retPct;
  const bezerrasVendidas = femeasDesmamadas - bezerrasRetidas;

  // --- Receita ---
  const pesoDesmame = Math.max(0, base.pesoDesmameKg || 0);
  function receitaPorBezerro(
    qtd: number,
    modo: "cab" | "kg",
    preco: number
  ): number {
    if (qtd <= 0 || preco <= 0) return 0;
    if (modo === "cab") return qtd * preco;
    return qtd * pesoDesmame * preco;
  }
  const receitaBezerrosMachos = receitaPorBezerro(
    machosDesmamados,
    base.modoPrecoBezerroMacho,
    base.precoBezerroMacho
  );
  const receitaBezerras = receitaPorBezerro(
    bezerrasVendidas,
    base.modoPrecoBezerra,
    base.precoBezerra
  );

  // Descarte de matriz
  const qtdDescarte = Math.max(0, base.qtdDescarteMatriz || 0);
  const arrobasPorDescarte =
    base.pesoMedioDescarteKg > 0 && base.rendimentoCarcacaDescarte > 0
      ? (base.pesoMedioDescarteKg * base.rendimentoCarcacaDescarte) / 15
      : 0;
  const arrobasDescarte = qtdDescarte * arrobasPorDescarte;
  const receitaDescarteMatriz = arrobasDescarte * (base.precoDescarteArroba || 0);

  const receitaTotal =
    receitaBezerrosMachos + receitaBezerras + receitaDescarteMatriz;

  // --- Plantel ao longo do ciclo ---
  const qtdMatrizesInicio = Math.max(0, base.qtdMatrizes || 0);
  const mortMatriz = Math.max(0, Math.min(1, base.mortalidadeMatrizPct || 0));
  const matrizesMortas = qtdMatrizesInicio * mortMatriz;
  const qtdMatrizesFim = Math.max(
    0,
    qtdMatrizesInicio - matrizesMortas - qtdDescarte
  );
  const qtdTouros =
    Math.max(0, base.qtdTourosComprarCiclo || 0) +
    Math.max(0, base.qtdTourosJaPossui || 0);

  // --- Custos de reprodução (fases IATF) ---
  const custoReproducaoIATF = fasesCalc.reduce((s, f) => s + f.custoFase, 0);

  // --- Touros ---
  const custoComprarTouros =
    Math.max(0, base.qtdTourosComprarCiclo || 0) *
    Math.max(0, base.precoUnitTouro || 0);
  const custoManutencaoTouros =
    base.considerarManutencaoTouro && base.custoManutencaoTouroAno > 0
      ? qtdTouros * base.custoManutencaoTouroAno * (diasCiclo / 365)
      : 0;

  // --- Custos operacionais ---
  // Cabeças médias ao longo do ciclo (ponderação simples pro cálculo de pastagem):
  // Matrizes (ciclo inteiro) + Touros (ciclo inteiro)
  // + Bezerros durante aleitamento (210 dias / diasCiclo) com peso médio proporcional
  // + Bezerras retidas (dias após desmame até fim do ciclo — zero neste modelo, o ciclo termina no desmame)
  const fracAleitamento = diasAteDesmame / diasCiclo;
  const cabMatrizTouroMedia = (qtdMatrizesInicio + qtdMatrizesFim) / 2 + qtdTouros;
  const cabBezerroMedia =
    (bezerrosNascidos + bezerrosDesmamados) / 2; // ponderação dentro dos dias de aleitamento
  const cabMediaCiclo = cabMatrizTouroMedia + cabBezerroMedia * fracAleitamento;

  const custoSalarios = base.salariosMensal * mesesCiclo;
  // Sanidade por matriz/ano: proporcional ao ciclo (matrizes médias)
  const matrizesMedias = (qtdMatrizesInicio + qtdMatrizesFim) / 2;
  const custoSanidade =
    base.sanidadeMatrizAno * matrizesMedias * (diasCiclo / 365);
  // Pastagem: R$/cab/mês aplicado sobre cabeças médias no ciclo
  const custoPastagem = base.pastagemCabMes * cabMediaCiclo * mesesCiclo;

  // Custos extras — mesmos 4 formatos; "por cabeça" usa cabMatrizTouroMedia como referência
  const cabBaseExtras = cabMatrizTouroMedia;
  const custosExtrasDetalhado = extras.map((c) => {
    let valor = 0;
    if (c.formato === "geral") {
      valor = c.valor;
    } else if (c.formato === "por_cab_geral") {
      valor = c.valor * cabBaseExtras;
    } else if (c.formato === "por_cab_mes") {
      valor = c.valor * cabBaseExtras * mesesCiclo;
    } else if (c.formato === "mensal") {
      valor = c.valor * mesesCiclo;
    }
    return { nome: c.nome, valor };
  });
  const custosExtrasTotal = custosExtrasDetalhado.reduce(
    (s, x) => s + x.valor,
    0
  );

  // Taxas de venda — sobre cabeças vendidas (machos + bezerras vendidas + descarte)
  const cabVendidas = machosDesmamados + bezerrasVendidas + qtdDescarte;
  const custoTaxasVenda = (base.taxasVendaCab || 0) * cabVendidas;

  const custoOperacionalTotal =
    custoReproducaoIATF +
    custoComprarTouros +
    custoManutencaoTouros +
    custoSalarios +
    custoSanidade +
    custoPastagem +
    custosExtrasTotal +
    custoTaxasVenda;

  const totalDesembolsado = custoOperacionalTotal;

  // --- Lotação (UA ponderada por dias de presença) ---
  // Matriz: (peso/450) × dias
  // Touro: (peso/450) × dias
  // Bezerro: ((30 + pesoDesmame)/2) / 450 × diasAteDesmame × qtd bezerros vivos médios
  const uaPorMatriz = (base.pesoMedioMatrizKg || UA_KG) / UA_KG;
  const uaPorTouro = (base.pesoMedioTouroKg || 800) / UA_KG;
  const pesoMedioBezerro = (PESO_NASC_BEZERRO_KG + pesoDesmame) / 2;
  const uaPorBezerro = pesoMedioBezerro / UA_KG;
  // Retidas: peso médio do desmame (no breve intervalo que restarem). Neste modelo o
  // ciclo termina no desmame, então fração de dias ≈ 0.
  const uaPorRetida = pesoDesmame / UA_KG;
  const diasRetidaNoCiclo = 0;

  const cabBezerrosMedia = (bezerrosNascidos + bezerrosDesmamados) / 2;

  const uaDiasMatrizes = matrizesMedias * uaPorMatriz * diasCiclo;
  const uaDiasTouros = qtdTouros * uaPorTouro * diasCiclo;
  const uaDiasBezerros = cabBezerrosMedia * uaPorBezerro * diasAteDesmame;
  const uaDiasRetidas = bezerrasRetidas * uaPorRetida * diasRetidaNoCiclo;
  const uaDiasTotal =
    uaDiasMatrizes + uaDiasTouros + uaDiasBezerros + uaDiasRetidas;

  const uaMediaMatrizes = uaDiasMatrizes / diasCiclo;
  const uaMediaTouros = uaDiasTouros / diasCiclo;
  const uaMediaBezerros = uaDiasBezerros / diasCiclo;
  const uaMediaRetidas = uaDiasRetidas / diasCiclo;
  const uaMediaTotal = uaDiasTotal / diasCiclo;

  const area = base.areaHa || 0;
  const lotacaoMediaPonderada = area > 0 ? uaMediaTotal / area : 0;
  const lotacaoReproducao =
    area > 0 ? (matrizesMedias * uaPorMatriz + qtdTouros * uaPorTouro) / area : 0;
  // Pico em aleitamento: assume-se matrizes vivas + touros + bezerros desmamados
  // (proxy: último terço do aleitamento, quando bezerro está quase pesado)
  const lotacaoAleitamento =
    area > 0
      ? (matrizesMedias * uaPorMatriz +
          qtdTouros * uaPorTouro +
          bezerrosDesmamados * uaPorBezerro) /
        area
      : 0;

  // --- Indicadores ---
  const kgProduzidosBezerros =
    (machosDesmamados + bezerrasVendidas) * pesoDesmame;
  const lucro = receitaTotal - totalDesembolsado;
  const lucroPorMatriz = qtdMatrizesInicio > 0 ? lucro / qtdMatrizesInicio : 0;
  const lucroPorHa = area > 0 ? lucro / area : 0;
  const custoPorBezerroDesmamado =
    bezerrosDesmamados > 0 ? totalDesembolsado / bezerrosDesmamados : 0;
  const rentabilidadeCiclo =
    totalDesembolsado > 0 ? lucro / totalDesembolsado : 0;
  const rentabilidadeAno =
    mesesCiclo > 0 ? Math.pow(1 + rentabilidadeCiclo, 12 / mesesCiclo) - 1 : 0;
  const desembolsoPorMatrizAno =
    qtdMatrizesInicio > 0 && mesesCiclo > 0
      ? (totalDesembolsado / qtdMatrizesInicio) * (12 / mesesCiclo)
      : 0;

  return {
    diasReproducao,
    diasGestacao,
    diasAteDesmame,
    diasCiclo,
    mesesCiclo,
    qtdMatrizesInicio,
    qtdMatrizesFim,
    qtdTouros,
    fasesReproducao: fasesCalc,
    matrizesCobertasTotal,
    bezerrosPrevistosTotal,
    matrizesPrenhasTotal,
    matrizesVaziasFinal,
    prenhezGeralPct,
    bezerrosNascidos,
    bezerrosDesmamados,
    machosDesmamados,
    femeasDesmamadas,
    bezerrasRetidas,
    bezerrasVendidas,
    receitaBezerrosMachos,
    receitaBezerras,
    receitaDescarteMatriz,
    receitaTotal,
    kgProduzidosBezerros,
    arrobasDescarte,
    custoReproducaoIATF,
    custoComprarTouros,
    custoManutencaoTouros,
    custoSalarios,
    custoSanidade,
    custoPastagem,
    custosExtrasTotal,
    custosExtrasDetalhado,
    custoTaxasVenda,
    custoOperacionalTotal,
    totalDesembolsado,
    uaMediaMatrizes,
    uaMediaTouros,
    uaMediaBezerros,
    uaMediaRetidas,
    uaMediaTotal,
    lotacaoMediaPonderada,
    lotacaoReproducao,
    lotacaoAleitamento,
    lucro,
    lucroPorMatriz,
    lucroPorHa,
    custoPorBezerroDesmamado,
    rentabilidadeCiclo,
    rentabilidadeAno,
    desembolsoPorMatrizAno,
  };
}

export function inputsCriaPadrao(): InputsCria {
  return {
    qtdMatrizes: 0,
    pesoMedioMatrizKg: 450,
    fasesReproducao: [],
    qtdTourosComprarCiclo: 0,
    precoUnitTouro: 0,
    qtdTourosJaPossui: 0,
    pesoMedioTouroKg: 800,
    considerarManutencaoTouro: false,
    custoManutencaoTouroAno: 0,
    diasGestacao: 270,
    diasAteDesmame: 210,
    mortalidadeBezerroPct: 0,
    pesoDesmameKg: 180,
    proporcaoMachoPct: 0.5,
    retencaoBezerrasPct: 0,
    modoPrecoBezerroMacho: "cab",
    precoBezerroMacho: 0,
    modoPrecoBezerra: "cab",
    precoBezerra: 0,
    mortalidadeMatrizPct: 0,
    qtdDescarteMatriz: 0,
    pesoMedioDescarteKg: 450,
    precoDescarteArroba: 0,
    rendimentoCarcacaDescarte: 0.5,
    areaHa: 0,
    salariosMensal: 0,
    sanidadeMatrizAno: 0,
    pastagemCabMes: 0,
    custosExtras: [],
    taxasVendaCab: 0,
    financiamentoAtivo: false,
    financiamentoTaxaAnualPct: 0,
    financiamentoValorCaptado: 0,
  };
}

function assertUnused(_c: CustoExtra) {
  // Mantém CustoExtra referenciado para aviso do compilador ao evoluir formatos.
}
void assertUnused;
