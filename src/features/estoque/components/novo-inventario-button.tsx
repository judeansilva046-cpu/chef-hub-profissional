"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
import { Text } from "@/components/ui/text";

import { criarInventario } from "../actions";

export function NovoInventarioButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function criar() {
    setErro(null);
    startTransition(async () => {
      try {
        const id = await criarInventario(nome);
        setOpen(false);
        setNome("");
        router.push(`/estoque/inventarios/${id}`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível criar o inventário.",
        );
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo inventário
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo inventário</DialogTitle>
            <DialogDescription>
              O saldo atual de cada ingrediente ativo será capturado como
              referência do sistema para a contagem física.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inventario-nome">Nome</Label>
            <Input
              id="inventario-nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex: Contagem mensal — julho/2026"
            />
          </div>

          {erro && (
            <Text size="sm" tone="danger" className="mt-2">
              {erro}
            </Text>
          )}

          <DialogFooter>
            <Button onClick={criar} disabled={pending || !nome.trim()}>
              {pending ? "Criando..." : "Criar e iniciar contagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
