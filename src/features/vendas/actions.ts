"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import { vendaSchema } from "./validation";

export interface VendaActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidarVendas() {
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  revalidatePath("/clientes");
}

export async function criarVenda(
  _prevState: VendaActionState | undefined,
  formData: FormData,
): Promise<VendaActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = vendaSchema.safeParse({
    fichaTecnicaId: formData.get("fichaTecnicaId"),
    canalVendaId: formData.get("canalVendaId"),
    clienteId: formData.get("clienteId"),
    quantidade: formData.get("quantidade"),
    precoUnitarioPraticado: formData.get("precoUnitarioPraticado"),
    dataVenda: formData.get("dataVenda"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("vendas").insert({
    empresa_id: empresa.id,
    ficha_tecnica_id: validated.data.fichaTecnicaId,
    canal_venda_id: validated.data.canalVendaId,
    cliente_id: validated.data.clienteId,
    quantidade: validated.data.quantidade,
    preco_unitario_praticado: validated.data.precoUnitarioPraticado,
    data_venda: validated.data.dataVenda,
    observacao: validated.data.observacao,
    criado_por: user?.id,
  });

  if (error) {
    return { formError: "Não foi possível registrar a venda." };
  }

  revalidarVendas();
  return { success: true };
}

/** Edição não permite trocar a ficha técnica vendida — o snapshot de custo é
 * gravado só na criação (mesmo princípio de custo_unitario_utilizado em
 * fichas_tecnicas_itens); trocar o produto de uma venda já registrada é
 * conceitualmente "excluir e lançar de novo", não um "editar". */
export async function atualizarVenda(
  id: string,
  _prevState: VendaActionState | undefined,
  formData: FormData,
): Promise<VendaActionState> {
  const empresa = await requireEmpresaAtual();

  const validated = vendaSchema.safeParse({
    fichaTecnicaId: formData.get("fichaTecnicaId"),
    canalVendaId: formData.get("canalVendaId"),
    clienteId: formData.get("clienteId"),
    quantidade: formData.get("quantidade"),
    precoUnitarioPraticado: formData.get("precoUnitarioPraticado"),
    dataVenda: formData.get("dataVenda"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendas")
    .update({
      canal_venda_id: validated.data.canalVendaId,
      cliente_id: validated.data.clienteId,
      quantidade: validated.data.quantidade,
      preco_unitario_praticado: validated.data.precoUnitarioPraticado,
      data_venda: validated.data.dataVenda,
      observacao: validated.data.observacao,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return { formError: "Não foi possível salvar a venda." };
  }

  revalidarVendas();
  return { success: true };
}

export async function excluirVenda(id: string) {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendas")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível excluir a venda.");
  }

  revalidarVendas();
}
