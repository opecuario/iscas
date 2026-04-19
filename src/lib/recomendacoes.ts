import { calcular } from "./calculations";
import { snapshotBase } from "./variantes";
import type { InputsBase } from "./types";

export interface Recomendacao {
  titulo: string;
  descricao: string;
  ganhoEstimado: number; // em R$
  faseId?: string;
}

/**
 * Gera recomendações acionáveis comparando o cenário atual com pequenas
 * melhorias realistas. Usa um delta pequeno (para parecer atingível) e
 * mostra o impacto em R$ no lucro total.
 */
export function recomendacoes(base: InputsBase): Recomendacao[] {
  const outAtual = calcular(base);
  const lucroAtual = outAtual.lucro;
  const snap = snapshotBase(base);
  const recs: Recomendacao[] = [];

  // 1. Subir GMD +0.1 kg/d em cada fase
  for (const fase of base.fases) {
    const gmdAtual = fase.gmd;
    if (gmdAtual <= 0) continue;
    const gmdPorFase = { ...snap.gmdPorFase, [fase.id]: gmdAtual + 0.1 };
    const outSim = calcular(base, { ...snap, gmdPorFase });
    const ganho = outSim.lucro - lucroAtual;
    if (ganho > 0) {
      recs.push({
        titulo: `Subir GMD em +0,1 kg/dia na fase "${fase.nome}"`,
        descricao:
          "Melhor manejo nutricional, pasto ou suplementação pode acelerar o ganho diário dos animais nessa fase.",
        ganhoEstimado: ganho,
        faseId: fase.id,
      });
    }
  }

  // 2. Reduzir 5% no preço de compra
  if (base.precoCompraArroba > 0) {
    const outSim = calcular(base, {
      ...snap,
      precoCompraArroba: base.precoCompraArroba * 0.95,
    });
    const ganho = outSim.lucro - lucroAtual;
    if (ganho > 0) {
      recs.push({
        titulo: "Negociar −5% no preço de compra",
        descricao:
          "Comprar 5% mais barato que o valor atual (via timing, negociação em lote ou parceria).",
        ganhoEstimado: ganho,
      });
    }
  }

  // 3. Subir 5% no preço de venda
  if (base.precoVendaArroba > 0) {
    const outSim = calcular(base, {
      ...snap,
      precoVendaArroba: base.precoVendaArroba * 1.05,
    });
    const ganho = outSim.lucro - lucroAtual;
    if (ganho > 0) {
      recs.push({
        titulo: "Conseguir +5% no preço de venda",
        descricao:
          "Venda direta, escala, bonificações por rastreabilidade ou timing melhor no fechamento.",
        ganhoEstimado: ganho,
      });
    }
  }

  // 4. Reduzir mortalidade (fases com mortalidade > 1%)
  for (const fase of base.fases) {
    if (fase.mortalidadePct > 0.01) {
      const fases = base.fases.map((f) =>
        f.id === fase.id ? { ...f, mortalidadePct: Math.max(0, f.mortalidadePct - 0.01) } : f
      );
      const outSim = calcular({ ...base, fases });
      const ganho = outSim.lucro - lucroAtual;
      if (ganho > 0) {
        recs.push({
          titulo: `Reduzir mortalidade em 1pp na fase "${fase.nome}"`,
          descricao:
            "Protocolo sanitário, adaptação e manejo de recepção costumam ser as alavancas mais rápidas.",
          ganhoEstimado: ganho,
          faseId: fase.id,
        });
      }
    }
  }

  // Ordena pelo maior ganho
  recs.sort((a, b) => b.ganhoEstimado - a.ganhoEstimado);
  return recs.slice(0, 5);
}
