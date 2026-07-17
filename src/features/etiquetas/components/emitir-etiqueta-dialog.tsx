"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { formatarData } from "@/lib/format";

import { emitirEtiqueta } from "../actions";
import type { LoteParaEtiqueta } from "../queries";
import { TAMANHO_ETIQUETA_OPCOES } from "../validation";
import { EtiquetaPreview } from "./etiqueta-preview";

export interface EmitirEtiquetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotes: LoteParaEtiqueta[];
}

export function EmitirEtiquetaDialog({ open, onOpenChange, lotes }: EmitirEtiquetaDialogProps) {
  const [state, formAction, pending] = useActionState(emitirEtiqueta, undefined);
  const [loteId, setLoteId] = useState<string | null>(null);
  const [tamanho, setTamanho] = useState<"50x30" | "60x40">("50x30");
  const [quantidade, setQuantidade] = useState<number | null>(1);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const lote = lotes.find((item) => item.id === loteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emitir etiqueta de validade</DialogTitle>
          <DialogDescription>
            Gera o registro histórico e envia o trabalho para a fila de
            impressão — o agente local processa quando estiver conectado.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Lote</Label>
            <Combobox
              name="loteId"
              options={lotes.map((item) => ({
                value: item.id,
                label: item.ingredientes.nome,
                description: `Lote ${item.numero_lote ?? "—"} · Validade ${
                  item.data_validade ? formatarData(item.data_validade) : "—"
                }`,
              }))}
              value={loteId}
              onValueChange={setLoteId}
              placeholder="Selecionar lote..."
              searchPlaceholder="Buscar ingrediente..."
              emptyMessage="Nenhum lote ativo encontrado."
            />
            {state?.fieldErrors?.loteId && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.loteId[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tamanho">Tamanho</Label>
              <Select
                id="tamanho"
                name="tamanho"
                value={tamanho}
                onChange={(event) => setTamanho(event.target.value as "50x30" | "60x40")}
              >
                {TAMANHO_ETIQUETA_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantidadeEtiquetas">Quantidade de etiquetas</Label>
              <NumberField
                name="quantidadeEtiquetas"
                value={quantidade}
                onChange={setQuantidade}
                min={1}
                placeholder="Ex: 1"
              />
              {state?.fieldErrors?.quantidadeEtiquetas && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.quantidadeEtiquetas[0]}
                </Text>
              )}
            </div>
          </div>

          <EtiquetaPreview
            produto={lote?.ingredientes.nome ?? ""}
            loteNumero={lote?.numero_lote ?? null}
            dataValidade={lote?.data_validade ?? null}
            tamanho={tamanho}
          />

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || !loteId}>
              {pending ? "Emitindo..." : "Emitir e enviar para impressão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
