import type { InputsBase, VarianteOverride } from "./types";

/** Gera um override "neutro" a partir da base — mesmos preços e GMDs. */
export function snapshotBase(base: InputsBase): VarianteOverride {
  const gmdPorFase: Record<string, number> = {};
  for (const f of base.fases) gmdPorFase[f.id] = f.gmd;
  return {
    precoCompraArroba: base.precoCompraArroba,
    precoVendaArroba: base.precoVendaArroba,
    gmdPorFase,
  };
}

/**
 * Retorna o override só se ele difere da base em ao menos um campo.
 * Caso contrário, retorna null (cenário não tem conteúdo novo).
 */
export function varianteEfetiva(
  base: InputsBase,
  override: VarianteOverride | null
): VarianteOverride | null {
  if (!override) return null;
  if (
    override.precoCompraArroba !== base.precoCompraArroba ||
    override.precoVendaArroba !== base.precoVendaArroba
  ) {
    return override;
  }
  for (const f of base.fases) {
    const gmdOv = override.gmdPorFase?.[f.id];
    if (gmdOv !== undefined && gmdOv !== f.gmd) return override;
  }
  return null;
}
