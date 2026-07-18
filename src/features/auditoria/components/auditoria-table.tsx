import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataHora } from "@/lib/format";

import type { AuditoriaComUsuario } from "../queries";

const TABELA_LABEL: Record<string, string> = {
  contas_pagar: "Conta a pagar",
  contas_receber: "Conta a receber",
  contas_receber_parcelas: "Parcela",
  plano_contas: "Plano de contas",
  centros_custo: "Centro de custo",
};

const ACAO_VARIANT: Record<string, "success" | "info" | "danger"> = {
  insert: "success",
  update: "info",
  delete: "danger",
};

const ACAO_LABEL: Record<string, string> = {
  insert: "Criado",
  update: "Alterado",
  delete: "Excluído",
};

export interface AuditoriaTableProps {
  linhas: AuditoriaComUsuario[];
}

export function AuditoriaTable({ linhas }: AuditoriaTableProps) {
  if (linhas.length === 0) {
    return <EmptyState title="Nenhum registro de auditoria" description="As alterações no módulo financeiro aparecem aqui." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Quando</TableHead>
          <TableHead>Tabela</TableHead>
          <TableHead>Ação</TableHead>
          <TableHead>Usuário</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => (
          <TableRow key={linha.id}>
            <TableCell className="text-muted-foreground">{formatarDataHora(linha.criado_em)}</TableCell>
            <TableCell className="text-foreground font-medium">{TABELA_LABEL[linha.tabela] ?? linha.tabela}</TableCell>
            <TableCell>
              <Badge variant={ACAO_VARIANT[linha.acao] ?? "outline"}>{ACAO_LABEL[linha.acao] ?? linha.acao}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{linha.profiles?.nome_completo ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
