"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Play, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarData, formatarDecimal } from "@/lib/format";

import { atualizarStatusProducao, concluirProducao } from "../actions";
import type { ProducaoComFicha } from "../queries";

const STATUS_LABEL: Record<string, string> = {
  planejada: "Planejada",
  em_producao: "Em produção",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_VARIANT: Record<
  string,
  "warning" | "info" | "success" | "danger"
> = {
  planejada: "warning",
  em_producao: "info",
  concluida: "success",
  cancelada: "danger",
};

export interface ProducoesTableProps {
  producoes: ProducaoComFicha[];
}

export function ProducoesTable({ producoes }: ProducoesTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function iniciar(id: string) {
    startTransition(async () => {
      try {
        await atualizarStatusProducao(id, "em_producao");
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Não foi possível iniciar.",
        );
      }
    });
  }

  function cancelar(id: string) {
    startTransition(async () => {
      try {
        await atualizarStatusProducao(id, "cancelada");
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível cancelar.",
        );
      }
    });
  }

  function concluir(id: string) {
    startTransition(async () => {
      try {
        await concluirProducao(id);
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a produção.",
        );
      }
    });
  }

  if (producoes.length === 0) {
    return (
      <EmptyState
        title="Nenhuma produção planejada neste período"
        description="Planeje uma nova produção ou repita a semana anterior."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Ficha técnica</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {producoes.map((producao) => (
          <TableRow key={producao.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {formatarData(producao.data_producao)}
            </TableCell>
            <TableCell className="text-foreground font-medium">
              {producao.fichas_tecnicas.nome}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(producao.quantidade_planejada)}{" "}
              {producao.fichas_tecnicas.unidades_medida.sigla}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[producao.status]}>
                {STATUS_LABEL[producao.status] ?? producao.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {(producao.status === "planejada" ||
                producao.status === "em_producao") && (
                <div className="flex justify-end gap-1">
                  {producao.status === "planejada" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => iniciar(producao.id)}
                    >
                      <Play className="h-4 w-4" />
                      <span className="sr-only">Iniciar</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => concluir(producao.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Concluir</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => cancelar(producao.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancelar</span>
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
