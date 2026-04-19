"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Alerta } from "@/lib/validacoes";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unidade?: string;
  dica?: string;
  bloqueado?: boolean;
  destacado?: boolean;

  /** Mostra "R$" como prefixo dentro do input */
  moeda?: boolean;
  /** Valor armazenado 0..1, exibido multiplicado por 100 com "%" */
  percentual?: boolean;
  /** Força valor inteiro (0 casas decimais) */
  inteiro?: boolean;
  /** Casas decimais na exibição (default 2; ignorado se inteiro=true) */
  decimais?: number;
  /** Valor mínimo permitido (default 0) */
  min?: number;
  /** Alerta suave (amarelo) ou forte (vermelho) abaixo do campo — não bloqueia. */
  alerta?: Alerta | null;
}

function nf(decimais: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

function casasPadrao(opts: Pick<Props, "decimais" | "inteiro">) {
  if (opts.inteiro) return 0;
  return opts.decimais ?? 2;
}

/** Formato "bonito" quando o campo não está em foco. */
function formatarExibicao(v: number, p: Props): string {
  if (!Number.isFinite(v)) return "";
  const casas = casasPadrao(p);
  let n = v;
  let prefixo = "";
  let sufixo = "";
  if (p.percentual) {
    n = v * 100;
    sufixo = " %";
  }
  if (p.moeda) prefixo = "R$ ";
  return prefixo + nf(casas).format(n) + sufixo;
}

/** Texto editável quando está em foco — BR (vírgula), sem prefixo. */
function formatarEdicao(v: number, p: Props): string {
  if (!Number.isFinite(v) || v === 0) return "";
  let n = p.percentual ? v * 100 : v;
  const casas = casasPadrao(p);
  // Mostra exatamente o valor, com até `casas` casas mas sem zeros à direita desnecessários
  const fixed = n.toFixed(casas);
  // Remove zeros à direita se tiver decimal
  const limpo = fixed.includes(".")
    ? fixed.replace(/\.?0+$/, "") || "0"
    : fixed;
  return limpo.replace(".", ",");
}

/** Limpa texto enquanto o usuário digita — mantém só dígitos + 1 vírgula. */
function sanitizar(raw: string): string {
  let s = raw.replace(/[^\d,]/g, "");
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, "");
  }
  // remove zeros à esquerda (mas mantém "0," e "0")
  if (/^0\d/.test(s)) s = s.replace(/^0+/, "");
  return s;
}

/** Converte texto BR → número. Retorna NaN se vazio/invalido. */
function parseBR(s: string): number {
  if (!s || s === ",") return NaN;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function CampoNumero(props: Props) {
  const { label, value, onChange, unidade, dica, bloqueado, destacado, moeda, percentual, inteiro, min = 0, alerta } = props;
  const [focused, setFocused] = useState(false);
  const [texto, setTexto] = useState<string>(() => formatarExibicao(value, props));
  const inputRef = useRef<HTMLInputElement>(null);
  const descId = useId();

  // Reage a mudanças externas no value (ex.: mudança de variante) enquanto não está em foco.
  useEffect(() => {
    if (!focused) setTexto(formatarExibicao(value, props));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, moeda, percentual, inteiro, props.decimais]);

  function handleFocus() {
    setFocused(true);
    setTexto(formatarEdicao(value, props));
    // Seleciona tudo para facilitar sobrescrever
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function handleBlur() {
    setFocused(false);
    setTexto(formatarExibicao(value, props));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const limpo = sanitizar(e.target.value);
    setTexto(limpo);
    const n = parseBR(limpo);
    if (Number.isNaN(n)) {
      onChange(0);
      return;
    }
    // inteiro: descarta fração
    const arredondado = inteiro ? Math.trunc(n) : n;
    const comPercentual = percentual ? arredondado / 100 : arredondado;
    const respeitandoMin = Math.max(min, comPercentual);
    onChange(respeitandoMin);
  }

  return (
    <label className={`block ${bloqueado ? "opacity-60" : ""}`}>
      <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-brand-900/80">
        <span className="flex items-center gap-1">
          {label}
          {unidade && <span className="font-normal text-neutral-500">({unidade})</span>}
          {destacado && (
            <span className="ml-1 rounded-sm bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
              editável em variantes
            </span>
          )}
        </span>
      </span>

      <div className="relative">
        {moeda && focused && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
            R$
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={texto}
          disabled={bloqueado}
          aria-invalid={alerta?.nivel === "vermelho"}
          aria-describedby={alerta || dica ? descId : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 text-sm tabular-nums outline-none transition
            ${moeda && focused ? "pl-10" : ""}
            ${
              bloqueado
                ? "cursor-not-allowed bg-neutral-100 border-neutral-200"
                : alerta?.nivel === "vermelho"
                ? "bg-white border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                : alerta?.nivel === "amarelo"
                ? "bg-white border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400"
                : "bg-white border-neutral-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            }`}
        />
      </div>

      {alerta && (
        <span
          id={descId}
          role={alerta.nivel === "vermelho" ? "alert" : undefined}
          className={`mt-1 flex items-start gap-1 text-[11px] font-medium leading-snug ${
            alerta.nivel === "vermelho" ? "text-red-700" : "text-amber-800"
          }`}
        >
          <span aria-hidden>⚠</span>
          <span>{alerta.mensagem}</span>
        </span>
      )}
      {dica && !alerta && (
        <span id={descId} className="mt-1 block text-[11px] leading-snug text-neutral-500">
          {dica}
        </span>
      )}
    </label>
  );
}
