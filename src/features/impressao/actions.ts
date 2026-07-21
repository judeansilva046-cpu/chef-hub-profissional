"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

/**
 * Reimpressão = enfileirar um novo job com o MESMO payload/tipo/referência
 * do original (nunca edita o job antigo — fila_impressao é, na prática,
 * append-only para o cliente: só há policy de INSERT/SELECT/DELETE, sem
 * UPDATE, ver 0028) — cada reimpressão fica com seu próprio histórico de
 * status.
 */
export async function reimprimirTrabalho(id: string): Promise<void> {
  const empresa = await requireEmpresaAtual();

  const supabase = await createClient();
  const { data: original, error: erroOriginal } = await supabase
    .from("fila_impressao")
    .select("tipo, payload, referencia_tipo, referencia_id")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (erroOriginal || !original) throw new Error("Trabalho de impressão não encontrado.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("fila_impressao").insert({
    empresa_id: empresa.id,
    tipo: original.tipo,
    payload: original.payload,
    referencia_tipo: original.referencia_tipo,
    referencia_id: original.referencia_id,
    criado_por: user?.id,
  });

  if (error) throw new Error("Não foi possível reimprimir.");

  revalidatePath("/pedidos");
  revalidatePath("/caixa");
  revalidatePath("/expedicao");
}

export async function cancelarTrabalhoImpressaoPendente(id: string): Promise<void> {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("fila_impressao")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .eq("status", "pendente");

  if (error) throw new Error("Não foi possível cancelar — o trabalho já pode ter sido processado.");

  revalidatePath("/pedidos");
  revalidatePath("/caixa");
  revalidatePath("/expedicao");
}
