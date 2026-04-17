const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const NUM0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 2,
});

export const fmtBRL = (v: number) => (isFinite(v) ? BRL.format(v) : "—");
export const fmtNum = (v: number) => (isFinite(v) ? NUM.format(v) : "—");
export const fmtInt = (v: number) => (isFinite(v) ? NUM0.format(v) : "—");
export const fmtPct = (v: number) => (isFinite(v) ? PCT.format(v) : "—");
