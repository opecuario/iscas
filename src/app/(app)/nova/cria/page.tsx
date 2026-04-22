"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SimuladorCriaForm from "@/components/SimuladorCriaForm";
import ResultadosCriaPainel from "@/components/ResultadosCriaPainel";
import { useToast } from "@/components/ToastProvider";
import { calcularCria, inputsCriaPadrao } from "@/lib/calculationsCria";
import {
  LIMITE_SIMULACOES,
  gerarId,
  getSimulacao,
  getUsuario,
  listSimulacoesDoUsuarioLogado,
  upsertSimulacao,
  type SimulacaoSalva,
} from "@/lib/storage";
import type { InputsCria } from "@/lib/types";

export default function NovaCriaWrapper() {
  return (
    <Suspense
      fallback={<div className="p-10 text-sm text-neutral-500">Carregando…</div>}
    >
      <NovaCriaPage />
    </Suspense>
  );
}

function NovaCriaPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const idParam = params.get("id");

  const [id, setId] = useState<string | null>(idParam);
  const [nome, setNome] = useState("");
  const [base, setBase] = useState<InputsCria>(inputsCriaPadrao());
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState(false);
  const [autoSalvando, setAutoSalvando] = useState(false);
  const [ultimoAutoSave, setUltimoAutoSave] = useState<string | null>(null);
  const nomeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (idParam) {
        const s = await getSimulacao(idParam);
        if (!ativo) return;
        if (s && s.tipo === "cria") {
          setId(s.id);
          setNome(s.nome);
          setBase(s.inputs);
          setObservacoes(s.observacoes ?? "");
        } else if (s && s.tipo === "recria_engorda") {
          router.replace(`/nova/recria-engorda?id=${idParam}`);
          return;
        } else {
          router.replace("/nova");
        }
      }
      if (ativo) setCarregando(false);
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [idParam, router]);

  const out = useMemo(() => calcularCria(base), [base]);

  // Autosave
  useEffect(() => {
    if (!id || carregando) return;
    if (!nome.trim()) return;
    const timer = setTimeout(async () => {
      const usuarioAtual = await getUsuario();
      if (!usuarioAtual) return;
      const anterior = await getSimulacao(id);
      if (!anterior || anterior.tipo !== "cria") return;
      setAutoSalvando(true);
      const agora = new Date().toISOString();
      const salva: SimulacaoSalva = {
        id,
        usuarioId: anterior.usuarioId,
        nome: nome.trim(),
        tipo: "cria",
        etapaAtual: anterior.etapaAtual,
        inputs: base,
        otimista: null,
        pessimista: null,
        observacoes: observacoes.trim() || undefined,
        createdAt: anterior.createdAt,
        updatedAt: agora,
      };
      const res = await upsertSimulacao(salva);
      setAutoSalvando(false);
      if (res.ok) setUltimoAutoSave(agora);
    }, 2000);
    return () => clearTimeout(timer);
  }, [base, observacoes, nome, id, carregando]);

  function validarCampos(): boolean {
    if (!nome.trim()) {
      setErroNome(true);
      setErro("Dê um nome para a simulação.");
      nomeInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setTimeout(() => nomeInputRef.current?.focus(), 300);
      return false;
    }
    if (base.qtdMatrizes <= 0) {
      setErro("Preencha a quantidade de matrizes.");
      return false;
    }
    if (base.fasesReproducao.length === 0) {
      setErro("Adicione pelo menos uma fase de reprodução.");
      return false;
    }
    return true;
  }

  async function salvar(finalizar: boolean) {
    setErro(null);
    setErroNome(false);
    if (!validarCampos()) return;

    const usuarioAtual = await getUsuario();
    if (!usuarioAtual) {
      setErro("Sessão expirada. Faça login novamente.");
      return;
    }
    if (!id && !usuarioAtual.simulacoesIlimitadas) {
      const outras = await listSimulacoesDoUsuarioLogado();
      if (outras.length >= LIMITE_SIMULACOES) {
        setErro(
          `Limite de ${LIMITE_SIMULACOES} simulações atingido. Exclua uma antes de criar outra.`
        );
        return;
      }
    }

    const agora = new Date().toISOString();
    const novoId = id ?? gerarId();
    const anteriorRaw = id ? await getSimulacao(id) : null;
    const anterior =
      anteriorRaw && anteriorRaw.tipo === "cria" ? anteriorRaw : null;

    const salva: SimulacaoSalva = {
      id: novoId,
      usuarioId: anterior?.usuarioId ?? usuarioAtual.id,
      nome: nome.trim(),
      tipo: "cria",
      etapaAtual: finalizar ? "finalizado" : "realista",
      inputs: base,
      otimista: null,
      pessimista: null,
      observacoes: observacoes.trim() || undefined,
      createdAt: anterior?.createdAt ?? agora,
      updatedAt: agora,
    };

    const res = await upsertSimulacao(salva);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setId(novoId);

    if (finalizar) {
      toast.sucesso("Simulação salva — abrindo resumo.");
      router.replace(`/simulacao/${novoId}`);
    } else {
      toast.sucesso("Simulação salva.");
      router.replace(`/nova/cria?id=${novoId}`);
    }
  }

  if (carregando) {
    return (
      <div className="p-10 text-sm text-neutral-500">Carregando simulação…</div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          <span className="rounded bg-brand-100 px-2 py-0.5">Simulador · Cria</span>
          {autoSalvando && (
            <span className="text-neutral-500">Salvando…</span>
          )}
          {!autoSalvando && ultimoAutoSave && (
            <span className="text-neutral-500">
              Salvo às{" "}
              {new Date(ultimoAutoSave).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-brand-900/80">
                Nome da simulação
              </span>
              <input
                ref={nomeInputRef}
                type="text"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (e.target.value.trim()) setErroNome(false);
                }}
                placeholder="Ex.: Cria fazenda São José 2026"
                className={`w-full rounded-md border px-3 py-2 text-base font-semibold outline-none transition ${
                  erroNome
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400"
                    : "border-neutral-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                }`}
              />
            </label>
          </div>
        </div>
      </header>

      {erro && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div>
          <SimuladorCriaForm base={base} setBase={setBase} out={out} />

          <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-800">
              Observações
            </h2>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              placeholder="Anote premissas, dúvidas ou próximos passos da simulação…"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              ← Voltar
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => salvar(false)}
                className="rounded-md border border-brand-800 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => salvar(true)}
                className="rounded-md bg-brand-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Salvar e ver resumo
              </button>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <ResultadosCriaPainel inputs={base} out={out} />
        </aside>
      </div>
    </div>
  );
}
