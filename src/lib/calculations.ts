import type { InputsBase, Outputs, VarianteOverride } from "./types";

/**
 * Porta fiel das fórmulas da planilha Excel original.
 * Cada linha calcula 1 célula — mantidas na mesma ordem do Excel
 * para facilitar conferência com a planilha fonte.
 */
export function calcular(base: InputsBase, override?: Partial<VarianteOverride>): Outputs {
  const precoCompraArroba = override?.precoCompraArroba ?? base.precoCompraArroba;
  const precoVendaArroba = override?.precoVendaArroba ?? base.precoVendaArroba;
  const gmd = override?.gmd ?? base.gmd;

  const {
    pesoCompraKg: pesoCompra,
    freteComissaoCab: frete,
    qtdCabecas: cab,
    areaHa: area,
    periodoDias: dias,
    mortalidadePct: mortalidade,
    rendimentoCarcacaPct: rendimento,
    consumoSuplementoPctPV: consumoPctPV,
    precoSuplementoKg: precoSup,
    salariosMensal: salarios,
    sanidadeCab: sanidade,
    pastagemCabMes: pastagem,
    outrosCustosCabMes: outros,
    taxasVendaCab: taxas,
    financiamentoAtivo,
    financiamentoTaxaAnualPct: taxaFin,
    financiamentoValorCaptado: valorFin,
  } = base;

  const arrobasCompra = pesoCompra / 30;
  const cabVivas = cab * (1 - mortalidade);
  const meses = dias / 30;

  // --- Compra
  const precoCompraCab = arrobasCompra * precoCompraArroba + frete;           // B5
  const precoCompraFinalArroba = precoCompraCab / arrobasCompra;              // B6
  const precoCompraFinalKg = precoCompraCab / pesoCompra;                     // B7
  const custoCompraAnimaisTotal = cab * precoCompraFinalKg * pesoCompra;      // B9

  // --- Produção
  const pesoSaidaKg = dias * gmd + pesoCompra;                                // B16
  const pesoSaidaArroba = (rendimento * pesoSaidaKg) / 15;                    // B19
  const lotacaoEntrada = (cab * pesoCompra) / 450 / area;                     // B20
  const lotacaoSaida = (cab * pesoSaidaKg) / 450 / area;                      // B21
  const lotacaoMedia = (lotacaoEntrada + lotacaoSaida) / 2;                   // B22

  // --- Suplementação
  const pesoMedio = (pesoCompra + pesoSaidaKg) / 2;
  const consumoMedioCabDia = consumoPctPV * pesoMedio;                        // B26
  const consumoMedioLoteDia = consumoMedioCabDia * cab;                       // B27
  const consumoTotalSuplementoKg = consumoMedioLoteDia * dias;                // B28
  const custoDiarioSuplementoCab = precoSup * consumoMedioCabDia;             // B30

  // --- Custos operacionais (destrinchados)
  const custoSalarios = meses * salarios;
  const custoSanidade = sanidade * cab;
  const custoPastagem = pastagem * meses * cab;
  const custoOutros = outros * meses * cab;
  const custoSuplementoTotal = custoDiarioSuplementoCab * dias * cab;
  const custoOperacionalTotal =
    custoSalarios + custoSanidade + custoPastagem + custoOutros + custoSuplementoTotal; // B37
  const custoOperacionalCab = custoOperacionalTotal / cab;                    // B38
  const diariaOperacao = custoOperacionalTotal / cab / dias;                  // B39
  const desembolsoCabMes = diariaOperacao * 30;                               // B40

  // --- Venda
  const precoVendaCab = precoVendaArroba * pesoSaidaArroba;                   // B46
  const faturamentoTotal = precoVendaCab * cabVivas;                          // B47
  const custoTaxasVenda = taxas * cabVivas;

  // --- Fechamento
  const totalCompra = custoCompraAnimaisTotal;                                // B51
  const totalOperacaoComTaxas = custoOperacionalTotal + custoTaxasVenda;      // B52
  const totalDesembolsado = totalOperacaoComTaxas + totalCompra;              // B53
  const lucro = faturamentoTotal - totalDesembolsado;                         // B55
  const lucroCab = lucro / cab;                                               // C55
  const lucroHa = lucro / area;                                               // B56

  // --- Financiamento
  let financiamentoPagoFinal: number | null = null;
  let lucroLiquidoFinanciado: number | null = null;
  if (financiamentoAtivo && valorFin > 0) {
    financiamentoPagoFinal = valorFin * (1 + taxaFin);                        // B60
    lucroLiquidoFinanciado = lucro - (financiamentoPagoFinal - valorFin);     // B61
  }

  // --- Indicadores
  const arrobasProduzidasCab = pesoSaidaArroba - arrobasCompra;               // B66
  const arrobasGanhasPesoVivo = (pesoSaidaKg - pesoCompra) / 30;              // usado só em B65
  const custoArrobaProduzida = custoOperacionalCab / arrobasGanhasPesoVivo;   // B65
  const arrobasProduzidasTotal = arrobasProduzidasCab * cabVivas;             // B67
  const arrobasProduzidasHa = arrobasProduzidasTotal / area;                  // B68
  const lotacaoMediaCabHa = cab / area;                                       // B70
  const rentabilidadeOperacao = lucro / totalDesembolsado;                    // B71
  const rentabilidadeMes = rentabilidadeOperacao / (dias / 30.4);             // B72
  const rentabilidadeAno = rentabilidadeMes * 12;                             // B73

  return {
    precoCompraCab,
    precoCompraFinalArroba,
    precoCompraFinalKg,
    custoCompraAnimaisTotal,
    pesoSaidaKg,
    pesoSaidaArroba,
    lotacaoEntrada,
    lotacaoSaida,
    lotacaoMedia,
    consumoMedioCabDia,
    consumoMedioLoteDia,
    consumoTotalSuplementoKg,
    custoDiarioSuplementoCab,
    custoSalarios,
    custoSanidade,
    custoPastagem,
    custoOutros,
    custoSuplementoTotal,
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

/** Valores iniciais — tudo zerado. O usuário preenche cada campo. */
export const INPUTS_PADRAO: InputsBase = {
  precoCompraArroba: 0,
  pesoCompraKg: 0,
  freteComissaoCab: 0,
  qtdCabecas: 0,
  areaHa: 0,
  gmd: 0,
  periodoDias: 0,
  mortalidadePct: 0,
  rendimentoCarcacaPct: 0,
  consumoSuplementoPctPV: 0,
  precoSuplementoKg: 0,
  salariosMensal: 0,
  sanidadeCab: 0,
  pastagemCabMes: 0,
  outrosCustosCabMes: 0,
  taxasVendaCab: 0,
  precoVendaArroba: 0,
  financiamentoAtivo: false,
  financiamentoTaxaAnualPct: 0,
  financiamentoValorCaptado: 0,
};
