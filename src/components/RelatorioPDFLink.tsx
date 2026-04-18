"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import RelatorioPDF, { type CenarioPDF } from "./RelatorioPDF";
import type { InputsBase } from "@/lib/types";

interface Props {
  simNome: string;
  inputs: InputsBase;
  cenarios: CenarioPDF[];
  fileName: string;
  className?: string;
}

export default function RelatorioPDFLink({
  simNome,
  inputs,
  cenarios,
  fileName,
  className,
}: Props) {
  const dataGeracao = new Date();
  return (
    <PDFDownloadLink
      document={
        <RelatorioPDF
          simNome={simNome}
          inputs={inputs}
          cenarios={cenarios}
          dataGeracao={dataGeracao}
        />
      }
      fileName={fileName}
      className={className}
    >
      {({ loading, error }) =>
        error ? "Erro ao gerar" : loading ? "Gerando PDF…" : "Baixar PDF"
      }
    </PDFDownloadLink>
  );
}
