"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { calcular } from "@/lib/calculations";
import { fmtBRL, fmtPct } from "@/lib/format";
import {
  adminGetUsuario,
  adminListSimulacoesPorUsuario,
  adminSetSimulacoesIlimitadas,
} from "@/lib/admin";
import type { SimulacaoSalva, Usuario } from "@/lib/storage";

export default function AdminUsuarioDetalhe() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent(params.email);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sims, setSims] = useState<SimulacaoSalva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoLimite, setSalvandoLimite] = useState(false);

  async function alternarIlimitadas() {
    if (!usuario) return;
    const novoValor = !usuario.simulacoesIlimitadas;
    setSalvandoLimite(true);
    const res = await adminSetSimulacoesIlimitadas(usuario.id, novoValor);
    setSalvandoLimite(false);
    if (!res.ok) {
      alert(`Erro ao atualizar: ${res.erro}`);
      return;
    }
    setUsuario({ ...usuario, simulacoesIlimitadas: novoValor });
  }

  useEffect(() => {
    let ativo = true;
    Promise.all([
      adminGetUsuario(email),
      adminListSimulacoesPorUsuario(email),
    ]).then(([u, s]) => {
      if (!ativo) return;
      setUsuario(u);
      setSims(s);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [email]);

  if (carregando) {
    return <p className="text-sm text-neutral-500">Carregando…</p>;
  }

  if (!usuario) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center">
        <h1 className="text-lg font-semibold text-brand-900">
          Usuário não encontrado
        </h1>
        <Link
          href="/admin/usuarios"
          className="mt-4 inline-block text-sm font-medium text-brand-800 hover:underline"
        >
          ← Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/usuarios"
        className="text-xs text-neutral-500 hover:text-brand-800"
      >
        ← Voltar para a lista de usuários
      </Link>
      <h1 className="mt-1 text-2xl font-bold text-brand-900">{usuario.nome}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Cadastrado em{" "}
        {new Date(usuario.createdAt).toLocaleDateString("pt-BR")}
      </p>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <CampoInfo titulo="E-mail" valor={usuario.email} />
        <CampoInfo titulo="Telefone" valor={usuario.telefone} />
        <CampoInfo titulo="Estado" valor={usuario.estado} />
      </section>

      <section className="mt-4 flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
            Limite de simulações
          </div>
          <p className="mt-1 text-sm text-brand-900">
            {usuario.simulacoesIlimitadas
              ? "Liberado — usuário pode criar simulações ilimitadas."
              : "Padrão — sujeito ao limite gratuito."}
          </p>
        </div>
        <button
          type="button"
          onClick={alternarIlimitadas}
          disabled={salvandoLimite}
          className={`rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${
            usuario.simulacoesIlimitadas
              ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
              : "bg-brand-800 text-white hover:bg-brand-700"
          }`}
        >
          {salvandoLimite
            ? "Salvando…"
            : usuario.simulacoesIlimitadas
            ? "Voltar ao limite padrão"
            : "Liberar simulações ilimitadas"}
        </button>
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-brand-900">
            Simulações ({sims.length})
          </h2>
        </div>

        {sims.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            Este usuário ainda não criou simulações.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {sims.map((s) => {
              const out = calcular(s.inputs);
              const finalizada = s.etapaAtual === "finalizado";
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-brand-900">
                        {s.nome}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          finalizada
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {finalizada ? "Finalizada" : "Em andamento"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {s.inputs.qtdCabecas || 0} cab ·{" "}
                      {s.inputs.fases.reduce((m, f) => Math.max(m, f.areaHa), 0) || 0} ha
                      · atualizada em{" "}
                      {new Date(s.updatedAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Lucro realista
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          out.lucro >= 0
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {fmtBRL(out.lucro)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Rent. a.a.
                      </div>
                      <div className="text-sm font-semibold text-brand-900">
                        {fmtPct(out.rentabilidadeAno)}
                      </div>
                    </div>
                    <Link
                      href={
                        finalizada
                          ? `/simulacao/${s.id}`
                          : `/nova?id=${s.id}`
                      }
                      className="rounded-md border border-brand-800 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                    >
                      Abrir
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function CampoInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {titulo}
      </div>
      <div className="mt-1 text-sm font-medium text-brand-900">{valor}</div>
    </div>
  );
}
