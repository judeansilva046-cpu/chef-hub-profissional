"use client";

import { useTransition } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarMoeda } from "@/lib/format";

import { converterLead, marcarLeadPerdido, moverLeadEtapa, reabrirLead } from "../actions";

export interface FunilBoardProps {
  etapas: Tables<"crm_funil_etapas">[];
  leads: Tables<"crm_leads">[];
  empresaId: string;
}

export function FunilBoard({ etapas, leads, empresaId }: FunilBoardProps) {
  useRealtimeRefresh(["crm_leads"], empresaId);
  const [pending, startTransition] = useTransition();

  function mover(leadId: string, etapaId: string) {
    startTransition(() => moverLeadEtapa(leadId, etapaId));
  }

  function converter(leadId: string) {
    startTransition(async () => {
      try {
        await converterLead(leadId);
        window.alert("Lead convertido em cliente.");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível converter.");
      }
    });
  }

  function marcarPerdido(leadId: string) {
    const motivo = window.prompt("Motivo da perda (opcional):") ?? "";
    startTransition(() => marcarLeadPerdido(leadId, motivo));
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {etapas.map((etapa) => {
        const leadsDaEtapa = leads.filter((lead) => lead.etapa_id === etapa.id);
        const valorTotal = leadsDaEtapa.reduce((total, lead) => total + lead.valor_estimado, 0);

        return (
          <div key={etapa.id} className="flex w-72 shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: etapa.cor }} />
                <Text weight="semibold" size="sm">
                  {etapa.nome}
                </Text>
                <Badge variant="outline">{leadsDaEtapa.length}</Badge>
              </div>
            </div>
            <Text size="sm" tone="muted">
              {formatarMoeda(valorTotal)}
            </Text>

            <div className="flex flex-col gap-2">
              {leadsDaEtapa.map((lead) => (
                <div key={lead.id} className="border-border bg-card rounded-lg border p-3">
                  <Text weight="medium" size="sm">
                    {lead.nome}
                  </Text>
                  <Text size="sm" tone="muted">
                    {formatarMoeda(lead.valor_estimado)} · {lead.probabilidade}%
                  </Text>
                  {lead.proxima_acao && (
                    <Text size="sm" tone="muted">
                      Próxima ação: {lead.proxima_acao}
                    </Text>
                  )}
                  {lead.status === "perdido" && <Badge variant="danger">Perdido</Badge>}

                  <div className="mt-2 flex flex-col gap-1.5">
                    <Select
                      value={lead.etapa_id}
                      disabled={pending || lead.status !== "aberto"}
                      onChange={(e) => mover(lead.id, e.target.value)}
                    >
                      {etapas.map((opcao) => (
                        <option key={opcao.id} value={opcao.id}>
                          {opcao.nome}
                        </option>
                      ))}
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {lead.status === "aberto" && (
                        <>
                          <Button size="sm" variant="outline" disabled={pending} onClick={() => converter(lead.id)}>
                            Converter
                          </Button>
                          <Button size="sm" variant="ghost" disabled={pending} onClick={() => marcarPerdido(lead.id)}>
                            Perdido
                          </Button>
                        </>
                      )}
                      {lead.status === "perdido" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => startTransition(() => reabrirLead(lead.id))}
                        >
                          Reabrir
                        </Button>
                      )}
                      {lead.cliente_id && (
                        <Link href={`/clientes/${lead.cliente_id}`} className="text-primary self-center text-xs hover:underline">
                          Ver cliente
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
