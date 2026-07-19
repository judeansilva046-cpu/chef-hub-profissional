"use client";

import { FileSpreadsheet, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export interface ExportarRelatorioButtonsProps {
  tipo: string;
  /** Base do Route Handler de exportação — um por módulo (Financeiro, Compras...), mesmo componente de botões. */
  endpoint?: string;
  /** Filtros/período atuais da tela, repassados como querystring para a exportação bater com o que está na tela. */
  searchParams?: Record<string, string | undefined>;
}

/** Botões de exportação reaproveitados por todo relatório com Route Handler PDF/Excel (Financeiro: Contas a Pagar, Contas a Receber, Fluxo de Caixa, DRE; Compras: solicitações, cotações, pedidos, divergências, histórico de preços, avaliações, compras por centro de custo) — um único componente para todos os módulos. */
export function ExportarRelatorioButtons({
  tipo,
  endpoint = "/api/financeiro/exportar",
  searchParams = {},
}: ExportarRelatorioButtonsProps) {
  function montarUrl(formato: "xlsx" | "pdf") {
    const query = new URLSearchParams();
    for (const [chave, valor] of Object.entries(searchParams)) {
      if (valor) query.set(chave, valor);
    }
    query.set("formato", formato);
    return `${endpoint}/${tipo}?${query.toString()}`;
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
