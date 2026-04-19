"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/format";
import { snapshotBase, varianteEfetiva } from "@/lib/variantes";
import type {
  InputsBase,
  Outputs,
  TipoVariante,
  VarianteOverride,
} from "@/lib/types";

type Payload = {
  v: 1;
  n: string;
  i: InputsBase;
  o: VarianteOverride | null;
  p: VarianteOverride | null;
};

function decodeHash(hash: string): Payload | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const b64 = clean.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((clean.length + 3) % 4);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Payload;
    if (parsed.v !== 1 || !parsed.i) return null;
    return parsed;
  } catch {
    return null;
  }
}

type Cenario = {
  id: TipoVariante;
  label: string;
  cor: string;
  out: Outputs;
};

export default function PublicaPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    setPayload(decodeHash(window.location.hash));
    setCarregado(true);
  }, []);

  const cenarios = useMemo<Cenario[]>(() => {
    if (!payload) return [];
    const arr: Cenario[] = [
      {
        id: "realista",
        label: "Realista",
        cor: "bg-brand-800",
        out: calcular(payload.i),
      },
    ];
    const o = varianteEfetiva(payload.i, payload.o);
    if (o) arr.push({ id: "otimista", label: "Otimista", cor: "bg-emerald-700", out: calcular(payload.i, o) });
    const p = varianteEfetiva(payload.i, payload.p);
    if (p) arr.push({ id: "pessimista", label: "Pessimista", cor: "bg-amber-700", out: calcular(payload.i, p) });
    return arr;
  }, [payload]);

  if (!carregado) {
    return <div className="p-10 text-sm text-neutral-500">Carregando…</div>;
  }

  if (!payload) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-brand-900">Link inválido</h1>
        <p className="mt-2 text-sm text-neutral-600">
          O link compartilhado está incompleto ou corrompido. Peça outro ao
          remetente.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Conhecer o simulador
        </Link>
      </div>
    );
  }

  const snap = snapshotBase(payload.i);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
          Simulação compartilhada
        </div>
        <h1 className="mt-1 text-2xl font-bold text-brand-900">{payload.n}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {fmtInt(payload.i.qtdCabecas)} cabeças ·{" "}
          {fmtInt(cenarios[0]?.out.areaMaxima ?? 0)} ha ·{" "}
          {fmtInt(cenarios[0]?.out.diasTotal ?? 0)} dias
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
          Resumo executivo
        </h2>
        <div
          className={`grid grid-cols-1 gap-4 ${
            cenarios.length === 2
              ? "md:grid-cols-2"
              : cenarios.length >= 3
              ? "md:grid-cols-3"
              : ""
          }`}
        >
          {cenarios.map((c) => {
            const lucroPos = c.out.lucro >= 0;
            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md"
              >
                <div className={`${c.cor} px-5 py-3 text-center`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Cenário {c.label}
                  </h3>
                </div>
                <div className="p-5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Lucro total
                  </div>
                  <div
                    className={`mt-1 text-3xl font-bold tabular-nums ${
                      lucroPos ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {fmtBRL(c.out.lucro)}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Rentab. ao ano
                      </div>
                      <div
                        className={`mt-1 text-lg font-bold tabular-nums ${
                          c.out.rentabilidadeAno >= 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {fmtPct(c.out.rentabilidadeAno)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Lucro/cab
                      </div>
                      <div
                        className={`mt-1 text-lg font-bold tabular-nums ${
                          c.out.lucroCab >= 0 ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {fmtBRL(c.out.lucroCab)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-brand-200 bg-brand-50 p-5 text-center">
        <h3 className="text-base font-semibold text-brand-900">
          Quer rodar suas próprias simulações?
        </h3>
        <p className="mt-1 text-sm text-brand-900/80">
          O simulador é gratuito — crie sua conta e compare cenários realista,
          otimista e pessimista em minutos.
        </p>
        <Link
          href="/cadastro"
          className="mt-4 inline-block rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Criar conta grátis
        </Link>
      </section>

      <p className="mt-6 text-center text-[10px] text-neutral-400">
        Os valores acima são calculados localmente a partir do link
        compartilhado. Não representam dados armazenados no servidor. Snapshot
        de {new Date().toLocaleDateString("pt-BR")} — preço base:{" "}
        {fmtBRL(snap.precoCompraArroba)}/@ compra ·{" "}
        {fmtBRL(snap.precoVendaArroba)}/@ venda.
      </p>
    </div>
  );
}
