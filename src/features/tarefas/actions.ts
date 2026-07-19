"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/server/auth/dal";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { tarefaSchema } from "./validation";

export interface TarefaActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function criarTarefa(
  _prevState: TarefaActionState | undefined,
  formData: FormData,
): Promise<TarefaActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };
  const { user } = await verifySession();

  const validated = tarefaSchema.safeParse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    prioridade: formData.get("prioridade") || "media",
    prazo: formData.get("prazo"),
    lembreteEm: formData.get("lembreteEm"),
    referenciaTipo: formData.get("referenciaTipo") ?? undefined,
    referenciaId: formData.get("referenciaId"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_tarefas").insert({
    empresa_id: empresa.id,
    titulo: validated.data.titulo,
    descricao: validated.data.descricao,
    prioridade: validated.data.prioridade,
    prazo: validated.data.prazo,
    lembrete_em: validated.data.lembreteEm,
    referencia_tipo: validated.data.referenciaTipo,
    referencia_id: validated.data.referenciaId,
    responsavel_id: user.id,
    criado_por: user.id,
  });

  if (error) return { formError: "Não foi possível salvar a tarefa." };

  revalidatePath("/crm/tarefas");
  if (validated.data.referenciaId) {
    revalidatePath(`/clientes/${validated.data.referenciaId}`);
  }
  return { success: true };
}

export async function atualizarStatusTarefa(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_tarefas").update({ status }).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar a tarefa.");
  revalidatePath("/crm/tarefas");
}
