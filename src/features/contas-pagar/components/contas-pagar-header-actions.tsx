"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

import { gerarContasPagarDoMes } from "../actions";
import { NovaContaPagarDialog } from "./nova-conta-pagar-dialog";

export interface ContasPagarHeaderActionsProps {
  fornecedores: Tables<"fornecedores">[];
  planoContas: Tables<"plano_contas">[];
  centrosCusto: Tables<"centros_custo">[];
}

function mesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ContasPagarHeaderActions({ fornecedores, planoContas, centrosCusto }: ContasPagarHeaderActionsProps) {
  const router = useRouter();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  function gerarDoMes() {
    setMensagem(null);
    startTransition(async () => {
      try {
        const quantidade = await gerarContasPagarDoMes(mesAtual());
        setMensagem(
          quantidade > 0
            ? `${quantidade} conta(s) gerada(s) a partir dos custos fixos do mês.`
            : "Nenhuma conta nova — os custos fixos deste mês já foram gerados.",
        );
        router.refresh();
      } catch (error) {
        setMensagem(error instanceof Error ? error.message : "Não foi possível gerar as contas do mês.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={gerarDoMes}>
          <Sparkles className="h-4 w-4" />
          Gerar do mês (custos fixos)
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setDialogAberto(true);
            setDialogKey((key) => key + 1);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova conta
        </Button>
      </div>
      {mensagem && <p className="text-muted-foreground text-sm">{mensagem}</p>}

      <NovaContaPagarDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        fornecedores={fornecedores}
        planoContas={planoContas}
        centrosCusto={centrosCusto}
      />
    </div>
  );
}
