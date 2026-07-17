"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { FichaTecnicaParaSelecao } from "@/features/fichas-tecnicas/queries";

import { criarProducaoPlanejada } from "../actions";

interface NovaProducaoDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fichas: FichaTecnicaParaSelecao[];
  dataPadrao: string;
}

function NovaProducaoDialogContent({
  open,
  onOpenChange,
  fichas,
  dataPadrao,
}: NovaProducaoDialogContentProps) {
  const [state, formAction, pending] = useActionState(
    criarProducaoPlanejada,
    undefined,
  );
  const [quantidade, setQuantidade] = useState<number | null>(null);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova produção planejada</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fichaTecnicaId">Ficha técnica</Label>
            <Select
              id="fichaTecnicaId"
              name="fichaTecnicaId"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Selecionar...
              </option>
              {fichas.map((ficha) => (
                <option key={ficha.id} value={ficha.id}>
                  {ficha.nome}
                </option>
              ))}
            </Select>
            {state?.fieldErrors?.fichaTecnicaId && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.fichaTecnicaId[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataProducao">Data de produção</Label>
              <Input
                id="dataProducao"
                name="dataProducao"
                type="date"
                defaultValue={dataPadrao}
                required
              />
              {state?.fieldErrors?.dataProducao && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.dataProducao[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantidadePlanejada">Quantidade a produzir</Label>
              <NumberField
                id="quantidadePlanejada"
                name="quantidadePlanejada"
                value={quantidade}
                onChange={setQuantidade}
                min={0}
                placeholder="0"
              />
              {state?.fieldErrors?.quantidadePlanejada && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.quantidadePlanejada[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea id="observacao" name="observacao" rows={2} />
          </div>

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Planejar produção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface NovaProducaoButtonProps {
  fichas: FichaTecnicaParaSelecao[];
  dataPadrao: string;
}

export function NovaProducaoButton({
  fichas,
  dataPadrao,
}: NovaProducaoButtonProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
          setDialogKey((key) => key + 1);
        }}
      >
        <Plus className="h-4 w-4" />
        Nova produção
      </Button>

      <NovaProducaoDialogContent
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        fichas={fichas}
        dataPadrao={dataPadrao}
      />
    </>
  );
}
