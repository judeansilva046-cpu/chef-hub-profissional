"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { campanhaSchema, interacaoSchema, templateSchema } from "./validation";

export interface ComunicacaoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseTemplateForm(formData: FormData) {
  return templateSchema.safeParse({
    nome: formData.get("nome"),
    canal: formData.get("canal"),
    assunto: formData.get("assunto"),
    conteudo: formData.get("conteudo"),
  });
}

export async function criarTemplate(
  _prevState: ComunicacaoActionState | undefined,
  formData: FormData,
): Promise<ComunicacaoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseTemplateForm(formData);
  if (!validated.success) return { fieldErrors: validated.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_templates_mensagem").insert({
    empresa_id: empresa.id,
    ...validated.data,
  });

  if (error) return { formError: "Não foi possível salvar o template." };

  revalidatePath("/crm/comunicacao");
  return { success: true };
}

export async function alternarAtivoTemplate(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_templates_mensagem").update({ ativo }).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar o template.");
  revalidatePath("/crm/comunicacao");
}

export async function registrarInteracao(input: {
  clienteId: string;
  canal: string;
  tipo: string;
  assunto?: string;
  conteudo?: string;
}) {
  const validated = interacaoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase.from("crm_interacoes").insert({
    empresa_id: empresa.id,
    cliente_id: validated.data.clienteId,
    canal: validated.data.canal,
    tipo: validated.data.tipo,
    assunto: validated.data.assunto,
    conteudo: validated.data.conteudo,
    status_entrega: "enviado",
    reclamacao_resolvida: validated.data.tipo === "reclamacao" ? false : null,
  });

  if (error) throw new Error("Não foi possível registrar a interação.");

  revalidatePath(`/clientes/${validated.data.clienteId}`);
  revalidatePath("/crm/comunicacao");
}

export async function marcarReclamacaoResolvida(id: string, resolvida: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_interacoes")
    .update({ reclamacao_resolvida: resolvida })
    .eq("id", id);

  if (error) throw new Error("Não foi possível atualizar a reclamação.");
  revalidatePath("/crm/comunicacao");
}

function parseCampanhaForm(formData: FormData) {
  return campanhaSchema.safeParse({
    nome: formData.get("nome"),
    gatilho: formData.get("gatilho"),
    diasInatividade: formData.get("diasInatividade"),
    cupomId: formData.get("cupomId"),
    templateId: formData.get("templateId"),
  });
}

export async function criarCampanha(
  _prevState: ComunicacaoActionState | undefined,
  formData: FormData,
): Promise<ComunicacaoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseCampanhaForm(formData);
  if (!validated.success) return { fieldErrors: validated.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_campanhas").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    gatilho: validated.data.gatilho,
    dias_inatividade: validated.data.diasInatividade,
    cupom_id: validated.data.cupomId,
    template_id: validated.data.templateId,
  });

  if (error) return { formError: "Não foi possível salvar a campanha." };

  revalidatePath("/crm/campanhas");
  return { success: true };
}

export async function alternarAtivoCampanha(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_campanhas").update({ ativo }).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar a campanha.");
  revalidatePath("/crm/campanhas");
}

/**
 * Dispara uma campanha sob demanda (sem pg_cron neste projeto, ver 0050):
 * busca os clientes elegíveis ao gatilho AGORA, gera uma crm_interacao por
 * cliente ainda não contatado por esta campanha (dedup por campanha_id +
 * cliente_id, para clicar de novo não reenviar para quem já recebeu) e
 * marca ultimo_disparo_em. Não envia WhatsApp/e-mail/SMS de verdade —
 * status_entrega fica 'pendente' para canais externos (nenhuma integração
 * de envio existe no projeto) e 'entregue' para 'interno'.
 */
export async function dispararCampanha(campanhaId: string): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();

  const { data: campanha, error: errorCampanha } = await supabase
    .from("crm_campanhas")
    .select("*, crm_templates_mensagem(*)")
    .eq("id", campanhaId)
    .eq("empresa_id", empresa.id)
    .single();

  if (errorCampanha || !campanha) throw new Error("Campanha não encontrada.");

  const template = campanha.crm_templates_mensagem as {
    id: string;
    canal: string;
    assunto: string | null;
    conteudo: string;
  } | null;

  if (!template) throw new Error("Campanha sem template configurado.");

  const [{ data: clientes }, { data: metricas }, { data: jaContatados }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome, data_nascimento, opt_in_whatsapp, opt_in_email, opt_in_sms")
      .eq("empresa_id", empresa.id)
      .eq("ativo", true),
    supabase.from("crm_clientes_metricas").select("*").eq("empresa_id", empresa.id),
    supabase.from("crm_interacoes").select("cliente_id").eq("campanha_id", campanhaId),
  ]);

  const metricaPorCliente = new Map((metricas ?? []).map((m) => [m.cliente_id, m]));
  const contatados = new Set((jaContatados ?? []).map((linha) => linha.cliente_id));
  const hoje = new Date();

  const canalTemplate = template.canal;
  function temOptIn(cliente: { opt_in_whatsapp: boolean; opt_in_email: boolean; opt_in_sms: boolean }): boolean {
    if (canalTemplate === "whatsapp") return cliente.opt_in_whatsapp;
    if (canalTemplate === "email") return cliente.opt_in_email;
    if (canalTemplate === "sms") return cliente.opt_in_sms;
    return true;
  }

  const elegiveis = (clientes ?? []).filter((cliente) => {
    if (contatados.has(cliente.id)) return false;
    if (!temOptIn(cliente)) return false;

    const metrica = metricaPorCliente.get(cliente.id);

    if (campanha.gatilho === "aniversario") {
      if (!cliente.data_nascimento) return false;
      const nascimento = new Date(cliente.data_nascimento);
      return nascimento.getUTCMonth() === hoje.getMonth() && nascimento.getUTCDate() === hoje.getDate();
    }

    if (campanha.gatilho === "inatividade") {
      const dias = metrica?.dias_desde_ultima_compra;
      return dias !== null && dias !== undefined && dias >= (campanha.dias_inatividade ?? 0);
    }

    if (campanha.gatilho === "primeira_compra") {
      return metrica?.quantidade_compras === 1;
    }

    return true;
  });

  if (elegiveis.length === 0) {
    await supabase.from("crm_campanhas").update({ ultimo_disparo_em: new Date().toISOString() }).eq("id", campanhaId);
    return 0;
  }

  const { error: errorInsert } = await supabase.from("crm_interacoes").insert(
    elegiveis.map((cliente) => ({
      empresa_id: empresa.id,
      cliente_id: cliente.id,
      canal: template.canal,
      direcao: "enviado" as const,
      tipo: "mensagem" as const,
      assunto: template.assunto,
      conteudo: template.conteudo.replaceAll("{{nome}}", cliente.nome),
      template_id: template.id,
      campanha_id: campanhaId,
      status_entrega: template.canal === "interno" ? "entregue" : "pendente",
    })),
  );

  if (errorInsert) throw new Error("Não foi possível disparar a campanha.");

  await supabase.from("crm_campanhas").update({ ultimo_disparo_em: new Date().toISOString() }).eq("id", campanhaId);

  revalidatePath("/crm/campanhas");
  revalidatePath("/crm/comunicacao");

  return elegiveis.length;
}
