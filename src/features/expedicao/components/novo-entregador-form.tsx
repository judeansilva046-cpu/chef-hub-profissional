"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Text } from "@/components/ui/text";

import { criarEntregador } from "../actions";

export function NovoEntregadorForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [veiculo, setVeiculo] = useState("");

  function salvar() {
    setErro(null);
    startTransition(async () => {
      try {
        await criarEntregador({ nome, telefone, veiculo });
        setOpen(false);
        setNome("");
        setTelefone("");
        setVeiculo("");
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível cadastrar.");
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo entregador
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo entregador</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome-entregador">Nome</Label>
              <Input id="nome-entregador" value={nome} onChange={(event) => setNome(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefone-entregador">Telefone (opcional)</Label>
              <Input id="telefone-entregador" value={telefone} onChange={(event) => setTelefone(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="veiculo-entregador">Veículo (opcional)</Label>
              <Input id="veiculo-entregador" value={veiculo} onChange={(event) => setVeiculo(event.target.value)} />
            </div>
            {erro && (
              <Text size="sm" tone="danger">
                {erro}
              </Text>
            )}
          </div>
          <DialogFooter>
            <Button disabled={pending || !nome.trim()} onClick={salvar}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
