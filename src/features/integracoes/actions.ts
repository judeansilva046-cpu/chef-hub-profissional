"use server";

import { revalidatePath } from "next/cache";

import { obterAdapter } from "@/integrations/registry";
import { IntegracaoNaoDisponivelError } from "@/integrations/types";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import { criptografarCredenciais } from "./crypto";
import { credenciaisIntegracaoSchema } from "./validation";

export interface IntegracaoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

/**
 * Grava as credenciais criptografadas e marca `pendente_homologacao` —
 * NÃO chama nenhuma API do provedor aqui (não há endpoint real para
 * validar contra). "Conectado" só passa a significar algo quando um
 * adapter real existir.
 */
export async function conectarIntegracao(
  _prevState: IntegracaoActionState | undefined,
  formData: FormData,
): Promise<IntegracaoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = credenciaisIntegracaoSchema.safeParse({
    provedor: formData.get("provedor"),
    clientId: formData.get("clientId"),
    clientSecret: formData.get("clientSecret"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  let credenciaisCriptografadas: string;
  try {
    credenciaisCriptografadas = criptografarCredenciais(
      {
        clientId: validated.data.clientId,
        clientSecret: validated.data.clientSecret,
      },
      `${empresa.id}:${validated.data.provedor}`,
    );
  } catch {
    return { formError: "Não foi possível criptografar as credenciais (configuração do servidor)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("integracoes_canais").upsert(
    {
      empresa_id: empresa.id,
      provedor: validated.data.provedor,
      credenciais_criptografadas: credenciaisCriptografadas,
      status_conexao: "pendente_homologacao",
    },
    { onConflict: "empresa_id,provedor" },
  );

  if (error) {
    return { formError: "Não foi possível salvar as credenciais." };
  }

  revalidatePath("/integracoes");
  return { success: true };
}

export async function desconectarIntegracao(id: string) {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("integracoes_canais")
    .update({
      status_conexao: "desconectado",
      credenciais_criptografadas: null,
      conectado_em: null,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível desconectar.");
  }

  revalidatePath("/integracoes");
}

export interface TesteConexaoResultado {
  sucesso: boolean;
  mensagem: string;
}

/**
 * Sempre falha hoje (nenhum adapter tem API real) — o objetivo é registrar
 * o log de tentativa e devolver a mensagem clara de "requer homologação",
 * não fingir sucesso.
 */
export async function testarConexaoIntegracao(id: string): Promise<TesteConexaoResultado> {
  const empresa = await requireEmpresaAtual();

  const supabase = await createClient();
  const { data: integracao, error: buscaError } = await supabase
    .from("integracoes_canais")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (buscaError || !integracao) throw new Error("Integração não encontrada.");

  const adapter = obterAdapter(integracao.provedor as never);

  let mensagem: string;
  let status: "sucesso" | "erro" = "erro";
  try {
    const resultado = await adapter.testarConexao({});
    mensagem = resultado.mensagem;
    status = resultado.sucesso ? "sucesso" : "erro";
  } catch (error) {
    mensagem =
      error instanceof IntegracaoNaoDisponivelError
        ? error.message
        : "Erro inesperado ao testar a conexão.";
  }

  await supabase.from("integracoes_logs_sincronizacao").insert({
    integracao_id: id,
    empresa_id: empresa.id,
    tipo_evento: "teste_conexao",
    status,
    mensagem,
  });

  if (status === "erro") {
    await supabase
      .from("integracoes_canais")
      .update({ status_conexao: "erro" })
      .eq("id", id)
      .eq("empresa_id", empresa.id);
  }

  revalidatePath("/integracoes");
  return { sucesso: status === "sucesso", mensagem };
}
