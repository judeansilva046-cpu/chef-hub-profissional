"use client";

import { useState, useTransition } from "react";
import { Plug, RefreshCw, Unplug } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Text } from "@/components/ui/text";
import type { ProviderCatalogItem } from "@/integrations/types";
import { formatarDataHora } from "@/lib/format";

import {
  desconectarIntegracao,
  sincronizarIntegracao,
  testarConexaoIntegracao,
} from "../actions";
import type { IntegrationRow } from "../queries";
import { CredenciaisDialog } from "./credenciais-dialog";

const STATUS_UI: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "outline" }
> = {
  offline: { label: "Offline", variant: "outline" },
  pending: { label: "Pendente", variant: "warning" },
  online: { label: "Online", variant: "success" },
  error: { label: "Erro", variant: "danger" },
  disabled: { label: "Desconectado", variant: "outline" },
};

export function IntegrationCard({
  catalog,
  integration,
}: {
  catalog: ProviderCatalogItem;
  integration: IntegrationRow | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const status = STATUS_UI[integration?.status ?? "offline"];

  function run(fn: () => Promise<{ sucesso?: boolean; mensagem?: string } | void>) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result && "mensagem" in result && result.mensagem) {
          window.alert(result.mensagem);
        }
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Erro na operação.",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{catalog.label}</CardTitle>
          <Text tone="muted" size="sm" className="mt-1">
            {catalog.description}
          </Text>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Text tone="muted" size="sm">
          {integration?.has_credentials
            ? "Credenciais criptografadas configuradas."
            : "Nenhuma credencial configurada."}
        </Text>
        {integration?.last_sync_at ? (
          <Text tone="muted" size="sm">
            Último sync: {formatarDataHora(integration.last_sync_at)}
          </Text>
        ) : null}
        {integration?.last_error ? (
          <Text tone="danger" size="sm">
            {integration.last_error}
          </Text>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plug className="h-4 w-4" />
            {integration?.has_credentials ? "Atualizar" : "Conectar"}
          </Button>
          {integration?.has_credentials ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  run(() =>
                    testarConexaoIntegracao(integration.id).then((r) => ({
                      sucesso: r.sucesso,
                      mensagem: r.mensagem,
                    })),
                  )
                }
              >
                Testar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  run(() => sincronizarIntegracao(integration.id, "pedidos"))
                }
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setConfirmDisconnect(true)}
              >
                <Unplug className="h-4 w-4" />
                Desconectar
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>

      <CredenciaisDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provedor={catalog.id}
        provedorLabel={catalog.label}
      />

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title={`Desconectar ${catalog.label}`}
        description="As credenciais criptografadas serão removidas."
        confirmLabel="Desconectar"
        destructive
        onConfirm={async () => {
          if (!integration) return;
          await desconectarIntegracao(integration.id);
        }}
      />
    </Card>
  );
}
