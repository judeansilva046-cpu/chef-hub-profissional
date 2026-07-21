"use server";

import { revalidatePath } from "next/cache";

import { obterProvider } from "@/integrations/registry";
import {
  IntegrationNotAvailableError,
  isProviderId,
  type IntegrationProviderId,
  PROVIDER_CATALOG,
} from "@/integrations/types";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requireOwner } from "@/server/auth/require-papel";

import { criptografarCredenciais, descriptografarCredenciais } from "./crypto";
import {
  medirOperacaoIntegracao,
  registrarEventoIntegracao,
  registrarFalhaIntegracao,
  registrarLogIntegracao,
} from "./monitoring";
import {
  credenciaisIntegracaoSchema,
  syncIntegracaoSchema,
} from "./validation";

export interface IntegracaoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidar() {
  revalidatePath("/integracoes");
}

function catalogCategory(provider: IntegrationProviderId) {
  return PROVIDER_CATALOG.find((p) => p.id === provider)!.category;
}

/**
 * Grava credenciais criptografadas + status pending.
 * Não chama API do provedor (homologação futura).
 */
export async function conectarIntegracao(
  _prevState: IntegracaoActionState | undefined,
  formData: FormData,
): Promise<IntegracaoActionState> {
  await requireOwner();
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = credenciaisIntegracaoSchema.safeParse({
    provedor: formData.get("provedor"),
    clientId: formData.get("clientId"),
    clientSecret: formData.get("clientSecret"),
    webhookSecret: formData.get("webhookSecret") || undefined,
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const provider = validated.data.provedor;
  let ciphertext: string;
  try {
    ciphertext = criptografarCredenciais(
      {
        clientId: validated.data.clientId,
        clientSecret: validated.data.clientSecret,
        ...(validated.data.webhookSecret
          ? { webhookSecret: validated.data.webhookSecret }
          : {}),
      },
      `${empresa.id}:${provider}`,
    );
  } catch {
    return {
      formError:
        "Não foi possível criptografar as credenciais (configure INTEGRACOES_SECRET_KEY).",
    };
  }

  const supabase = await createClient();
  const category = catalogCategory(provider);

  const { data: integration, error } = await supabase
    .from("integrations")
    .upsert(
      {
        empresa_id: empresa.id,
        provider,
        category,
        status: "pending",
        last_error: null,
        webhook_url: `/api/integrations/webhooks?provider=${provider}`,
      },
      { onConflict: "empresa_id,provider" },
    )
    .select("id")
    .single();

  if (error || !integration) {
    return { formError: "Não foi possível salvar a integração." };
  }

  const { error: credError } = await supabase
    .from("integration_credentials")
    .upsert(
      {
        integration_id: integration.id,
        empresa_id: empresa.id,
        ciphertext,
        key_version: 1,
      },
      { onConflict: "integration_id" },
    );

  if (credError) {
    return { formError: "Não foi possível salvar as credenciais criptografadas." };
  }

  // Dual-write legado Sprint 04 (só provedores do check constraint antigo)
  if (
    provider === "ifood" ||
    provider === "99food" ||
    provider === "keeta" ||
    provider === "open_delivery"
  ) {
    void supabase.from("integracoes_canais").upsert(
      {
        empresa_id: empresa.id,
        provedor: provider,
        credenciais_criptografadas: ciphertext,
        status_conexao: "pendente_homologacao",
      },
      { onConflict: "empresa_id,provedor" },
    );
  }

  await registrarEventoIntegracao({
    empresaId: empresa.id,
    integrationId: integration.id,
    eventType: "connect",
    payload: { provider },
  });
  await registrarLogIntegracao({
    empresaId: empresa.id,
    integrationId: integration.id,
    level: "INFO",
    eventType: "connect",
    message: `Credenciais salvas para ${provider} (pendente homologação).`,
  });

  revalidar();
  return { success: true };
}

export async function desconectarIntegracao(id: string) {
  await requireOwner();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: integration } = await supabase
    .from("integrations")
    .select("id, provider")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (!integration) throw new Error("Integração não encontrada.");

  await supabase
    .from("integration_credentials")
    .delete()
    .eq("integration_id", id)
    .eq("empresa_id", empresa.id);

  const { error } = await supabase
    .from("integrations")
    .update({
      status: "disabled",
      last_error: null,
      last_sync_at: null,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) throw new Error("Não foi possível desconectar.");

  if (
    integration.provider === "ifood" ||
    integration.provider === "99food" ||
    integration.provider === "keeta" ||
    integration.provider === "open_delivery"
  ) {
    void supabase
      .from("integracoes_canais")
      .update({
        status_conexao: "desconectado",
        credenciais_criptografadas: null,
        conectado_em: null,
      })
      .eq("empresa_id", empresa.id)
      .eq("provedor", integration.provider);
  }

  await registrarEventoIntegracao({
    empresaId: empresa.id,
    integrationId: id,
    eventType: "disconnect",
    payload: { provider: integration.provider },
  });

  revalidar();
}

export interface TesteConexaoResultado {
  sucesso: boolean;
  mensagem: string;
}

export async function testarConexaoIntegracao(
  id: string,
): Promise<TesteConexaoResultado> {
  await requireOwner();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error || !integration) throw new Error("Integração não encontrada.");
  if (!isProviderId(integration.provider)) {
    throw new Error("Provedor inválido.");
  }

  const { data: cred } = await supabase
    .from("integration_credentials")
    .select("ciphertext")
    .eq("integration_id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  let credentials: Record<string, string> = {};
  if (cred?.ciphertext) {
    try {
      credentials = descriptografarCredenciais(
        cred.ciphertext,
        `${empresa.id}:${integration.provider}`,
      );
    } catch {
      credentials = {};
    }
  }

  const provider = obterProvider(integration.provider);
  const t0 = Date.now();
  let mensagem: string;
  let sucesso = false;

  try {
    const { result, durationMs } = await medirOperacaoIntegracao(
      `test:${integration.provider}`,
      () =>
        provider.testarConexao({
          empresaId: empresa.id,
          integrationId: id,
          credentials,
          config: (integration.config ?? {}) as Record<string, unknown>,
        }),
    );
    mensagem = result.message;
    sucesso = result.success;
    await registrarLogIntegracao({
      empresaId: empresa.id,
      integrationId: id,
      level: sucesso ? "INFO" : "WARNING",
      eventType: "test_connection",
      message: mensagem,
      durationMs,
    });
  } catch (err) {
    const durationMs = Date.now() - t0;
    mensagem =
      err instanceof IntegrationNotAvailableError
        ? err.message
        : "Erro inesperado ao testar a conexão.";
    await registrarFalhaIntegracao({
      empresaId: empresa.id,
      integrationId: id,
      operation: "test_connection",
      errorMessage: mensagem,
      responseMs: durationMs,
      metadata: { provider: integration.provider },
    });
  }

  await supabase
    .from("integrations")
    .update({
      status: sucesso ? "online" : "error",
      last_test_at: new Date().toISOString(),
      last_error: sucesso ? null : mensagem,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  revalidar();
  return { sucesso, mensagem };
}

export async function sincronizarIntegracao(
  integrationId: string,
  syncType: "pedidos" | "produtos" = "pedidos",
): Promise<{ sucesso: boolean; mensagem: string; items?: number }> {
  await requireOwner();
  const empresa = await requireEmpresaAtual();

  const parsed = syncIntegracaoSchema.safeParse({ integrationId, syncType });
  if (!parsed.success) {
    return { sucesso: false, mensagem: "Parâmetros inválidos." };
  }

  const supabase = await createClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (!integration || !isProviderId(integration.provider)) {
    return { sucesso: false, mensagem: "Integração não encontrada." };
  }

  const { data: cred } = await supabase
    .from("integration_credentials")
    .select("ciphertext")
    .eq("integration_id", integrationId)
    .maybeSingle();

  if (!cred?.ciphertext) {
    return { sucesso: false, mensagem: "Sem credenciais configuradas." };
  }

  let credentials: Record<string, string>;
  try {
    credentials = descriptografarCredenciais(
      cred.ciphertext,
      `${empresa.id}:${integration.provider}`,
    );
  } catch {
    return { sucesso: false, mensagem: "Falha ao descriptografar credenciais." };
  }

  const { data: syncRow } = await supabase
    .from("integration_syncs")
    .insert({
      integration_id: integrationId,
      empresa_id: empresa.id,
      sync_type: syncType,
      status: "running",
    })
    .select("id")
    .single();

  const provider = obterProvider(integration.provider);
  const ctx = {
    empresaId: empresa.id,
    integrationId,
    credentials,
    config: (integration.config ?? {}) as Record<string, unknown>,
  };

  const t0 = Date.now();
  try {
    const { result, durationMs } = await medirOperacaoIntegracao(
      `sync:${syncType}:${integration.provider}`,
      async () => {
        if (syncType === "produtos") {
          const items = await provider.sincronizarProdutos(ctx);
          return items.length;
        }
        const items = await provider.sincronizarPedidos(ctx);
        return items.length;
      },
    );

    await supabase
      .from("integration_syncs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        items_count: result,
        duration_ms: durationMs,
      })
      .eq("id", syncRow!.id);

    await supabase
      .from("integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        status: "online",
        last_error: null,
      })
      .eq("id", integrationId);

    await registrarLogIntegracao({
      empresaId: empresa.id,
      integrationId,
      level: "INFO",
      eventType: `sync_${syncType}`,
      message: `Sincronização ${syncType}: ${result} item(ns)`,
      durationMs,
    });

    revalidar();
    return {
      sucesso: true,
      mensagem: `Sincronizados ${result} ${syncType}.`,
      items: result,
    };
  } catch (err) {
    const durationMs = Date.now() - t0;
    const mensagem =
      err instanceof IntegrationNotAvailableError
        ? err.message
        : "Falha na sincronização.";

    if (syncRow) {
      await supabase
        .from("integration_syncs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          error_message: mensagem,
          duration_ms: durationMs,
        })
        .eq("id", syncRow.id);
    }

    await supabase
      .from("integrations")
      .update({ status: "error", last_error: mensagem })
      .eq("id", integrationId);

    await registrarFalhaIntegracao({
      empresaId: empresa.id,
      integrationId,
      operation: `sync_${syncType}`,
      errorMessage: mensagem,
      responseMs: durationMs,
    });

    revalidar();
    return { sucesso: false, mensagem };
  }
}
