"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import { clienteSchema } from "./validation";

export interface ClienteActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseClienteForm(formData: FormData) {
  return clienteSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    documento: formData.get("documento"),
    endereco: formData.get("endereco"),
    segmento: formData.get("segmento"),
    preferencias: formData.get("preferencias"),
    observacoes: formData.get("observacoes"),
  });
}

export async function criarCliente(
  _prevState: ClienteActionState | undefined,
  formData: FormData,
): Promise<ClienteActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseClienteForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({
    empresa_id: empresa.id,
    ...validated.data,
  });

  if (error) {
    return { formError: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  return { success: true };
}

export async function atualizarCliente(
  id: string,
  _prevState: ClienteActionState | undefined,
  formData: FormData,
): Promise<ClienteActionState> {
  const empresa = await requireEmpresaAtual();

  const validated = parseClienteForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(validated.data)
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return { formError: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function alternarAtivoCliente(id: string, ativo: boolean) {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar o cliente.");
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}
