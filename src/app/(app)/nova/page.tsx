"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSimulacao } from "@/lib/storage";

export default function NovaChooserWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-neutral-500">Carregando…</div>}>
      <NovaChooser />
    </Suspense>
  );
}

function NovaChooser() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const [redirecionando, setRedirecionando] = useState(!!idParam);

  useEffect(() => {
    if (!idParam) return;
    let ativo = true;
    (async () => {
      const sim = await getSimulacao(idParam);
      if (!ativo) return;
      const destino =
        sim?.tipo === "cria"
          ? `/nova/cria?id=${idParam}`
          : `/nova/recria-engorda?id=${idParam}`;
      router.replace(destino);
    })();
    return () => {
      ativo = false;
    };
  }, [idParam, router]);

  if (redirecionando) {
    return (
      <div className="p-10 text-sm text-neutral-500">Abrindo simulação…</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-brand-900">Nova simulação</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Escolha o tipo de operação que você quer simular.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardTipo
          titulo="Recria / Engorda"
          descricao="Compra animais de reposição, engorda em pasto ou confinamento e vende ao abate. Compara cenário realista, otimista e pessimista."
          href="/nova/recria-engorda"
          badge="Clássico"
        />
        <CardTipo
          titulo="Cria"
          descricao="Plantel de matrizes com estação de monta (IATF e/ou monta natural), gestação, desmame, venda de bezerros e descarte."
          href="/nova/cria"
          badge="Novo"
        />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-brand-800"
        >
          ← Voltar pro painel
        </Link>
      </div>
    </div>
  );
}

function CardTipo({
  titulo,
  descricao,
  href,
  badge,
}: {
  titulo: string;
  descricao: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/30 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-900">{titulo}</h3>
        {badge && (
          <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {descricao}
      </p>
      <div className="mt-4 text-sm font-semibold text-brand-800">
        Começar →
      </div>
    </Link>
  );
}
