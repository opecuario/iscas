"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AvisoModoLocal from "@/components/AvisoModoLocal";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtPct } from "@/lib/format";
import {
  adminListSimulacoes,
  type SimulacaoComDono,
} from "@/lib/admin";

type Filtro = "todas" | "finalizadas" | "andamento";

export default function AdminSimulacoes() {
  const [sims, setSims] = useState<SimulacaoComDono[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    setSims(adminListSimulacoes());
  }, []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return sims
      .filter((s) => {
        if (filtro === "finalizadas") return s.etapaAtual === "finalizado";
        if (filtro === "andamento") return s.etapaAtual !== "finalizado";
        return true;
      })
      .filter((s) =>
        !q
          ? true
          : s.nome.toLowerCase().includes(q) ||
            s.donoNome.toLowerCase().includes(q) ||
            s.donoEmail.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [sims, filtro, busca]);

  return (
    <div>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Simulações</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {filtradas.length} de {sims.length} simulações.
          </p>
        </div>
        <input
          type="search"
          placeholder="Buscar por nome ou usuário…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 sm:w-80"
        />
      </header>

      <AvisoModoLocal />

      <div className="mt-4 flex gap-2">
        {(
          [
            { id: "todas" as const, label: "Todas" },
            { id: "finalizadas" as const, label: "Finalizadas" },
            { id: "andamento" as const, label: "Em andamento" },
          ]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filtro === f.id
                ? "bg-brand-800 text-white"
                : "bg-white text-brand-800 border border-neutral-200 hover:bg-brand-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-semibold">Simulação</th>
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Cab</th>
                <th className="px-4 py-3 text-right font-semibold">Lucro</th>
                <th className="px-4 py-3 text-right font-semibold">Rent. a.a.</th>
                <th className="px-4 py-3 font-semibold">Atualizada</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-neutral-500"
                  >
                    Nenhuma simulação encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((s) => {
                  const out = calcular(s.inputs);
                  const finalizada = s.etapaAtual === "finalizado";
                  const href = finalizada
                    ? `/simulacao/${s.id}`
                    : `/nova?id=${s.id}`;
                  return (
                    <tr key={s.id} className="transition hover:bg-brand-50/40">
                      <td className="px-4 py-3 font-medium text-brand-900">
                        {s.nome}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/usuarios/${encodeURIComponent(
                            s.donoEmail
                          )}`}
                          className="text-neutral-700 hover:text-brand-800 hover:underline"
                        >
                          <div>{s.donoNome}</div>
                          <div className="text-[11px] text-neutral-500">
                            {s.donoEmail}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            finalizada
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {finalizada ? "Finalizada" : "Em andamento"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {s.inputs.qtdCabecas || 0}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          out.lucro >= 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {fmtBRL(out.lucro)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-brand-900">
                        {fmtPct(out.rentabilidadeAno)}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {new Date(s.updatedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={href}
                          className="rounded-md border border-brand-800 bg-white px-3 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
