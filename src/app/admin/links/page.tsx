"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminListUsuarios,
  atualizarLinkDivulgacao,
  criarLinkDivulgacao,
  deletarLinkDivulgacao,
  listLinksDivulgacao,
  type LinkDivulgacao,
} from "@/lib/admin";
import type { Usuario } from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";

export default function AdminLinksPage() {
  const toast = useToast();
  const [links, setLinks] = useState<LinkDivulgacao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formNome, setFormNome] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formObs, setFormObs] = useState("");
  const [criando, setCriando] = useState(false);
  const [origem, setOrigem] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigem(window.location.origin);
    }
  }, []);

  async function recarregar() {
    const [ls, us] = await Promise.all([
      listLinksDivulgacao(),
      adminListUsuarios(),
    ]);
    setLinks(ls);
    setUsuarios(us);
    setCarregando(false);
  }

  useEffect(() => {
    let ativo = true;
    Promise.all([listLinksDivulgacao(), adminListUsuarios()]).then(
      ([ls, us]) => {
        if (!ativo) return;
        setLinks(ls);
        setUsuarios(us);
        setCarregando(false);
      }
    );
    return () => {
      ativo = false;
    };
  }, []);

  const usuariosPorOrigem = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usuarios) {
      if (!u.origemLink) continue;
      m.set(u.origemLink, (m.get(u.origemLink) ?? 0) + 1);
    }
    return m;
  }, [usuarios]);

  const semOrigemCount = useMemo(
    () => usuarios.filter((u) => !u.origemLink).length,
    [usuarios]
  );

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (criando) return;
    setCriando(true);
    const res = await criarLinkDivulgacao({
      slug: formSlug || formNome,
      nome: formNome,
      observacao: formObs,
    });
    setCriando(false);
    if (!res.ok) {
      toast.erro(res.erro);
      return;
    }
    toast.sucesso("Link criado.");
    setFormNome("");
    setFormSlug("");
    setFormObs("");
    recarregar();
  }

  async function alternarAtivo(link: LinkDivulgacao) {
    const res = await atualizarLinkDivulgacao(link.id, { ativo: !link.ativo });
    if (!res.ok) {
      toast.erro(res.erro);
      return;
    }
    recarregar();
  }

  async function excluir(link: LinkDivulgacao) {
    const usados = usuariosPorOrigem.get(link.slug) ?? 0;
    const aviso =
      usados > 0
        ? `Este link já trouxe ${usados} usuário(s). Excluir vai apagar a referência (os usuários ficarão sem origem). Tem certeza?`
        : "Excluir este link? A ação não pode ser desfeita.";
    if (!confirm(aviso)) return;
    const res = await deletarLinkDivulgacao(link.id);
    if (!res.ok) {
      toast.erro(res.erro);
      return;
    }
    toast.sucesso("Link excluído.");
    recarregar();
  }

  function copiar(slug: string) {
    const url = `${origem}/cadastro?ref=${slug}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.sucesso("Link copiado."))
      .catch(() => toast.erro("Não foi possível copiar."));
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-900">
          Links de divulgação
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Crie links rastreáveis para descobrir de onde vem cada cadastro.
          Cada link gera uma URL com <code>?ref=identificador</code> que marca
          o novo usuário com a origem indicada.
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-800">
          Criar novo link
        </h2>
        <form onSubmit={criar} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_240px_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-brand-900/80">
              Nome (referência interna)
            </span>
            <input
              type="text"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Ex.: Bio Instagram, WhatsApp Mai/2026"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-brand-900/80">
              Identificador da URL{" "}
              <span className="text-neutral-400">(opcional)</span>
            </span>
            <input
              type="text"
              value={formSlug}
              onChange={(e) => setFormSlug(e.target.value)}
              placeholder="ex.: instagram-bio"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>
          <button
            type="submit"
            disabled={criando || !formNome.trim()}
            className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50 sm:self-end"
          >
            {criando ? "Criando…" : "Criar link"}
          </button>
          <label className="block sm:col-span-3">
            <span className="mb-1 block text-xs font-medium text-brand-900/80">
              Observação <span className="text-neutral-400">(opcional)</span>
            </span>
            <input
              type="text"
              value={formObs}
              onChange={(e) => setFormObs(e.target.value)}
              placeholder="Anote contexto, campanha, parceiro…"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>
        </form>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-brand-900">
            Links criados ({links.length})
          </h2>
          <span className="text-xs text-neutral-500">
            {semOrigemCount} cadastros sem origem rastreada
          </span>
        </div>
        {carregando ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            Carregando…
          </p>
        ) : links.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">
            Nenhum link criado ainda. Use o formulário acima.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {links.map((l) => {
              const url = `${origem}/cadastro?ref=${l.slug}`;
              const cadastros = usuariosPorOrigem.get(l.slug) ?? 0;
              return (
                <li key={l.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-brand-900">
                          {l.nome}
                        </span>
                        {!l.ativo && (
                          <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700">
                            Inativo
                          </span>
                        )}
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          {cadastros} cadastro{cadastros === 1 ? "" : "s"}
                        </span>
                      </div>
                      {l.observacao && (
                        <p className="mt-1 text-xs text-neutral-500">
                          {l.observacao}
                        </p>
                      )}
                      <code className="mt-2 block break-all rounded bg-neutral-50 px-2 py-1.5 text-[11px] text-neutral-700">
                        {url}
                      </code>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() => copiar(l.slug)}
                        className="rounded-md bg-brand-800 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-brand-700"
                      >
                        Copiar
                      </button>
                      <button
                        onClick={() => alternarAtivo(l)}
                        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        {l.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => excluir(l)}
                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
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
