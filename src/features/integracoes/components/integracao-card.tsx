"use client";

import { useState, useTransition } from "react";
import { Plug, Unplug } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import type { ProvedorIntegracao } from "@/integrations/types";

import { desconectarIntegracao, testarConexaoIntegracao } from "../actions";
import { CredenciaisDialog } from "./credenciais-dialog";

export interface IntegracaoCardProps {
  provedor: ProvedorIntegracao;
  provedorLabel: string;
  integracao: Tables<"integracoes_canais"> | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "outline" }
> = {
  nao_configurado: { label: "Não configurado", variant: "outline" },
  pendente_homologacao: { label: "Pendente de homologação", variant: "warning" },
  conectado: { label: "Conectado", variant: "success" },
  erro: { label: "Erro", variant: "danger" },
  desconectado: { label: "Desconectado", variant: "outline" },
};

export function IntegracaoCard({ provedor, provedorLabel, integracao }: IntegracaoCardProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  const status = STATUS_CONFIG[integracao?.status_conexao ?? "nao_configurado"];

  function testar() {
    if (!integracao) return;
    startTransition(async () => {
      try {
        const resultado = await testarConexaoIntegracao(integracao.id);
        window.alert(resultado.mensagem);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Erro ao testar a conexão.");
      }
    });
  }

  function desconectar() {
    if (!integracao) return;
    if (!window.confirm(`Desconectar ${provedorLabel}? As credenciais salvas serão removidas.`)) {
      return;
    }
    startTransition(async () => {
      try {
        await desconectarIntegracao(integracao.id);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível desconectar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{provedorLabel}</CardTitle>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Text tone="muted" size="sm">
          {integracao?.credenciais_criptografadas
            ? "Credenciais configuradas."
            : "Nenhuma credencial configurada."}
        </Text>
        {integracao?.conectado_em && (
          <Text tone="muted" size="sm">
            Conectado em {formatarDataHora(integracao.conectado_em)}
          </Text>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setDialogAberto(true)}>
            <Plug className="h-4 w-4" />
            {integracao?.credenciais_criptografadas ? "Atualizar credenciais" : "Conectar"}
          </Button>
          {integracao?.credenciais_criptografadas && (
            <>
              <Button size="sm" variant="ghost" disabled={pending} onClick={testar}>
                Testar conexão
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={desconectar}>
                <Unplug className="h-4 w-4" />
                Desconectar
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <CredenciaisDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        provedor={provedor}
        provedorLabel={provedorLabel}
      />
    </Card>
  );
}
