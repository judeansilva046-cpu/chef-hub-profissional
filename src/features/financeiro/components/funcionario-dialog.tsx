"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput, PercentInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarFuncionario, criarFuncionario } from "../actions";
import { calcularCustoFuncionario } from "../calculations";
import { TIPO_CONTRATACAO_OPCOES } from "../validation";

export interface FuncionarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario?: Tables<"funcionarios">;
}

export function FuncionarioDialog({ open, onOpenChange, funcionario }: FuncionarioDialogProps) {
  const action = funcionario ? atualizarFuncionario.bind(null, funcionario.id) : criarFuncionario;
  const [state, formAction, pending] = useActionState(action, undefined);

  const [tipoContratacao, setTipoContratacao] = useState(funcionario?.tipo_contratacao ?? "clt");
  const [salarioBase, setSalarioBase] = useState<number | null>(funcionario?.salario_base ?? null);
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState(
    funcionario?.carga_horaria_semanal?.toString() ?? "44",
  );
  const [encargosPercentual, setEncargosPercentual] = useState<number | null>(
    funcionario?.encargos_percentual ?? null,
  );
  const [beneficiosValor, setBeneficiosValor] = useState<number | null>(
    funcionario?.beneficios_valor ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const previa = calcularCustoFuncionario({
    tipoContratacao,
    salarioBase: salarioBase ?? 0,
    cargaHorariaSemanal: Number(cargaHorariaSemanal) || 0,
    encargosPercentual: encargosPercentual ?? 0,
    beneficiosValor: beneficiosValor ?? 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{funcionario ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
          <DialogDescription>
            Estimativa de custo total (salário + encargos + benefícios) para
            apoiar decisões de precificação — não é uma folha de pagamento
            com apuração fiscal linha a linha.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={funcionario?.nome} required />
              {state?.fieldErrors?.nome && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.nome[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cargo">Cargo (opcional)</Label>
              <Input id="cargo" name="cargo" defaultValue={funcionario?.cargo ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipoContratacao">Tipo de contratação</Label>
            <Select
              id="tipoContratacao"
              name="tipoContratacao"
              value={tipoContratacao}
              onChange={(event) => setTipoContratacao(event.target.value)}
            >
              {TIPO_CONTRATACAO_OPCOES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salarioBase">
                {tipoContratacao === "horista" ? "Valor da hora" : "Salário mensal"}
              </Label>
              <CurrencyInput
                id="salarioBase"
                name="salarioBase"
                value={salarioBase}
                onChange={setSalarioBase}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.salarioBase && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.salarioBase[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cargaHorariaSemanal">Carga horária semanal, horas</Label>
              <Input
                id="cargaHorariaSemanal"
                name="cargaHorariaSemanal"
                type="number"
                step="0.5"
                min="0.5"
                value={cargaHorariaSemanal}
                onChange={(event) => setCargaHorariaSemanal(event.target.value)}
              />
              {state?.fieldErrors?.cargaHorariaSemanal && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.cargaHorariaSemanal[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="encargosPercentual">Encargos, % (INSS/FGTS/13º/férias)</Label>
              <PercentInput
                id="encargosPercentual"
                name="encargosPercentual"
                value={encargosPercentual}
                onChange={setEncargosPercentual}
                min={0}
                placeholder="0%"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="beneficiosValor">Benefícios, R$/mês (VT, VR, plano...)</Label>
              <CurrencyInput
                id="beneficiosValor"
                name="beneficiosValor"
                value={beneficiosValor}
                onChange={setBeneficiosValor}
                min={0}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dataAdmissao">Data de admissão (opcional)</Label>
            <Input
              id="dataAdmissao"
              name="dataAdmissao"
              type="date"
              defaultValue={funcionario?.data_admissao ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} defaultValue={funcionario?.observacoes ?? ""} />
          </div>

          <div className="border-border bg-secondary/30 flex flex-col gap-1 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <Text tone="muted">Custo mensal total (estimado)</Text>
              <Text weight="semibold">{formatarMoeda(previa.custoMensalTotal)}</Text>
            </div>
            <div className="flex justify-between">
              <Text tone="muted">Custo por hora (estimado)</Text>
              <Text weight="semibold">{formatarMoeda(previa.custoHora)}</Text>
            </div>
          </div>

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
