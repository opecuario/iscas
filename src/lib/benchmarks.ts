/**
 * Benchmarks de mercado — referências médias usadas para contextualizar os
 * indicadores. São aproximações para dar ao usuário um senso do que é bom,
 * comum ou ruim. Não são tabelas oficiais.
 */

export interface Benchmark {
  chave: string;
  rotulo: string;
  /** Faixa considerada boa (verde). */
  bom: [number, number];
  /** Faixa considerada dentro da média (azul/neutra). Tudo fora disso é ruim. */
  medio: [number, number];
  unidade?: string;
  /** Formatação amigável para exibir a faixa. */
  descricao: string;
}

export const BENCHMARKS: Record<string, Benchmark> = {
  arrobasPorHa: {
    chave: "arrobasPorHa",
    rotulo: "@ produzidas por hectare",
    bom: [10, Infinity],
    medio: [5.5, 10],
    unidade: "@/ha",
    descricao: "",
  },
  gmd: {
    chave: "gmd",
    rotulo: "GMD médio",
    bom: [0.7, Infinity],
    medio: [0.4, 0.7],
    unidade: "kg/dia",
    descricao: "",
  },
  mortalidade: {
    chave: "mortalidade",
    rotulo: "Mortalidade total",
    // Inverso: valores menores são melhores
    bom: [0, 0.015],
    medio: [0.015, 0.03],
    unidade: "%",
    descricao: "",
  },
  rentabilidadeAno: {
    chave: "rentabilidadeAno",
    rotulo: "Rentabilidade anual",
    bom: [0.15, Infinity],
    medio: [0.05, 0.15],
    unidade: "%",
    descricao: "",
  },
  lotacaoMedia: {
    chave: "lotacaoMedia",
    rotulo: "Lotação média",
    bom: [2, Infinity],
    medio: [1, 2],
    unidade: "U.A./ha",
    descricao: "",
  },
};

export type NivelBenchmark = "bom" | "medio" | "ruim";

export function avaliar(
  b: Benchmark,
  valor: number,
  inverso = false
): NivelBenchmark {
  if (!Number.isFinite(valor)) return "medio";
  const dentro = (v: number, faixa: [number, number]) => v >= faixa[0] && v <= faixa[1];
  if (inverso) {
    if (dentro(valor, b.bom)) return "bom";
    if (dentro(valor, b.medio)) return "medio";
    return "ruim";
  }
  if (dentro(valor, b.bom)) return "bom";
  if (dentro(valor, b.medio)) return "medio";
  return "ruim";
}

export function corBenchmark(n: NivelBenchmark): string {
  if (n === "bom") return "text-emerald-700";
  if (n === "ruim") return "text-red-700";
  return "text-brand-900";
}

export function rotuloBenchmark(n: NivelBenchmark): string {
  if (n === "bom") return "Bom";
  if (n === "ruim") return "Abaixo da média";
  return "Na média";
}
