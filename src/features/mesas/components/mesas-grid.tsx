"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { Text } from "@/components/ui/text";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Tables } from "@/lib/supabase/database.types";

import { criarMesa } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  livre: "Livre",
  ocupada: "Ocupada",
  reservada: "Reservada",
  fechando: "Fechando",
};

const STATUS_VARIANT: Record<string, "outline" | "success" | "warning" | "danger"> = {
  livre: "success",
  ocupada: "danger",
  reservada: "warning",
  fechando: "outline",
};

export interface MesasGridProps {
  mesas: Tables<"mesas">[];
  empresaId: string;
}

export function MesasGrid({ mesas, empresaId }: MesasGridProps) {
  useRealtimeRefresh(["mesas", "comandas"], empresaId);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [identificador, setIdentificador] = useState("");
  const [capacidade, setCapacidade] = useState<number | null>(null);

  function criar() {
    setErro(null);
    startTransition(async () => {
      try {
        await criarMesa({ identificador, capacidade });
        setOpen(false);
        setIdentificador("");
        setCapacidade(null);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível criar a mesa.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova mesa
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {mesas.map((mesa) => (
          <Link
            key={mesa.id}
            href={`/mesas/${mesa.id}`}
            className="border-border hover:bg-secondary flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors"
          >
            <Text weight="semibold">{mesa.identificador}</Text>
            {mesa.capacidade && (
              <Text size="sm" tone="muted">
                {mesa.capacidade} lugares
              </Text>
            )}
            <Badge variant={STATUS_VARIANT[mesa.status] ?? "outline"}>{STATUS_LABEL[mesa.status] ?? mesa.status}</Badge>
          </Link>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova mesa</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="identificador">Identificador</Label>
              <Input
                id="identificador"
                placeholder="Ex: Mesa 5"
                value={identificador}
                onChange={(event) => setIdentificador(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Capacidade (opcional)</Label>
              <NumberField value={capacidade} onChange={setCapacidade} min={1} placeholder="Ex: 4" />
            </div>
            {erro && (
              <Text size="sm" tone="danger">
                {erro}
              </Text>
            )}
          </div>
          <DialogFooter>
            <Button disabled={pending || !identificador.trim()} onClick={criar}>
              Criar mesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
