export type FormatoCustoExtra =
  | "geral"
  | "por_cab_geral"
  | "por_cab_mes"
  | "mensal";

export interface CustoExtra {
  id: string;
  nome: string;
  formato: FormatoCustoExtra;
  valor: number;
}

export interface Fase {
  id: string;
  nome: string;
  diasNoPeriodo: number;
  areaHa: number;
  gmd: number;
  mortalidadePct: number;
  consumoSuplementoPctPV: number;
  precoSuplementoKg: number;
  /** Fase em confinamento: ignora área/pastagem/lotação. */
  confinamento?: boolean;
}

export interface InputsBase {
  // Compra
  precoCompraArroba: number;
  pesoCompraKg: number;
  freteComissaoCab: number;
  qtdCabecas: number;

  // Fases de manejo
  fases: Fase[];

  // Custos operacionais gerais
  salariosMensal: number;
  sanidadeCab: number;
  pastagemCabMes: number;
  custosExtras: CustoExtra[];

  // Venda
  taxasVendaCab: number;
  precoVendaArroba: number;
  rendimentoCarcacaPct: number;

  // Financiamento (opcional)
  financiamentoAtivo: boolean;
  financiamentoTaxaAnualPct: number;
  financiamentoValorCaptado: number;
}

/** Em variantes: preço de compra/venda são globais; GMD é por fase (id → valor). */
export interface VarianteOverride {
  precoCompraArroba: number;
  precoVendaArroba: number;
  gmdPorFase: Record<string, number>;
}

export type TipoVariante = "realista" | "otimista" | "pessimista";

export type TipoSimulador = "recria_engorda" | "cria";

// ============================================================
// CRIA (vacas + bezerros)
// ============================================================

export type TipoFaseReproducao = "iatf" | "monta_natural";

/** Uma fase da temporada de reprodução. */
export interface FaseReproducao {
  id: string;
  nome: string;
  tipo: TipoFaseReproducao;
  /** Matrizes cobertas nesta fase. */
  matrizesCobertas: number;
  /** Duração da fase em dias. */
  diasNoPeriodo: number;
  /** Taxa de prenhez resultante (0..1). */
  taxaPrenhez: number;
  /** Custo R$/matriz apenas para IATF. */
  custoIATFPorMatriz: number;
}

export type ModoPrecoBezerro = "cab" | "kg";

export interface InputsCria {
  // Plantel
  qtdMatrizes: number;
  pesoMedioMatrizKg: number;

  // Reprodução
  fasesReproducao: FaseReproducao[];

  // Touros (seção própria — custo de caixa direto)
  qtdTourosComprarCiclo: number;
  precoUnitTouro: number;
  qtdTourosJaPossui: number;
  pesoMedioTouroKg: number;
  considerarManutencaoTouro: boolean;
  custoManutencaoTouroAno: number;

  // Gestação e desmame
  diasGestacao: number;
  diasAteDesmame: number;

  // Bezerros
  mortalidadeBezerroPct: number; // 0..1 — nascimento → desmame
  pesoDesmameKg: number;
  proporcaoMachoPct: number; // 0..1
  retencaoBezerrasPct: number; // 0..1 das fêmeas desmamadas

  // Preços bezerros
  modoPrecoBezerroMacho: ModoPrecoBezerro;
  precoBezerroMacho: number; // R$/cab ou R$/kg conforme modo
  modoPrecoBezerra: ModoPrecoBezerro;
  precoBezerra: number;

  // Matriz
  mortalidadeMatrizPct: number; // 0..1 ao longo do ciclo
  qtdDescarteMatriz: number;
  pesoMedioDescarteKg: number;
  precoDescarteArroba: number;
  rendimentoCarcacaDescarte: number; // 0..1

  // Operação
  areaHa: number;
  salariosMensal: number;
  sanidadeMatrizAno: number;
  pastagemCabMes: number;
  custosExtras: CustoExtra[];
  taxasVendaCab: number;

  // Financiamento
  financiamentoAtivo: boolean;
  financiamentoTaxaAnualPct: number;
  financiamentoValorCaptado: number;
}

export interface FaseReproducaoCalculada {
  id: string;
  nome: string;
  tipo: TipoFaseReproducao;
  matrizesCobertas: number;
  taxaPrenhez: number;
  bezerrosPrevistos: number; // cobertas × prenhez
  custoFase: number;
  /** Matrizes ainda vazias ANTES desta fase (limite máximo coerente de cobertura). */
  vaziasDisponiveis: number;
  /** Matrizes que ficaram prenhas nesta fase (= bezerrosPrevistos). */
  prenhasNaFase: number;
  /** Matrizes vazias APÓS esta fase. */
  vaziasAposFase: number;
  /** true se o usuário informou mais cobertas do que havia vazias disponíveis. */
  excessoCobertura: boolean;
}

export interface OutputsCria {
  // Tempo
  diasReproducao: number;
  diasGestacao: number;
  diasAteDesmame: number;
  diasCiclo: number;
  mesesCiclo: number;

  // Plantel
  qtdMatrizesInicio: number;
  qtdMatrizesFim: number;
  qtdTouros: number;

  // Reprodução agregada
  fasesReproducao: FaseReproducaoCalculada[];
  matrizesCobertasTotal: number;
  bezerrosPrevistosTotal: number;
  /** Matrizes prenhas ao final (soma das fases, limitada ao plantel). */
  matrizesPrenhasTotal: number;
  /** Matrizes ainda vazias ao final do último manejo. */
  matrizesVaziasFinal: number;
  /** Taxa geral de prenhez = prenhas/qtdMatrizes. */
  prenhezGeralPct: number;
  bezerrosNascidos: number; // = previstos (simplificação: ignora mortalidade embrionária)
  bezerrosDesmamados: number;
  machosDesmamados: number;
  femeasDesmamadas: number;
  bezerrasRetidas: number;
  bezerrasVendidas: number;

  // Venda
  receitaBezerrosMachos: number;
  receitaBezerras: number;
  receitaDescarteMatriz: number;
  receitaTotal: number;

  // Arrobas/kg produzidos (pra indicadores)
  kgProduzidosBezerros: number; // peso total dos desmamados (exceto retidas)
  arrobasDescarte: number;

  // Custos
  custoReproducaoIATF: number;
  custoComprarTouros: number;
  custoManutencaoTouros: number;
  custoSalarios: number;
  custoSanidade: number;
  custoPastagem: number;
  custosExtrasTotal: number;
  custosExtrasDetalhado: { nome: string; valor: number }[];
  custoTaxasVenda: number;
  custoOperacionalTotal: number;
  totalDesembolsado: number;

  // Lotação (UA/ha) — ponderada por dias de presença
  uaMediaMatrizes: number;
  uaMediaTouros: number;
  uaMediaBezerros: number;
  uaMediaRetidas: number;
  uaMediaTotal: number;
  lotacaoMediaPonderada: number; // UA/ha
  lotacaoReproducao: number; // UA/ha só matrizes + touros
  lotacaoAleitamento: number; // UA/ha pico: matrizes + touros + bezerros

  // Resultado
  lucro: number;
  lucroPorMatriz: number;
  lucroPorHa: number;
  custoPorBezerroDesmamado: number;
  rentabilidadeCiclo: number; // lucro/desembolso
  rentabilidadeAno: number; // anualizada
  desembolsoPorMatrizAno: number;
}

export interface VarianteOverrideCria {
  // v1: sem variantes. Reservado pra compatibilidade de storage.
  precoBezerroMacho: number;
  precoBezerra: number;
  taxaPrenhezDelta: number; // adicionado/subtraído das fases
}

export interface FaseCalculada {
  id: string;
  nome: string;
  dias: number;
  areaHa: number;
  gmd: number;
  mortalidadePct: number;
  confinamento: boolean;
  pesoInicio: number;
  pesoFim: number;
  pesoMedio: number;
  cabInicio: number;
  cabFim: number;
  cabMedia: number;
  lotacaoMedia: number; // UA/ha (0 em confinamento)
  lotacaoMediaCabHa: number; // cab/ha (0 em confinamento)
  consumoSuplementoPctPV: number; // decimal 0..1
  consumoMedioCabDia: number;
  consumoTotalKg: number;
  precoSuplementoKg: number;
  custoSuplemento: number;
  // distribuição proporcional de custos globais
  custoSalariosFase: number;
  custoPastagemFase: number;
  custoSanidadeFase: number; // pontual — vai inteiro na fase 1
  custosExtrasFase: number;
  custoTotalFase: number;
}

export interface Outputs {
  // Compra
  precoCompraCab: number;
  precoCompraFinalArroba: number;
  precoCompraFinalKg: number;
  custoCompraAnimaisTotal: number;

  // Produção agregada
  diasTotal: number;
  pesoSaidaKg: number;
  pesoSaidaArroba: number;
  gmdMedio: number;
  cabFinal: number;
  areaMaxima: number;
  lotacaoEntrada: number;
  lotacaoSaida: number;
  lotacaoMedia: number;

  // Detalhamento por fase
  fases: FaseCalculada[];

  // Suplementação agregada
  consumoTotalSuplementoKg: number;
  custoSuplementoTotal: number;

  // Custos operacionais gerais (agregados)
  custoSalarios: number;
  custoSanidade: number;
  custoPastagem: number;
  custosExtrasTotal: number;
  custosExtrasDetalhado: { nome: string; valor: number }[];
  custoTaxasVenda: number;
  custoOperacionalTotal: number;
  custoOperacionalCab: number;
  diariaOperacao: number;
  desembolsoCabMes: number;

  // Venda
  precoVendaCab: number;
  faturamentoTotal: number;

  // Fechamento
  totalCompra: number;
  totalOperacaoComTaxas: number;
  totalDesembolsado: number;
  lucro: number;
  lucroCab: number;
  lucroHa: number;

  // Financiamento
  financiamentoPagoFinal: number | null;
  lucroLiquidoFinanciado: number | null;

  // Indicadores
  custoArrobaProduzida: number;
  arrobasProduzidasCab: number;
  arrobasProduzidasTotal: number;
  arrobasProduzidasHa: number;
  lotacaoMediaCabHa: number;
  rentabilidadeOperacao: number;
  rentabilidadeMes: number;
  rentabilidadeAno: number;
}
