"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LIMITE_SIMULACOES,
  limparSessao,
  listSimulacoes,
  type SimulacaoSalva,
} from "@/lib/storage";
import { useUsuario } from "./UsuarioProvider";
import { isAdmin } from "@/lib/admin";

const ETAPA_LABEL: Record<SimulacaoSalva["etapaAtual"], string> = {
  realista: "Realista",
  otimista: "Otimista",
  pessimista: "Pessimista",
  finalizado: "Finalizada",
};

export default function Sidebar() {
  const usuario = useUsuario();
  const router = useRouter();
  const pathname = usePathname();
  const [simulacoes, setSimulacoes] = useState<SimulacaoSalva[]>([]);

  useEffect(() => {
    setSimulacoes(listSimulacoes());
  }, [pathname]);

  const cheio = simulacoes.length >= LIMITE_SIMULACOES;

  function logout() {
    if (typeof window === "undefined") return;
    limparSessao();
    router.replace("/login");
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-neutral-200 bg-white">
      <div className="p-5">
        <Link href="/" className="block">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={200}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
      </div>

      <div className="px-4">
        <Link
          href="/"
          className={`mb-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            pathname === "/"
              ? "bg-brand-50 text-brand-900"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <span className="text-base">⌂</span>
          Dashboard
        </Link>
        <Link
          href="/nova"
          aria-disabled={cheio}
          onClick={(e) => {
            if (cheio) {
              e.preventDefault();
              alert(
                `Você já atingiu o limite de ${LIMITE_SIMULACOES} simulações salvas. Exclua uma para criar outra.`
              );
            }
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            cheio
              ? "cursor-not-allowed bg-neutral-200 text-neutral-500"
              : "bg-brand-800 text-white hover:bg-brand-700"
          }`}
        >
          + Nova simulação
        </Link>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          {simulacoes.length} de {LIMITE_SIMULACOES} slots usados
        </p>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-4 pb-4">
        <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          Simulações recria/engorda
        </h2>
        {simulacoes.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-500">
            Nenhuma simulação salva ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {simulacoes.map((s) => {
              const ativa =
                pathname === `/simulacao/${s.id}` ||
                pathname === `/nova` && typeof window !== "undefined" &&
                new URLSearchParams(window.location.search).get("id") === s.id;
              const href =
                s.etapaAtual === "finalizado"
                  ? `/simulacao/${s.id}`
                  : `/nova?id=${s.id}`;
              return (
                <li key={s.id}>
                  <Link
                    href={href}
                    className={`block rounded-md border p-3 text-sm transition ${
                      ativa
                        ? "border-brand-600 bg-brand-50"
                        : "border-neutral-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
                    }`}
                  >
                    <div className="truncate font-medium text-brand-900">
                      {s.nome}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span
                        className={`rounded px-1.5 py-0.5 font-medium ${
                          s.etapaAtual === "finalizado"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ETAPA_LABEL[s.etapaAtual]}
                      </span>
                      <span className="text-neutral-500">
                        {s.inputs.qtdCabecas || 0} cab · {s.inputs.areaHa || 0} ha
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Em breve
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Exportação em PDF, comparação lado a lado e mais simuladores.
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 p-4 text-xs">
        {isAdmin(usuario) && (
          <Link
            href="/admin"
            className="mb-3 flex items-center gap-2 rounded-md bg-brand-900 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            <span>★</span> Painel admin
          </Link>
        )}
        {usuario && (
          <>
            <div className="truncate font-semibold text-brand-900">
              {usuario.nome}
            </div>
            <div className="truncate text-neutral-500">{usuario.email}</div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair / Trocar de usuário
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
