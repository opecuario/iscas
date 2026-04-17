"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LIMITE_SIMULACOES,
  deleteSimulacao,
  listSimulacoesDoUsuarioLogado,
  type SimulacaoSalva,
} from "@/lib/storage";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtPct } from "@/lib/format";
import { useUsuario } from "@/components/UsuarioProvider";

const ETAPA_LABEL: Record<SimulacaoSalva["etapaAtual"], string> = {
  realista: "Em andamento — Realista",
  otimista: "Em andamento — Otimista",
  pessimista: "Em andamento — Pessimista",
  finalizado: "Finalizada",
};

export default function Dashboard() {
  const usuario = useUsuario();
  const [simulacoes, setSimulacoes] = useState<SimulacaoSalva[]>([]);

  useEffect(() => {
    let ativo = true;
    listSimulacoesDoUsuarioLogado().then((sims) => {
      if (ativo) setSimulacoes(sims);
    });
    return () => {
      ativo = false;
    };
  }, []);

  async function excluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta simulação?")) return;
    await deleteSimulacao(id);
    const sims = await listSimulacoesDoUsuarioLogado();
    setSimulacoes(sims);
  }

  const cheio = simulacoes.length >= LIMITE_SIMULACOES;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-brand-900">
          Olá{usuario ? `, ${usuario.nome.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Gerencie suas simulações de recria e engorda. Você pode manter até{" "}
          {LIMITE_SIMULACOES} simulações salvas.
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Minhas simulações ({simulacoes.length}/{LIMITE_SIMULACOES})
        </h2>
        {!cheio && (
          <Link
            href="/nova"
            className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + Nova simulação
          </Link>
        )}
      </div>

      {simulacoes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {simulacoes.map((s) => (
            <CardSimulacao key={s.id} s={s} onDelete={() => excluir(s.id)} />
          ))}
          {cheio && <PaywallCard />}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
      <h3 className="text-lg font-semibold text-brand-900">
        Nenhuma simulação ainda
      </h3>
      <p className="mt-2 text-sm text-neutral-600">
        Crie sua primeira simulação para comparar os cenários realista, otimista
        e pessimista da sua operação.
      </p>
      <Link
        href="/nova"
        className="mt-6 inline-block rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Criar primeira simulação
      </Link>
    </div>
  );
}

function CardSimulacao({
  s,
  onDelete,
}: {
  s: SimulacaoSalva;
  onDelete: () => void;
}) {
  const snap = {
    gmd: s.inputs.gmd,
    precoCompraArroba: s.inputs.precoCompraArroba,
    precoVendaArroba: s.inputs.precoVendaArroba,
  };
  const resultados = [
    { label: "Realista", out: calcular(s.inputs), preenchido: true },
    {
      label: "Otimista",
      out: calcular(s.inputs, s.otimista ?? snap),
      preenchido: s.otimista !== null,
    },
    {
      label: "Pessimista",
      out: calcular(s.inputs, s.pessimista ?? snap),
      preenchido: s.pessimista !== null,
    },
  ];
  const finalizada = s.etapaAtual === "finalizado";
  const href = finalizada ? `/simulacao/${s.id}` : `/nova?id=${s.id}`;
  const dataFmt = new Date(s.updatedAt).toLocaleDateString("pt-BR");

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-brand-900">
            {s.nome}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded px-1.5 py-0.5 font-medium ${
                finalizada
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {ETAPA_LABEL[s.etapaAtual]}
            </span>
            <span className="text-neutral-500">
              {s.inputs.qtdCabecas || 0} cab · {s.inputs.areaHa || 0} ha ·
              atualizada em {dataFmt}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="shrink-0 text-xs text-neutral-500 hover:text-red-600"
          title="Excluir simulação"
        >
          Excluir
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {resultados.map((r) => (
          <div
            key={r.label}
            className={`rounded-md border p-2.5 text-xs ${
              r.preenchido
                ? "border-neutral-200 bg-neutral-50"
                : "border-dashed border-neutral-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-900">{r.label}</span>
              {!r.preenchido && (
                <span className="text-[10px] text-neutral-400">= realista</span>
              )}
            </div>
            <div className="mt-1.5">
              <div className="text-[10px] text-neutral-500">Lucro</div>
              <div
                className={`font-semibold ${
                  r.out.lucro >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {fmtBRL(r.out.lucro)}
              </div>
            </div>
            <div className="mt-1.5">
              <div className="text-[10px] text-neutral-500">Rent. a.a.</div>
              <div
                className={`font-semibold ${
                  r.out.rentabilidadeAno >= 0
                    ? "text-brand-900"
                    : "text-red-700"
                }`}
              >
                {fmtPct(r.out.rentabilidadeAno)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href={href}
        className="mt-4 block rounded-md border border-brand-800 bg-white px-4 py-2 text-center text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
      >
        {finalizada ? "Ver resumo" : "Continuar simulação"}
      </Link>
    </div>
  );
}

function PaywallCard() {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
          Precisa de mais cenários?
        </div>
        <h3 className="mt-1 text-base font-semibold text-brand-900">
          Fale com nossa consultoria
        </h3>
        <p className="mt-2 text-xs text-neutral-600">
          Para quem toma decisões estratégicas em várias fazendas ao mesmo tempo.
          Destravamos simulações ilimitadas e análises personalizadas.
        </p>
      </div>
      <a
        href="https://wa.me/5511999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block rounded-md bg-brand-800 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Quero falar com um especialista
      </a>
    </div>
  );
}
