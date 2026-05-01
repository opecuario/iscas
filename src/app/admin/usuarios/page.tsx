"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  adminListSimulacoes,
  adminListUsuarios,
  type SimulacaoComDono,
} from "@/lib/admin";
import type { TipoUsuario, Usuario } from "@/lib/storage";

type FiltroTipo = "todos" | TipoUsuario | "sem_tipo";

const TIPO_BADGE: Record<TipoUsuario, { label: string; cls: string }> = {
  pecuarista: {
    label: "Pecuarista",
    cls: "bg-emerald-100 text-emerald-800",
  },
  profissional: {
    label: "Profissional",
    cls: "bg-blue-100 text-blue-800",
  },
  outro: {
    label: "Outro",
    cls: "bg-neutral-200 text-neutral-700",
  },
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sims, setSims] = useState<SimulacaoComDono[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");

  useEffect(() => {
    let ativo = true;
    Promise.all([adminListUsuarios(), adminListSimulacoes()]).then(
      ([us, s]) => {
        if (!ativo) return;
        setUsuarios(us);
        setSims(s);
      }
    );
    return () => {
      ativo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return usuarios
      .filter((u) => {
        if (filtroTipo === "todos") return true;
        if (filtroTipo === "sem_tipo") return u.tipoUsuario == null;
        return u.tipoUsuario === filtroTipo;
      })
      .filter(
        (u) =>
          !q ||
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.telefone.includes(q)
      );
  }, [usuarios, busca, filtroTipo]);

  const simsPorEmail = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usuarios) {
      const norm = u.email.toLowerCase();
      const count = sims.filter(
        (s) => s.donoEmail.toLowerCase() === norm
      ).length;
      m.set(u.email, count);
    }
    return m;
  }, [usuarios, sims]);

  return (
    <div>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Usuários</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {filtrados.length} de {usuarios.length} usuários cadastrados.
          </p>
        </div>
        <input
          type="search"
          placeholder="Buscar por nome, e-mail ou telefone…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 sm:w-80"
        />
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            { id: "todos" as const, label: "Todos" },
            { id: "pecuarista" as const, label: "Pecuaristas" },
            { id: "profissional" as const, label: "Profissionais" },
            { id: "outro" as const, label: "Outro" },
            { id: "sem_tipo" as const, label: "Sem tipo" },
          ]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltroTipo(f.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filtroTipo === f.id
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
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold">Hectares</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Telefone</th>
                <th className="px-4 py-3 font-semibold">UF</th>
                <th className="px-4 py-3 font-semibold">Cadastro</th>
                <th className="px-4 py-3 text-right font-semibold">Simulações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-neutral-500"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => {
                  const badge = u.tipoUsuario
                    ? TIPO_BADGE[u.tipoUsuario]
                    : null;
                  return (
                    <tr
                      key={u.email}
                      className="transition hover:bg-brand-50/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/usuarios/${encodeURIComponent(u.email)}`}
                          className="font-medium text-brand-900 hover:underline"
                        >
                          {u.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {badge ? (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">
                        {u.tipoUsuario === "pecuarista" &&
                        u.hectaresPasto != null
                          ? `${u.hectaresPasto} ha`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {u.telefone}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.estado}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-900">
                        {simsPorEmail.get(u.email) ?? 0}
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
