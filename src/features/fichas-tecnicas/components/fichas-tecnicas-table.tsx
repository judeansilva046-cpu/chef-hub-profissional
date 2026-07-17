"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Eye, Pencil, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { alternarAtivoFichaTecnica } from "../actions";
import type { FichaTecnicaComRendimento } from "../queries";

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export interface FichasTecnicasTableProps {
  fichas: FichaTecnicaComRendimento[];
}

export function FichasTecnicasTable({ fichas }: FichasTecnicasTableProps) {
  const [pending, startTransition] = useTransition();

  function alternarAtivo(ficha: FichaTecnicaComRendimento) {
    startTransition(async () => {
      try {
        await alternarAtivoFichaTecnica(ficha.id, !ficha.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar.",
        );
      }
    });
  }

  if (fichas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma ficha técnica encontrada"
        description="Ajuste a busca/filtros ou crie uma nova ficha técnica."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Rendimento</TableHead>
          <TableHead>Custo/porção</TableHead>
          <TableHead>CMV %</TableHead>
          <TableHead>Margem</TableHead>
          <TableHead>Versão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fichas.map((ficha) => (
          <TableRow key={ficha.id}>
            <TableCell className="text-foreground font-medium">
              <Link
                href={`/fichas-tecnicas/${ficha.id}`}
                className="hover:underline"
              >
                {ficha.nome}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {ficha.rendimento_quantidade} {ficha.unidades_medida.sigla}
            </TableCell>
            <TableCell>{formatoMoeda.format(ficha.custo_por_porcao)}</TableCell>
            <TableCell>
              {ficha.cmv_percentual !== null
                ? `${formatoPercentual.format(ficha.cmv_percentual)}%`
                : "—"}
            </TableCell>
            <TableCell>
              {ficha.margem_contribuicao_percentual !== null
                ? `${formatoPercentual.format(ficha.margem_contribuicao_percentual)}%`
                : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              v{ficha.versao_atual}
            </TableCell>
            <TableCell>
              <Badge variant={ficha.ativo ? "success" : "outline"}>
                {ficha.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Link
                  href={`/fichas-tecnicas/${ficha.id}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver</span>
                </Link>
                <Link
                  href={`/fichas-tecnicas/${ficha.id}/editar`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => alternarAtivo(ficha)}
                >
                  <Power className="h-4 w-4" />
                  <span className="sr-only">
                    {ficha.ativo ? "Inativar" : "Reativar"}
                  </span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
