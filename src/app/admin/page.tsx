"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminListSimulacoes,
  adminListUsuarios,
  type SimulacaoComDono,
} from "@/lib/admin";
import { calcular } from "@/lib/calculations";
import { fmtBRL } from "@/lib/format";
import type { Usuario } from "@/lib/storage";

export default function AdminOverview() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [simulacoes, setSimulacoes] = useState<SimulacaoComDono[]>([]);

  useEffect(() => {
    let ativo = true;
    Promise.all([adminListUsuarios(), adminListSimulacoes()]).then(
      ([us, sims]) => {
        if (!ativo) return;
        setUsuarios(us);
        setSimulacoes(sims);
      }
    );
    return () => {
      ativo = false;
    };
  }, []);

  const finalizadas = simulacoes.filter((s) => s.etapaAtual === "finalizado");
  const emAndamento = simulacoes.length - finalizadas.length;
  const recentes = [...simulacoes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-900">Visão geral</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Resumo dos usuários e simulações na plataforma.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Usuários cadastrados" valor={String(usuarios.length)} />
        <Kpi titulo="Simulações totais" valor={String(simulacoes.length)} />
        <Kpi titulo="Finalizadas" valor={String(finalizadas.length)} />
        <Kpi titulo="Em andamento" valor={String(emAndamento)} />
      </div>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-brand-900">
            Simulações recentes
          </h2>
          <Link
            href="/admin/simulacoes"
            className="text-xs font-medium text-brand-800 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">
            Nenhuma simulação ainda.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {recentes.map((s) => {
              const out = calcular(s.inputs);
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-brand-900">
                      {s.nome}
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                      {s.donoNome} · {s.donoEmail}
                    </div>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      s.etapaAtual === "finalizado"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {s.etapaAtual === "finalizado" ? "Finalizada" : "Em andamento"}
                  </span>
                  <span
                    className={`w-28 text-right font-semibold ${
                      out.lucro >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {fmtBRL(out.lucro)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {titulo}
      </div>
      <div className="mt-1 text-2xl font-bold text-brand-900">{valor}</div>
    </div>
  );
}

