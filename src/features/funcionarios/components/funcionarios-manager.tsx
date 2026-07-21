"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput, NumberField, PercentInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import {
  atualizarFuncionario,
  criarFuncionario,
  excluirFuncionario,
} from "../actions";
import { calcularCustoHora, calcularCustoMensal } from "../calculations";
import { TIPOS_CONTRATO, TIPO_CONTRATO_LABEL, type TipoContrato } from "../types";

export interface FuncionariosManagerProps {
  funcionarios: Tables<"funcionarios">[];
}

function custosDoFuncionario(funcionario: Tables<"funcionarios">) {
  const { encargos, custoTotalMensal } = calcularCustoMensal({
    salarioBruto: funcionario.salario_bruto,
    beneficiosMensais: funcionario.beneficios_mensais,
    percentualEncargos: funcionario.percentual_encargos,
  });
  const custoHora = calcularCustoHora(
    custoTotalMensal,
    funcionario.carga_horaria_semanal,
  );
  return { encargos, custoTotalMensal, custoHora };
}

export function FuncionariosManager({ funcionarios }: FuncionariosManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState<
    Tables<"funcionarios"> | undefined
  >(undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const [excluindo, setExcluindo] = useState<Tables<"funcionarios"> | null>(
    null,
  );

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

  const totalAtivo = funcionarios
    .filter((funcionario) => funcionario.ativo)
    .reduce(
      (total, funcionario) =>
        total + custosDoFuncionario(funcionario).custoTotalMensal,
      0,
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text tone="muted">
          Custo total mensal (ativos):{" "}
          <Text as="span" weight="semibold" tone="default">
            {formatarMoeda(totalAtivo)}
          </Text>
        </Text>
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Novo funcionário
        </Button>
      </div>

      {funcionarios.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum funcionário cadastrado"
          description="Cadastre salários, benefícios e encargos para calcular o custo real por hora."
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
              <TableHead>Contrato</TableHead>
              <TableHead>Custo mensal</TableHead>
              <TableHead>Custo/hora</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funcionarios.map((funcionario) => {
              const custos = custosDoFuncionario(funcionario);
              const tipo = funcionario.tipo_contrato as TipoContrato;
              return (
                <TableRow key={funcionario.id}>
                  <TableCell className="text-foreground font-medium">
                    {funcionario.nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {funcionario.cargo ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {TIPO_CONTRATO_LABEL[tipo] ?? funcionario.tipo_contrato}
                  </TableCell>
                  <TableCell>{formatarMoeda(custos.custoTotalMensal)}</TableCell>
                  <TableCell>{formatarMoeda(custos.custoHora)}</TableCell>
                  <TableCell>
                    <Badge variant={funcionario.ativo ? "success" : "outline"}>
                      {funcionario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEdicao(funcionario)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExcluindo(funcionario)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <FuncionarioDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        funcionario={funcionarioEmEdicao}
      />

      <ConfirmDialog
        open={excluindo !== null}
        onOpenChange={(open) => {
          if (!open) setExcluindo(null);
        }}
        title="Excluir funcionário"
        description={
          excluindo
            ? `Excluir permanentemente "${excluindo.nome}"? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!excluindo) return;
          await excluirFuncionario(excluindo.id);
          setExcluindo(null);
        }}
      />
    </div>
  );
}

interface FuncionarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario?: Tables<"funcionarios">;
}

function FuncionarioDialog({
  open,
  onOpenChange,
  funcionario,
}: FuncionarioDialogProps) {
  const action = funcionario
    ? atualizarFuncionario.bind(null, funcionario.id)
    : criarFuncionario;
  const [state, formAction, pending] = useActionState(action, undefined);

  const [salarioBruto, setSalarioBruto] = useState<number | null>(
    () => funcionario?.salario_bruto ?? null,
  );
  const [beneficiosMensais, setBeneficiosMensais] = useState<number | null>(
    () => funcionario?.beneficios_mensais ?? 0,
  );
  const [percentualEncargos, setPercentualEncargos] = useState<number | null>(
    () => funcionario?.percentual_encargos ?? 36.8,
  );
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState<number | null>(
    () => funcionario?.carga_horaria_semanal ?? 44,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const preview =
    salarioBruto !== null &&
    beneficiosMensais !== null &&
    percentualEncargos !== null &&
    cargaHorariaSemanal !== null &&
    cargaHorariaSemanal > 0
      ? (() => {
          const mensal = calcularCustoMensal({
            salarioBruto,
            beneficiosMensais,
            percentualEncargos,
          });
          return {
            ...mensal,
            custoHora: calcularCustoHora(
              mensal.custoTotalMensal,
              cargaHorariaSemanal,
            ),
          };
        })()
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {funcionario ? "Editar funcionário" : "Novo funcionário"}
          </DialogTitle>
          <DialogDescription>
            Informe salário, benefícios e encargos para obter o custo mensal e
            o custo por hora de trabalho.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Maria Silva"
              defaultValue={funcionario?.nome}
              required
            />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                name="cargo"
                placeholder="Ex: Cozinheira"
                defaultValue={funcionario?.cargo ?? ""}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipoContrato">Tipo de contrato</Label>
              <Select
                id="tipoContrato"
                name="tipoContrato"
                defaultValue={funcionario?.tipo_contrato ?? "clt"}
              >
                {TIPOS_CONTRATO.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salarioBruto">Salário bruto</Label>
              <CurrencyInput
                name="salarioBruto"
                value={salarioBruto}
                onChange={setSalarioBruto}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.salarioBruto && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.salarioBruto[0]}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="beneficiosMensais">Benefícios mensais</Label>
              <CurrencyInput
                name="beneficiosMensais"
                value={beneficiosMensais}
                onChange={setBeneficiosMensais}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.beneficiosMensais && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.beneficiosMensais[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="percentualEncargos">Encargos (%)</Label>
              <PercentInput
                name="percentualEncargos"
                value={percentualEncargos}
                onChange={setPercentualEncargos}
                min={0}
                placeholder="36,8"
              />
              {state?.fieldErrors?.percentualEncargos && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.percentualEncargos[0]}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cargaHorariaSemanal">Carga semanal (h)</Label>
              <NumberField
                name="cargaHorariaSemanal"
                value={cargaHorariaSemanal}
                onChange={setCargaHorariaSemanal}
                kind="decimal"
                min={0.01}
                placeholder="44"
              />
              {state?.fieldErrors?.cargaHorariaSemanal && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.cargaHorariaSemanal[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              defaultValue={funcionario?.observacoes ?? ""}
              placeholder="Opcional"
            />
          </div>

          {preview && (
            <div className="bg-muted/40 flex flex-col gap-1 rounded-md px-3 py-2">
              <Text size="sm" tone="muted">
                Encargos: {formatarMoeda(preview.encargos)}
              </Text>
              <Text size="sm" weight="semibold">
                Custo mensal: {formatarMoeda(preview.custoTotalMensal)}
              </Text>
              <Text size="sm" tone="muted">
                Custo/hora: {formatarMoeda(preview.custoHora)}
              </Text>
            </div>
          )}

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
