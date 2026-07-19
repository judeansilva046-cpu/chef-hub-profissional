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
import { CurrencyInput } from "@/components/ui/number-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarNivelAprovacao } from "../actions";
import type { AprovadorDisponivel, NivelAprovacaoComCentroCusto } from "../queries";

export interface NivelAprovacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nivel?: NivelAprovacaoComCentroCusto;
  centrosCusto: Tables<"centros_custo">[];
  aprovadores: AprovadorDisponivel[];
}

type TipoAprovador = "aprovador" | "owner" | "usuario";

export function NivelAprovacaoDialog({
  open,
  onOpenChange,
  nivel,
  centrosCusto,
  aprovadores,
}: NivelAprovacaoDialogProps) {
  const action = salvarNivelAprovacao.bind(null, nivel?.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [valorMinimo, setValorMinimo] = useState<number | null>(nivel?.valor_minimo ?? 0);
  const [valorMaximo, setValorMaximo] = useState<number | null>(nivel?.valor_maximo ?? null);
  const [tipo, setTipo] = useState<TipoAprovador>(
    nivel?.usuario_aprovador_id ? "usuario" : nivel?.papel_aprovador === "owner" ? "owner" : "aprovador",
  );
  const [usuarioAprovadorId, setUsuarioAprovadorId] = useState(nivel?.usuario_aprovador_id ?? "");

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{nivel ? "Editar faixa de aprovação" : "Nova faixa de aprovação"}</DialogTitle>
          <DialogDescription>
            Define quem precisa aprovar uma solicitação de compra dentro de uma
            faixa de valor. Sem nenhuma faixa cadastrada, qualquer usuário com
            papel &quot;aprovador&quot; (ou o dono) pode decidir.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Ex: Compras acima de R$ 1.000" defaultValue={nivel?.nome} required />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorMinimo">Valor mínimo</Label>
              <CurrencyInput id="valorMinimo" name="valorMinimo" value={valorMinimo} onChange={setValorMinimo} min={0} placeholder="R$ 0,00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorMaximo">Valor máximo (opcional)</Label>
              <CurrencyInput id="valorMaximo" name="valorMaximo" value={valorMaximo} onChange={setValorMaximo} min={0} placeholder="Sem limite" />
              {state?.fieldErrors?.valorMaximo && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.valorMaximo[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="centroCustoId">Restringir a um centro de custo (opcional)</Label>
            <Select id="centroCustoId" name="centroCustoId" defaultValue={nivel?.centro_custo_id ?? ""}>
              <option value="">Qualquer centro de custo</option>
              {centrosCusto.map((centro) => (
                <option key={centro.id} value={centro.id}>
                  {centro.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Quem aprova</Label>
            <Select
              id="tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoAprovador)}
            >
              <option value="aprovador">Qualquer usuário com papel &quot;aprovador&quot;</option>
              <option value="owner">Somente o dono da empresa</option>
              <option value="usuario">Um usuário específico</option>
            </Select>
            <input type="hidden" name="papelAprovador" value={tipo === "usuario" ? "" : tipo} />

            {tipo === "usuario" && (
              <>
                <Select
                  name="usuarioAprovadorId"
                  value={usuarioAprovadorId}
                  onChange={(event) => setUsuarioAprovadorId(event.target.value)}
                  className="mt-1.5"
                >
                  <option value="" disabled>
                    Selecionar usuário...
                  </option>
                  {aprovadores.map((aprovador) => (
                    <option key={aprovador.usuarioId} value={aprovador.usuarioId}>
                      {aprovador.nome}
                    </option>
                  ))}
                </Select>
                {state?.fieldErrors?.papelAprovador && (
                  <Text size="sm" tone="danger">
                    {state.fieldErrors.papelAprovador[0]}
                  </Text>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ordem">Ordem de avaliação</Label>
            <Input id="ordem" name="ordem" type="number" step="1" defaultValue={nivel?.ordem ?? 0} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativo" defaultChecked={nivel?.ativo ?? true} />
            Faixa ativa
          </label>

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
