"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

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

import { gerarListaCompras } from "../actions";

export function NovaListaButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function gerar() {
    setErro(null);
    startTransition(async () => {
      try {
        const id = await gerarListaCompras({ nome, dataInicio, dataFim });
        setOpen(false);
        setNome("");
        setDataInicio("");
        setDataFim("");
        router.push(`/lista-compras/${id}`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível gerar a lista.",
        );
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Gerar lista inteligente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar lista inteligente de compras</DialogTitle>
            <DialogDescription>
              Soma o consumo previsto das produções planejadas no período,
              mais a reposição de ingredientes já abaixo do estoque mínimo, e
              sugere o fornecedor de menor preço para cada item.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lista-nome">Nome</Label>
              <Input
                id="lista-nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex: Compras da semana — 20 a 26/07"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lista-dataInicio">Período — início</Label>
                <Input
                  id="lista-dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lista-dataFim">Período — fim</Label>
                <Input
                  id="lista-dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                />
              </div>
            </div>
          </div>

          {erro && (
            <Text size="sm" tone="danger" className="mt-2">
              {erro}
            </Text>
          )}

          <DialogFooter>
            <Button
              onClick={gerar}
              disabled={pending || !nome.trim() || !dataInicio || !dataFim}
            >
              {pending ? "Gerando..." : "Gerar lista"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
