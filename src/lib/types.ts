export type FormatoCustoExtra = "por_cab_geral" | "por_cab_mes" | "mensal";

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
