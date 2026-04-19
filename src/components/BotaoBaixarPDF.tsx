"use client";

import { useMemo, useState } from "react";
import type { InputsBase } from "@/lib/types";
import type { CenarioPDF } from "./RelatorioPDF";

const BOTAO_CLS =
  "rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-80";

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
  const [gerando, setGerando] = useState(false);

  const fileName = useMemo(
    () => `relatorio_${sanitizeFilename(simNome)}.pdf`,
    [simNome]
  );

  async function baixar() {
    if (gerando) return;
    setGerando(true);
    try {
      const [{ pdf }, { default: RelatorioPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./RelatorioPDF"),
      ]);
      const blob = await pdf(
        <RelatorioPDF
          simNome={simNome}
          inputs={inputs}
          cenarios={cenarios}
          dataGeracao={new Date()}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (e) {
      console.error("Falha ao gerar PDF", e);
      alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={gerando}
      className={BOTAO_CLS}
    >
      {gerando ? "Gerando PDF…" : "Baixar PDF"}
    </button>
  );
}
