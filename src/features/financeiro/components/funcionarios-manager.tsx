"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Power, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoFuncionario } from "../actions";
import { calcularCustoFuncionario } from "../calculations";
import { TIPO_CONTRATACAO_OPCOES } from "../validation";
import { FuncionarioDialog } from "./funcionario-dialog";

export interface FuncionariosManagerProps {
  funcionarios: Tables<"funcionarios">[];
}

const TIPO_LABEL = Object.fromEntries(
  TIPO_CONTRATACAO_OPCOES.map((opcao) => [opcao.value, opcao.label]),
);

export function FuncionariosManager({ funcionarios }: FuncionariosManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState<
    Tables<"funcionarios"> | undefined
  >(undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirCriacao() {
    setFuncionarioEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(funcionario: Tables<"funcionarios">) {
    setFuncionarioEmEdicao(funcionario);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(funcionario: Tables<"funcionarios">) {
    startTransition(async () => {
      try {
        await alternarAtivoFuncionario(funcionario.id, !funcionario.ativo);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível atualizar.");
      }
    });
  }

  const custosPorFuncionario = funcionarios.map((funcionario) => ({
    funcionario,
    custo: calcularCustoFuncionario({
      tipoContratacao: funcionario.tipo_contratacao,
      salarioBase: funcionario.salario_base,
      cargaHorariaSemanal: funcionario.carga_horaria_semanal,
      encargosPercentual: funcionario.encargos_percentual,
      beneficiosValor: funcionario.beneficios_valor,
    }),
  }));

  const totalFolhaAtiva = custosPorFuncionario
    .filter(({ funcionario }) => funcionario.ativo)
    .reduce((total, { custo }) => total + custo.custoMensalTotal, 0);
  const quantidadeAtivos = funcionarios.filter((f) => f.ativo).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Folha mensal estimada (ativos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-2xl font-semibold">{formatarMoeda(totalFolhaAtiva)}</Text>
            <Text tone="muted" size="sm">
              {quantidadeAtivos} funcionário(s) ativo(s)
            </Text>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Novo funcionário
        </Button>
      </div>

      {funcionarios.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum funcionário cadastrado"
          description="Cadastre a equipe para estimar o custo total de mão de obra."
          action={
            <Button size="sm" onClick={abrirCriacao}>
              <Plus className="h-4 w-4" />
              Novo funcionário
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Contratação</TableHead>
              <TableHead>Custo mensal</TableHead>
              <TableHead>Custo/hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {custosPorFuncionario.map(({ funcionario, custo }) => (
              <TableRow key={funcionario.id}>
                <TableCell className="text-foreground font-medium">{funcionario.nome}</TableCell>
                <TableCell className="text-muted-foreground">{funcionario.cargo ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {TIPO_LABEL[funcionario.tipo_contratacao] ?? funcionario.tipo_contratacao}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatarMoeda(custo.custoMensalTotal)}</TableCell>
                <TableCell className="text-muted-foreground">{formatarMoeda(custo.custoHora)}</TableCell>
                <TableCell>
                  <Badge variant={funcionario.ativo ? "success" : "outline"}>
                    {funcionario.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => abrirEdicao(funcionario)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternarAtivo(funcionario)}>
                      <Power className="h-4 w-4" />
                      <span className="sr-only">{funcionario.ativo ? "Desligar" : "Reativar"}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <FuncionarioDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        funcionario={funcionarioEmEdicao}
      />
    </div>
  );
}
