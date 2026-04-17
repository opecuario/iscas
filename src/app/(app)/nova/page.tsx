"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SimuladorForm from "@/components/SimuladorForm";
import ResultadosPainel from "@/components/ResultadosPainel";
import { INPUTS_PADRAO, calcular } from "@/lib/calculations";
import {
  LIMITE_SIMULACOES,
  gerarId,
  getSimulacao,
  getUsuario,
  listSimulacoesDoUsuarioLogado,
  upsertSimulacao,
  type EtapaAtual,
  type SimulacaoSalva,
} from "@/lib/storage";
import type {
  InputsBase,
  TipoVariante,
  VarianteOverride,
} from "@/lib/types";

function snapshotDoBase(base: InputsBase): VarianteOverride {
  return {
    gmd: base.gmd,
    precoCompraArroba: base.precoCompraArroba,
    precoVendaArroba: base.precoVendaArroba,
  };
}

/** Se o override não diferir do base em nenhum dos 3 campos, não tem cenário de fato. */
function normalizarVariante(
  base: InputsBase,
  override: VarianteOverride | null
): VarianteOverride | null {
  if (!override) return null;
  const igual =
    override.gmd === base.gmd &&
    override.precoCompraArroba === base.precoCompraArroba &&
    override.precoVendaArroba === base.precoVendaArroba;
  return igual ? null : override;
}

const ORDEM: TipoVariante[] = ["realista", "otimista", "pessimista"];

function proximaEtapa(v: TipoVariante): EtapaAtual {
  if (v === "realista") return "otimista";
  if (v === "otimista") return "pessimista";
  return "finalizado";
}

export default function NovaPageWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-neutral-500">Carregando…</div>}>
      <NovaPage />
    </Suspense>
  );
}

function NovaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const etapaParam = params.get("etapa") as TipoVariante | null;

  const [id, setId] = useState<string | null>(idParam);
  const [nome, setNome] = useState("");
  const [base, setBase] = useState<InputsBase>(INPUTS_PADRAO);
  const [otimista, setOtimista] = useState<VarianteOverride | null>(null);
  const [pessimista, setPessimista] = useState<VarianteOverride | null>(null);
  const [variante, setVariante] = useState<TipoVariante>("realista");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega ou inicializa
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (idParam) {
        const s = await getSimulacao(idParam);
        if (!ativo) return;
        if (s) {
          setId(s.id);
          setNome(s.nome);
          setBase(s.inputs);
          setOtimista(s.otimista);
          setPessimista(s.pessimista);
          const etapa: TipoVariante =
            etapaParam && ORDEM.includes(etapaParam)
              ? etapaParam
              : s.etapaAtual === "finalizado"
              ? "pessimista"
              : (s.etapaAtual as TipoVariante);
          setVariante(etapa);
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
  }, [idParam, etapaParam, router]);

  // Ao entrar no otimista/pessimista pela 1ª vez, inicializa com snapshot do realista.
  useEffect(() => {
    if (variante === "otimista" && otimista === null) {
      setOtimista(snapshotDoBase(base));
    }
    if (variante === "pessimista" && pessimista === null) {
      setPessimista(snapshotDoBase(base));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variante]);

  const override: VarianteOverride =
    variante === "otimista"
      ? otimista ?? snapshotDoBase(base)
      : variante === "pessimista"
      ? pessimista ?? snapshotDoBase(base)
      : snapshotDoBase(base);

  function setOverride(o: VarianteOverride) {
    if (variante === "otimista") setOtimista(o);
    else if (variante === "pessimista") setPessimista(o);
  }

  const out = useMemo(() => calcular(base, override), [base, override]);
  const inputsEfetivos = useMemo<InputsBase>(
    () => (override ? { ...base, ...override } : base),
    [base, override]
  );

  function copiarDoRealista() {
    if (variante === "otimista") setOtimista(snapshotDoBase(base));
    if (variante === "pessimista") setPessimista(snapshotDoBase(base));
  }

  async function salvar(finalizar: boolean) {
    setErro(null);
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setErro("Dê um nome para a simulação antes de salvar.");
      return;
    }
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
    const etapaNova: EtapaAtual = finalizar ? "finalizado" : proximaEtapa(variante);
    const novoId = id ?? gerarId();
    const anterior = id ? await getSimulacao(id) : null;

    const salva: SimulacaoSalva = {
      id: novoId,
      usuarioId: anterior?.usuarioId ?? usuarioAtual.id,
      nome: nomeTrim,
      tipo: "recria_engorda",
      etapaAtual: etapaNova,
      inputs: base,
      otimista: normalizarVariante(
        base,
        variante === "realista"
          ? anterior?.otimista ?? null
          : variante === "otimista"
          ? otimista
          : anterior?.otimista ?? otimista
      ),
      pessimista: normalizarVariante(
        base,
        variante === "pessimista"
          ? pessimista
          : anterior?.pessimista ?? pessimista
      ),
      createdAt: anterior?.createdAt ?? agora,
      updatedAt: agora,
    };

    const res = await upsertSimulacao(salva);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setId(novoId);

    if (etapaNova === "finalizado") {
      router.replace(`/simulacao/${novoId}`);
    } else {
      router.replace(`/nova?id=${novoId}&etapa=${etapaNova}`);
      setVariante(etapaNova as TipoVariante);
    }
  }

  const labelProximo =
    variante === "realista"
      ? "Salvar realista e simular otimista"
      : "Salvar otimista e simular pessimista";
  const ehUltima = variante === "pessimista";

  if (carregando) {
    return (
      <div className="p-10 text-sm text-neutral-500">Carregando simulação…</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      {/* Cabeçalho com nome e progresso */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-500">
              Nome da simulação
            </span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Fazenda São João — safra 26"
              className="w-full max-w-lg rounded-md border border-neutral-300 bg-white px-3 py-2 text-base font-semibold text-brand-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </label>
        </div>
        <ProgressoEtapas atual={variante} onIr={setVariante} />
      </header>

      {/* Banner da variante */}
      <VarianteBanner
        variante={variante}
        onCopiarDoRealista={copiarDoRealista}
      />

      {/* Grid principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <SimuladorForm
          base={base}
          setBase={setBase}
          variante={variante}
          override={override}
          setOverride={setOverride}
          out={out}
        />

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-lg bg-brand-900 p-4 text-white shadow-lg">
            <div className="text-[11px] uppercase tracking-wide text-brand-200">
              Resultado — {labelVariante(variante)}
            </div>
            <div className="text-lg font-semibold">
              {base.qtdCabecas || 0} cab · {base.areaHa || 0} ha ·{" "}
              {base.periodoDias || 0} dias
            </div>
          </div>
          <div className="mt-4">
            <ResultadosPainel out={out} cab={base.qtdCabecas} inputs={inputsEfetivos} />
          </div>
        </aside>
      </div>

      {/* Ações no rodapé */}
      <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        {erro && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {erro}
          </div>
        )}
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-neutral-600">
            {ehUltima
              ? "Ao finalizar, você verá o resumo comparativo dos cenários preenchidos."
              : "Você pode salvar só este cenário ou continuar para o próximo."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {variante !== "realista" && (
              <button
                onClick={() => {
                  const idx = ORDEM.indexOf(variante);
                  setVariante(ORDEM[idx - 1]);
                }}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
              >
                ← Voltar para {labelVariante(ORDEM[ORDEM.indexOf(variante) - 1])}
              </button>
            )}
            {!ehUltima && (
              <button
                onClick={() => salvar(true)}
                className="rounded-md border border-brand-800 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
              >
                Salvar e finalizar aqui
              </button>
            )}
            <button
              onClick={() => salvar(ehUltima)}
              className="rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              {ehUltima ? "Salvar e finalizar simulação" : labelProximo}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelVariante(v: TipoVariante): string {
  return v === "realista" ? "Realista" : v === "otimista" ? "Otimista" : "Pessimista";
}

function ProgressoEtapas({
  atual,
  onIr,
}: {
  atual: TipoVariante;
  onIr: (v: TipoVariante) => void;
}) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {ORDEM.map((v, i) => {
        const idxAtual = ORDEM.indexOf(atual);
        const concluida = i < idxAtual;
        const ativa = v === atual;
        return (
          <li key={v} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onIr(v)}
              title={`Ir para ${labelVariante(v)}`}
              className={`flex items-center gap-2 rounded-full pr-2 transition hover:bg-neutral-100 ${
                ativa ? "" : "cursor-pointer"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  concluida
                    ? "bg-emerald-600 text-white"
                    : ativa
                    ? "bg-brand-800 text-white"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={
                  ativa
                    ? "font-semibold text-brand-900"
                    : concluida
                    ? "text-neutral-700"
                    : "text-neutral-500"
                }
              >
                {labelVariante(v)}
              </span>
            </button>
            {i < ORDEM.length - 1 && (
              <span className="h-px w-6 bg-neutral-300" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function VarianteBanner({
  variante,
  onCopiarDoRealista,
}: {
  variante: TipoVariante;
  onCopiarDoRealista: () => void;
}) {
  if (variante === "realista") {
    return (
      <div className="mb-6 rounded-md border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
        <strong>Cenário realista:</strong> preencha seu cenário base. Todos os
        campos ficarão trancados nos próximos cenários — só GMD, preço de compra
        (R$/@) e preço de venda (R$/@) poderão variar.
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <div>
        <strong>Cenário {labelVariante(variante).toLowerCase()}:</strong> só
        GMD, preço de compra (R$/@) e preço de venda (R$/@) são editáveis — o
        resto herda do realista.
      </div>
      <button
        onClick={onCopiarDoRealista}
        className="rounded border border-amber-400 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
      >
        Copiar valores do realista
      </button>
    </div>
  );
}
