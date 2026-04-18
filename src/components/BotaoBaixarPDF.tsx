"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { InputsBase } from "@/lib/types";
import type { CenarioPDF } from "./RelatorioPDF";

const BOTAO_CLS =
  "rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700";

const RelatorioPDFLink = dynamic(() => import("./RelatorioPDFLink"), {
  ssr: false,
  loading: () => (
    <span className={`${BOTAO_CLS} cursor-wait opacity-80`}>Carregando…</span>
  ),
});

interface Props {
  simNome: string;
  inputs: InputsBase;
  cenarios: CenarioPDF[];
}

function sanitizeFilename(nome: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return limpo || "relatorio";
}

export default function BotaoBaixarPDF({ simNome, inputs, cenarios }: Props) {
  const [ativo, setAtivo] = useState(false);

  const fileName = useMemo(
    () => `relatorio_${sanitizeFilename(simNome)}.pdf`,
    [simNome]
  );

  if (!ativo) {
    return (
      <button
        type="button"
        onClick={() => setAtivo(true)}
        className={BOTAO_CLS}
      >
        Baixar PDF
      </button>
    );
  }

  return (
    <RelatorioPDFLink
      simNome={simNome}
      inputs={inputs}
      cenarios={cenarios}
      fileName={fileName}
      className={BOTAO_CLS}
    />
  );
}
