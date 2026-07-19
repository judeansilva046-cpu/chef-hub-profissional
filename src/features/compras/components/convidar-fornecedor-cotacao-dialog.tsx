"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { convidarFornecedorCotacao } from "../actions";

export interface ConvidarFornecedorCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacaoId: string;
  fornecedoresDisponiveis: Tables<"fornecedores">[];
}

export function ConvidarFornecedorCotacaoDialog({
  open,
  onOpenChange,
  cotacaoId,
  fornecedoresDisponiveis,
}: ConvidarFornecedorCotacaoDialogProps) {
  const router = useRouter();
  const [fornecedorId, setFornecedorId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function convidar() {
    if (!fornecedorId) return;
    setErro(null);
    startTransition(async () => {
      try {
        await convidarFornecedorCotacao(cotacaoId, fornecedorId);
        setFornecedorId("");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível convidar o fornecedor.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar fornecedor</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fornecedorId">Fornecedor</Label>
          <Select id="fornecedorId" value={fornecedorId} onChange={(event) => setFornecedorId(event.target.value)}>
            <option value="" disabled>
              Selecionar...
            </option>
            {fornecedoresDisponiveis.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
              </option>
            ))}
          </Select>
        </div>

        {erro && (
          <Text size="sm" tone="danger">
            {erro}
          </Text>
        )}

        <DialogFooter>
          <Button onClick={convidar} disabled={pending || !fornecedorId}>
            {pending ? "Convidando..." : "Convidar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
