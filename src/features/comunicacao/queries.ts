import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function listarTemplates(): Promise<Tables<"crm_templates_mensagem">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_templates_mensagem")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listarInteracoesCliente(clienteId: string): Promise<Tables<"crm_interacoes">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_interacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export interface ReclamacaoComCliente {
  id: string;
  clienteNome: string;
  clienteId: string;
  assunto: string | null;
  conteudo: string | null;
  resolvida: boolean;
  criadoEm: string;
}

export async function listarReclamacoes(): Promise<ReclamacaoComCliente[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_interacoes")
    .select("id, assunto, conteudo, reclamacao_resolvida, criado_em, cliente_id, clientes(nome)")
    .eq("empresa_id", empresa.id)
    .eq("tipo", "reclamacao")
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    assunto: string | null;
    conteudo: string | null;
    reclamacao_resolvida: boolean | null;
    criado_em: string;
    cliente_id: string;
    clientes: { nome: string } | null;
  }>).map((linha) => ({
    id: linha.id,
    clienteNome: linha.clientes?.nome ?? "—",
    clienteId: linha.cliente_id,
    assunto: linha.assunto,
    conteudo: linha.conteudo,
    resolvida: linha.reclamacao_resolvida ?? false,
    criadoEm: linha.criado_em,
  }));
}

export type CampanhaComRelacoes = Tables<"crm_campanhas"> & {
  crm_cupons: Pick<Tables<"crm_cupons">, "id" | "codigo"> | null;
  crm_templates_mensagem: Pick<Tables<"crm_templates_mensagem">, "id" | "nome" | "canal"> | null;
};

export async function listarCampanhas(): Promise<CampanhaComRelacoes[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_campanhas")
    .select("*, crm_cupons(id, codigo), crm_templates_mensagem(id, nome, canal)")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as CampanhaComRelacoes[];
}
