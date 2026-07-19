"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

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
import { formatarData, formatarMoeda } from "@/lib/format";

import { alternarAtivoCupom } from "../actions";
import type { CupomComRelacoes } from "../queries";
import { CupomDialog } from "./cupom-dialog";

const TIPO_LABEL: Record<string, string> = {
  percentual: "Percentual",
  fixo: "Valor fixo",
  frete_gratis: "Frete grátis",
  produto_gratis: "Produto grátis",
};

export interface CuponsTableProps {
  cupons: CupomComRelacoes[];
  fichasTecnicas: { id: string; nome: string }[];
  canaisVenda: { id: string; nome: string }[];
}

export function CuponsTable({ cupons, fichasTecnicas, canaisVenda }: CuponsTableProps) {
  const [pending, startTransition] = useTransition();

  if (cupons.length === 0) {
    return <EmptyState title="Nenhum cupom cadastrado" description="Crie cupons de desconto para campanhas e clientes." />;
  }

  function valorFormatado(cupom: CupomComRelacoes) {
    if (cupom.tipo === "percentual") return `${cupom.valor}%`;
    if (cupom.tipo === "fixo") return formatarMoeda(cupom.valor);
    if (cupom.tipo === "produto_gratis") return cupom.fichas_tecnicas?.nome ?? "—";
    return "—";
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Validade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cupons.map((cupom) => (
          <TableRow key={cupom.id}>
            <TableCell className="text-foreground font-medium">
              <Link href={`/crm/cupons?cupomId=${cupom.id}`} className="hover:underline">
                {cupom.codigo}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{TIPO_LABEL[cupom.tipo] ?? cupom.tipo}</TableCell>
            <TableCell>{valorFormatado(cupom)}</TableCell>
            <TableCell className="text-muted-foreground">
              {cupom.valido_ate ? formatarData(cupom.valido_ate) : "Sem prazo"}
            </TableCell>
            <TableCell>
              <Badge variant={cupom.ativo ? "success" : "outline"}>{cupom.ativo ? "Ativo" : "Inativo"}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <CupomDialog
                  cupom={cupom}
                  fichasTecnicas={fichasTecnicas}
                  canaisVenda={canaisVenda}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => alternarAtivoCupom(cupom.id, !cupom.ativo))}
                >
                  {cupom.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
