export type FormatoCustoExtra = "por_cab_geral" | "por_cab_mes" | "mensal";

export interface CustoExtra {
  id: string;
  nome: string;
  formato: FormatoCustoExtra;
  valor: number;
}

export interface InputsBase {
  // Compra
  precoCompraArroba: number;      // B2 — R$/@ na compra
  pesoCompraKg: number;           // B3 — peso inicial (kg)
  freteComissaoCab: number;       // B4 — R$/cab
  qtdCabecas: number;             // B8

  // Sistema produtivo
  areaHa: number;                 // B12
  gmd: number;                    // B14 — kg/dia
  periodoDias: number;            // B15
  mortalidadePct: number;         // B17 — 0..1
  rendimentoCarcacaPct: number;   // B18 — 0..1

  // Suplementação
  consumoSuplementoPctPV: number; // B25 — 0..1
  precoSuplementoKg: number;      // B29

  // Custos
  salariosMensal: number;         // B33
  sanidadeCab: number;            // B34
  pastagemCabMes: number;         // B35
  outrosCustosCabMes: number;     // B36
  custosExtras: CustoExtra[];     // custos personalizados adicionados pelo usuário

  // Venda
  taxasVendaCab: number;          // B44
  precoVendaArroba: number;       // B45

  // Financiamento (opcional)
  financiamentoAtivo: boolean;
  financiamentoTaxaAnualPct: number; // B58 — 0..1
  financiamentoValorCaptado: number; // B59
}

/** Os únicos três campos editáveis em variantes otimista/pessimista. */
export interface VarianteOverride {
  gmd: number;
  precoCompraArroba: number;
  precoVendaArroba: number;
}

export type TipoVariante = "realista" | "otimista" | "pessimista";

export interface Outputs {
  // Compra
  precoCompraCab: number;
  precoCompraFinalArroba: number;
  precoCompraFinalKg: number;
  custoCompraAnimaisTotal: number;

  // Produção
  pesoSaidaKg: number;
  pesoSaidaArroba: number;
  lotacaoEntrada: number;
  lotacaoSaida: number;
  lotacaoMedia: number;

  // Suplementação
  consumoMedioCabDia: number;
  consumoMedioLoteDia: number;
  consumoTotalSuplementoKg: number;
  custoDiarioSuplementoCab: number;

  // Custos operacionais (detalhados)
  custoSalarios: number;
  custoSanidade: number;
  custoPastagem: number;
  custoOutros: number;
  custoSuplementoTotal: number;
  custosExtrasTotal: number;
  custosExtrasDetalhado: { nome: string; valor: number }[];
  custoTaxasVenda: number;
  custoOperacionalTotal: number;      // soma de tudo acima exceto taxas
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
