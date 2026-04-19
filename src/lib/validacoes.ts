import type { InputsBase, Outputs } from "./types";

export type NivelAlerta = "amarelo" | "vermelho";

export interface Alerta {
  nivel: NivelAlerta;
  mensagem: string;
}

const FAIXA_PRECO_ARROBA: [number, number] = [200, 900];
const GMD_MAX_RAZOAVEL = 2; // kg/dia
const MORTALIDADE_COMUM = 0.02;
const MORTALIDADE_RISCO = 0.05;

export function alertaPrecoArroba(v: number, contexto: "compra" | "venda"): Alerta | null {
  if (!v || v <= 0) return null;
  const [min, max] = FAIXA_PRECO_ARROBA;
  if (v < min || v > max) {
    return {
      nivel: "amarelo",
      mensagem: `Valor incomum para ${contexto}. Confere se está certo?`,
    };
  }
  return null;
}

export function alertaGmd(v: number): Alerta | null {
  if (v === undefined || v === null) return null;
  if (v < 0) {
    return { nivel: "vermelho", mensagem: "GMD negativo — o animal perderia peso nesta fase." };
  }
  if (v > GMD_MAX_RAZOAVEL) {
    return {
      nivel: "amarelo",
      mensagem: "GMD muito alto. Confere a unidade?",
    };
  }
  return null;
}

export function alertaMortalidade(decimal: number): Alerta | null {
  if (!decimal || decimal <= 0) return null;
  if (decimal > MORTALIDADE_RISCO) {
    return {
      nivel: "vermelho",
      mensagem: "Mortalidade muito alta — risco elevado. Confere se está certo?",
    };
  }
  if (decimal > MORTALIDADE_COMUM) {
    return {
      nivel: "amarelo",
      mensagem: "Mortalidade acima do comum. Confere?",
    };
  }
  return null;
}

export function alertaVendaMenorQueCompra(compra: number, venda: number): Alerta | null {
  if (compra > 0 && venda > 0 && venda < compra * 0.7) {
    return {
      nivel: "amarelo",
      mensagem: "Preço de venda bem abaixo do de compra. Confere?",
    };
  }
  return null;
}

export interface AlertaResultado {
  nivel: NivelAlerta;
  titulo: string;
  mensagem: string;
}

/** Alertas sobre o resultado final (rentabilidade absurda, lucro ilógico, etc.). */
export function alertasResultado(out: Outputs, inputs: InputsBase): AlertaResultado[] {
  const alertas: AlertaResultado[] = [];
  const ra = out.rentabilidadeAno;
  if (Number.isFinite(ra)) {
    if (ra > 0.8) {
      alertas.push({
        nivel: "vermelho",
        titulo: "Rentabilidade anual muito alta",
        mensagem: "Retorno incomum para pecuária. Reveja os valores — normalmente algum preço está em unidade errada ou custo esquecido.",
      });
    } else if (ra < -0.5) {
      alertas.push({
        nivel: "vermelho",
        titulo: "Prejuízo muito alto",
        mensagem: "Resultado indica prejuízo severo. Reveja custos e preços — pode haver algum valor em ordem de grandeza errada.",
      });
    }
  }
  if (out.lucroCab && inputs.qtdCabecas > 0 && Math.abs(out.lucroCab) > 1500) {
    alertas.push({
      nivel: "amarelo",
      titulo: "Lucro por cabeça incomum",
      mensagem: "Lucro por cabeça fora do padrão de mercado. Confere preços e custos.",
    });
  }
  return alertas;
}
