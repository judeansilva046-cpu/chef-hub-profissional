"use client";

import type { ProvedorIntegracao } from "@/integrations/types";
import { PROVIDER_CATALOG } from "@/integrations/types";

import type { IntegracaoListagem } from "../queries";
import { IntegrationCard } from "./integration-card";

/** Compatibilidade com a UI Sprint 04 — delega ao IntegrationCard. */
export function IntegracaoCard({
  provedor,
  provedorLabel,
  integracao,
}: {
  provedor: ProvedorIntegracao;
  provedorLabel: string;
  integracao: IntegracaoListagem | null;
}) {
  const catalog = PROVIDER_CATALOG.find((p) => p.id === provedor) ?? {
    id: provedor,
    label: provedorLabel,
    category: "delivery" as const,
    description: "",
  };

  const integration = integracao
    ? {
        id: integracao.id,
        empresa_id: integracao.empresa_id,
        provider: String(integracao.provedor),
        category: catalog.category,
        status:
          integracao.status_conexao === "conectado"
            ? "online"
            : integracao.status_conexao === "pendente_homologacao"
              ? "pending"
              : integracao.status_conexao === "erro"
                ? "error"
                : integracao.status_conexao === "desconectado"
                  ? "disabled"
                  : "offline",
        config: {},
        webhook_url: null,
        last_sync_at: null,
        last_test_at: null,
        last_error: null,
        metadata: (integracao.metadata ?? {}) as Record<string, unknown>,
        created_at: integracao.criado_em,
        updated_at: integracao.atualizado_em,
        has_credentials: integracao.tem_credenciais,
      }
    : null;

  return <IntegrationCard catalog={catalog} integration={integration} />;
}
