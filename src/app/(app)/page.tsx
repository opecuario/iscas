"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LIMITE_SIMULACOES,
  TIPO_SIMULADOR_LABEL,
  deleteSimulacao,
  duplicarSimulacao,
  listSimulacoesDoUsuarioLogado,
  type SimulacaoSalva,
} from "@/lib/storage";
import { calcular } from "@/lib/calculations";
import { calcularCria } from "@/lib/calculationsCria";
import { fmtBRL, fmtInt, fmtPct } from "@/lib/format";
import { useUsuario } from "@/components/UsuarioProvider";
import { useToast } from "@/components/ToastProvider";
import { varianteEfetiva } from "@/lib/variantes";
import type { InputsBase } from "@/lib/types";

function areaTotalBase(base: InputsBase): number {
  return base.fases.reduce((m, f) => Math.max(m, f.areaHa), 0);
}

const ETAPA_LABEL: Record<SimulacaoSalva["etapaAtual"], string> = {
  realista: "Em andamento — Realista",
  otimista: "Em andamento — Otimista",
  pessimista: "Em andamento — Pessimista",
  finalizado: "Finalizada",
};

export default function Dashboard() {
  const usuario = useUsuario();
  const router = useRouter();
  const toast = useToast();
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
    toast.sucesso("Simulação excluída.");
  }

  async function duplicar(id: string) {
    if (!ilimitadas && simulacoes.length >= LIMITE_SIMULACOES) {
      toast.erro(`Limite de ${LIMITE_SIMULACOES} simulações atingido — exclua uma antes de duplicar.`);
      return;
    }
    const res = await duplicarSimulacao(id);
    if (!res.ok) {
      toast.erro(res.erro);
      return;
    }
    toast.sucesso("Cópia criada. Abrindo…");
    if (res.novoId) {
      const original = simulacoes.find((x) => x.id === id);
      const rota =
        original?.tipo === "cria" ? "/nova/cria" : "/nova/recria-engorda";
      router.push(`${rota}?id=${res.novoId}`);
    }
  }

  const ilimitadas = usuario?.simulacoesIlimitadas ?? false;
  const cheio = !ilimitadas && simulacoes.length >= LIMITE_SIMULACOES;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-brand-900">
          Olá{usuario ? `, ${usuario.nome.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Gerencie suas simulações de recria e engorda.
          {ilimitadas
            ? " Seu acesso está liberado — crie quantas simulações quiser."
            : ` Você pode manter até ${LIMITE_SIMULACOES} simulações salvas.`}
        </p>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {ilimitadas
            ? `Minhas simulações (${simulacoes.length})`
            : `Minhas simulações (${simulacoes.length}/${LIMITE_SIMULACOES})`}
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
            <CardSimulacao
              key={s.id}
              s={s}
              onDelete={() => excluir(s.id)}
              onDuplicate={() => duplicar(s.id)}
            />
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
  onDuplicate,
}: {
  s: SimulacaoSalva;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const finalizada = s.etapaAtual === "finalizado";
  const rotaForm =
    s.tipo === "cria" ? "/nova/cria" : "/nova/recria-engorda";
  const href = finalizada ? `/simulacao/${s.id}` : `${rotaForm}?id=${s.id}`;
  const dataFmt = new Date(s.updatedAt).toLocaleDateString("pt-BR");

  const resumoLinha =
    s.tipo === "cria"
      ? `${fmtInt(s.inputs.qtdMatrizes || 0)} matrizes${
          s.inputs.areaHa ? ` · ${s.inputs.areaHa} ha` : ""
        }`
      : `${s.inputs.qtdCabecas || 0} cab · ${areaTotalBase(s.inputs) || 0} ha`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-brand-900">
            {s.nome}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-brand-100 px-1.5 py-0.5 font-medium text-brand-800">
              {TIPO_SIMULADOR_LABEL[s.tipo]}
            </span>
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
              {resumoLinha} · atualizada em {dataFmt}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <button
            onClick={onDuplicate}
            className="text-neutral-500 hover:text-brand-800"
            title="Duplicar simulação"
          >
            Duplicar
          </button>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <button
            onClick={onDelete}
            className="text-neutral-500 hover:text-red-600"
            title="Excluir simulação"
          >
            Excluir
          </button>
        </div>
      </div>

      {s.tipo === "recria_engorda" ? (
        <ResultadosRecriaBoxes s={s} />
      ) : (
        <ResultadosCriaBoxes s={s} />
      )}

      <Link
        href={href}
        className="mt-4 block rounded-md border border-brand-800 bg-white px-4 py-2 text-center text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
      >
        {finalizada ? "Ver resumo" : "Continuar simulação"}
      </Link>
    </div>
  );
}

function ResultadosRecriaBoxes({
  s,
}: {
  s: Extract<SimulacaoSalva, { tipo: "recria_engorda" }>;
}) {
  const otimistaEfetivo = varianteEfetiva(s.inputs, s.otimista);
  const pessimistaEfetivo = varianteEfetiva(s.inputs, s.pessimista);
  const resultados = [{ label: "Realista", out: calcular(s.inputs) }];
  if (otimistaEfetivo) {
    resultados.push({
      label: "Otimista",
      out: calcular(s.inputs, otimistaEfetivo),
    });
  }
  if (pessimistaEfetivo) {
    resultados.push({
      label: "Pessimista",
      out: calcular(s.inputs, pessimistaEfetivo),
    });
  }
  const gridCols =
    resultados.length === 1
      ? "grid-cols-1"
      : resultados.length === 2
      ? "grid-cols-2"
      : "grid-cols-3";
  return (
    <div className={`mt-4 grid ${gridCols} gap-2`}>
      {resultados.map((r) => (
        <BoxResumo
          key={r.label}
          label={r.label}
          lucro={r.out.lucro}
          rentAno={r.out.rentabilidadeAno}
        />
      ))}
    </div>
  );
}

function ResultadosCriaBoxes({
  s,
}: {
  s: Extract<SimulacaoSalva, { tipo: "cria" }>;
}) {
  const out = calcularCria(s.inputs);
  return (
    <div className="mt-4 grid grid-cols-1 gap-2">
      <BoxResumo
        label="Ciclo"
        lucro={out.lucro}
        rentAno={out.rentabilidadeAno}
      />
    </div>
  );
}

function BoxResumo({
  label,
  lucro,
  rentAno,
}: {
  label: string;
  lucro: number;
  rentAno: number;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-brand-900">{label}</span>
      </div>
      <div className="mt-1.5">
        <div className="text-[10px] text-neutral-500">Lucro</div>
        <div
          className={`font-semibold ${
            lucro >= 0 ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {fmtBRL(lucro)}
        </div>
      </div>
      <div className="mt-1.5">
        <div className="text-[10px] text-neutral-500">Rent. a.a.</div>
        <div
          className={`font-semibold ${
            rentAno >= 0 ? "text-brand-900" : "text-red-700"
          }`}
        >
          {fmtPct(rentAno)}
        </div>
      </div>
    </div>
  );
}

function PaywallCard() {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
          Quer melhorar seus resultados?
        </div>
        <h3 className="mt-1 text-base font-semibold text-brand-900">
          Fale com nossa consultoria
        </h3>
        <p className="mt-2 text-xs text-neutral-600">
          Nossa equipe ajuda você a transformar esses números em decisões
          concretas — ajustando manejo, nutrição e compra/venda para elevar o
          retorno da sua operação.
        </p>
      </div>
      <a
        href="https://wa.me/556699852419"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block rounded-md bg-brand-800 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Quero falar com um especialista
      </a>
    </div>
  );
}
