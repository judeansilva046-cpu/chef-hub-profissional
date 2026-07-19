"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { atualizarCupom, criarCupom } from "../actions";
import type { CupomComRelacoes } from "../queries";

export interface CupomDialogProps {
  cupom?: CupomComRelacoes;
  fichasTecnicas: { id: string; nome: string }[];
  canaisVenda: { id: string; nome: string }[];
  trigger: React.ReactNode;
}

export function CupomDialog({ cupom, fichasTecnicas, canaisVenda, trigger }: CupomDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <CupomDialogForm
        cupom={cupom}
        fichasTecnicas={fichasTecnicas}
        canaisVenda={canaisVenda}
        onSaved={() => setOpen(false)}
      />
    </Dialog>
  );
}

function CupomDialogForm({
  cupom,
  fichasTecnicas,
  canaisVenda,
  onSaved,
}: Omit<CupomDialogProps, "trigger"> & { onSaved: () => void }) {
  const action = cupom ? atualizarCupom.bind(null, cupom.id) : criarCupom;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [tipo, setTipo] = useState(cupom?.tipo ?? "percentual");

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{cupom ? "Editar cupom" : "Novo cupom"}</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" defaultValue={cupom?.codigo ?? ""} required className="uppercase" />
            {state?.fieldErrors?.codigo && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.codigo[0]}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <Select id="tipo" name="tipo" defaultValue={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="percentual">Percentual</option>
              <option value="fixo">Valor fixo</option>
              <option value="frete_gratis">Frete grátis</option>
              <option value="produto_gratis">Produto grátis</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Textarea id="descricao" name="descricao" rows={2} defaultValue={cupom?.descricao ?? ""} />
        </div>

        {(tipo === "percentual" || tipo === "fixo") && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valor">{tipo === "percentual" ? "Percentual (%)" : "Valor (R$)"}</Label>
            <Input id="valor" name="valor" type="number" step="0.01" min="0" defaultValue={cupom?.valor ?? 0} />
          </div>
        )}

        {tipo === "produto_gratis" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fichaTecnicaGratisId">Produto concedido</Label>
            <Select id="fichaTecnicaGratisId" name="fichaTecnicaGratisId" defaultValue={cupom?.ficha_tecnica_gratis_id ?? ""}>
              <option value="">Selecione...</option>
              {fichasTecnicas.map((ficha) => (
                <option key={ficha.id} value={ficha.id}>
                  {ficha.nome}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compraMinima">Compra mínima (R$)</Label>
            <Input id="compraMinima" name="compraMinima" type="number" step="0.01" min="0" defaultValue={cupom?.compra_minima ?? 0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limiteUsoPorCliente">Limite de uso por cliente</Label>
            <Input
              id="limiteUsoPorCliente"
              name="limiteUsoPorCliente"
              type="number"
              step="1"
              min="1"
              defaultValue={cupom?.limite_uso_por_cliente ?? 1}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limiteUsoTotal">Limite total de usos (opcional)</Label>
            <Input id="limiteUsoTotal" name="limiteUsoTotal" type="number" step="1" min="1" defaultValue={cupom?.limite_uso_total ?? ""} placeholder="Sem limite" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="canalVendaId">Canal permitido (opcional)</Label>
            <Select id="canalVendaId" name="canalVendaId" defaultValue={cupom?.canal_venda_id ?? ""}>
              <option value="">Todos os canais</option>
              {canaisVenda.map((canal) => (
                <option key={canal.id} value={canal.id}>
                  {canal.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="validoDe">Válido de (opcional)</Label>
            <Input id="validoDe" name="validoDe" type="date" defaultValue={cupom?.valido_de ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="validoAte">Válido até (opcional)</Label>
            <Input id="validoAte" name="validoAte" type="date" defaultValue={cupom?.valido_ate ?? ""} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="segmento">Segmento permitido (opcional)</Label>
          <Input id="segmento" name="segmento" placeholder="Ex: VIP" defaultValue={cupom?.segmento ?? ""} />
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
  );
}
