import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatarData } from "@/lib/format";
import { cn } from "@/lib/utils";

import { adicionarDias, hojeIso } from "../date-range";

export interface ProducaoNavegacaoProps {
  visao: "dia" | "semana";
  dataAncora: string;
  dataInicio: string;
  dataFim: string;
}

function criarHref(visao: "dia" | "semana", data: string) {
  return `/producao?visao=${visao}&data=${data}`;
}

export function ProducaoNavegacao({
  visao,
  dataAncora,
  dataInicio,
  dataFim,
}: ProducaoNavegacaoProps) {
  const passo = visao === "dia" ? 1 : 7;
  const anterior = adicionarDias(dataAncora, -passo);
  const proxima = adicionarDias(dataAncora, passo);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="bg-secondary inline-flex items-center gap-1 rounded-md p-1">
        <Link
          href={criarHref("dia", dataAncora)}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            visao === "dia"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Dia
        </Link>
        <Link
          href={criarHref("semana", dataAncora)}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            visao === "semana"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Semana
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={criarHref(visao, anterior)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-foreground min-w-40 text-center text-sm font-medium">
          {visao === "dia"
            ? formatarData(dataAncora)
            : `${formatarData(dataInicio)} a ${formatarData(dataFim)}`}
        </span>
        <Link
          href={criarHref(visao, proxima)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href={criarHref(visao, hojeIso())}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Hoje
        </Link>
      </div>
    </div>
  );
}
