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
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarMoeda } from "@/lib/format";

import type { FichaTecnicaParaFinanceiro } from "@/features/financeiro/queries";

import { atualizarVenda, criarVenda } from "../actions";
import type { VendaComRelacoes } from "../queries";

export interface VendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fichas: FichaTecnicaParaFinanceiro[];
  canais: Tables<"canais_venda">[];
  clientes: Tables<"clientes">[];
  venda?: VendaComRelacoes;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function VendaDialog({
  open,
  onOpenChange,
  fichas,
  canais,
  clientes,
  venda,
}: VendaDialogProps) {
  const action = venda ? atualizarVenda.bind(null, venda.id) : criarVenda;
  const [state, formAction, pending] = useActionState(action, undefined);

  const [fichaId, setFichaId] = useState<string | null>(
    venda?.ficha_tecnica_id ?? null,
  );
  const [canalId, setCanalId] = useState<string | null>(
    venda?.canal_venda_id ?? "",
  );
  const [clienteId, setClienteId] = useState<string | null>(
    venda?.cliente_id ?? "",
  );
  const [quantidade, setQuantidade] = useState<number | null>(
    () => venda?.quantidade ?? 1,
  );
  const [preco, setPreco] = useState<number | null>(
    () => venda?.preco_unitario_praticado ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const fichaSelecionada = fichas.find((item) => item.id === fichaId);

  function selecionarFicha(id: string) {
    setFichaId(id);
    if (!venda) {
      const ficha = fichas.find((item) => item.id === id);
      const precoPadrao = ficha?.preco_venda_praticado ?? ficha?.preco_sugerido;
      if (precoPadrao !== null && precoPadrao !== undefined) {
        setPreco(precoPadrao);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{venda ? "Editar venda" : "Registrar venda"}</DialogTitle>
          <DialogDescription>
            Alimenta o Dashboard, os Relatórios e o histórico de pedidos do
            cliente com dados reais (faturamento, CMV e margem realizados).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ficha técnica</Label>
            {venda ? (
              <>
                <Input value={fichaSelecionada?.nome ?? "—"} disabled readOnly />
                <input type="hidden" name="fichaTecnicaId" value={venda.ficha_tecnica_id} />
              </>
            ) : (
              <Combobox
                name="fichaTecnicaId"
                options={fichas.map((item) => ({
                  value: item.id,
                  label: item.nome,
                  description: formatarMoeda(
                    item.preco_venda_praticado ?? item.preco_sugerido ?? 0,
                  ),
                }))}
                value={fichaId}
                onValueChange={selecionarFicha}
                placeholder="Selecionar ficha técnica..."
                searchPlaceholder="Buscar ficha técnica..."
                emptyMessage="Nenhuma ficha técnica ativa encontrada."
              />
            )}
            {state?.fieldErrors?.fichaTecnicaId && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.fichaTecnicaId[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Canal de venda (opcional)</Label>
              <Combobox
                name="canalVendaId"
                options={[
                  { value: "", label: "Nenhum" },
                  ...canais.map((canal) => ({ value: canal.id, label: canal.nome })),
                ]}
                value={canalId}
                onValueChange={setCanalId}
                placeholder="Selecionar canal..."
                searchPlaceholder="Buscar canal..."
                emptyMessage="Nenhum canal cadastrado."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cliente (opcional)</Label>
              <Combobox
                name="clienteId"
                options={[
                  { value: "", label: "Nenhum" },
                  ...clientes.map((cliente) => ({
                    value: cliente.id,
                    label: cliente.nome,
                  })),
                ]}
                value={clienteId}
                onValueChange={setClienteId}
                placeholder="Selecionar cliente..."
                searchPlaceholder="Buscar cliente..."
                emptyMessage="Nenhum cliente cadastrado."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantidade">Quantidade</Label>
              <NumberField
                name="quantidade"
                value={quantidade}
                onChange={setQuantidade}
                min={0}
                placeholder="Ex: 1"
              />
              {state?.fieldErrors?.quantidade && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.quantidade[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precoUnitarioPraticado">Preço unitário</Label>
              <CurrencyInput
                name="precoUnitarioPraticado"
                value={preco}
                onChange={setPreco}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.precoUnitarioPraticado && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.precoUnitarioPraticado[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataVenda">Data da venda</Label>
              <Input
                id="dataVenda"
                name="dataVenda"
                type="date"
                defaultValue={venda?.data_venda ?? hoje()}
                required
              />
              {state?.fieldErrors?.dataVenda && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.dataVenda[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              name="observacao"
              rows={2}
              defaultValue={venda?.observacao ?? ""}
            />
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
