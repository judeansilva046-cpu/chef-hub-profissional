"use client";

import { FileSpreadsheet, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export interface ExportarRelatorioButtonsProps {
  tipo: "contas-pagar" | "contas-receber" | "fluxo-caixa" | "dre";
  /** Filtros/período atuais da tela, repassados como querystring para a exportação bater com o que está na tela. */
  searchParams?: Record<string, string | undefined>;
}

/** Botões de exportação reaproveitados por Contas a Pagar, Contas a Receber, Fluxo de Caixa e DRE — um único componente, um único endpoint (/api/financeiro/exportar/[tipo]). */
export function ExportarRelatorioButtons({ tipo, searchParams = {} }: ExportarRelatorioButtonsProps) {
  function montarUrl(formato: "xlsx" | "pdf") {
    const query = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) {
      if (valor) query.set(chave, valor);
    }
    query.set("formato", formato);
    return `/api/financeiro/exportar/${tipo}?${query.toString()}`;
  }

  return (
    <div className="flex gap-2">
      <a href={montarUrl("xlsx")} download className={buttonVariants({ variant: "outline", size: "sm" })}>
        <FileSpreadsheet className="h-4 w-4" />
        Exportar Excel
      </a>
      <a href={montarUrl("pdf")} download className={buttonVariants({ variant: "outline", size: "sm" })}>
        <FileText className="h-4 w-4" />
        Exportar PDF
      </a>
    </div>
  );
}
