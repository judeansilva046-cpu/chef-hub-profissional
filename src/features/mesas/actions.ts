"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { mesaSchema } from "./validation";

function revalidarMesas() {
  revalidatePath("/mesas");
}

export async function criarMesa(input: unknown): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const validated = mesaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mesas").insert({
    empresa_id: empresa.id,
    identificador: validated.data.identificador,
    capacidade: validated.data.capacidade,
  });

  if (error) throw new Error("Não foi possível criar a mesa.");
  revalidarMesas();
}

export async function abrirComanda(mesaId: string, quantidadePessoas?: number | null): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_abrir_comanda", {
    p_mesa_id: mesaId,
    p_quantidade_pessoas: quantidadePessoas ?? undefined,
  });

  if (error) {
    throw new Error(error.message.includes("Mesa") ? error.message : "Não foi possível abrir a comanda.");
  }

  revalidarMesas();
  return data;
}

export async function fecharComanda(comandaId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_fechar_comanda", { p_comanda_id: comandaId });

  if (error) {
    throw new Error(
      error.message.includes("Comanda") || error.message.includes("pedidos")
        ? error.message
        : "Não foi possível fechar a comanda.",
    );
  }

  revalidarMesas();
}

export async function transferirComandaMesa(comandaId: string, novaMesaId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_transferir_comanda_mesa", {
    p_comanda_id: comandaId,
    p_nova_mesa_id: novaMesaId,
  });

  if (error) {
    throw new Error(error.message.includes("Mesa") || error.message.includes("Comanda") ? error.message : "Não foi possível transferir a comanda.");
  }

  revalidarMesas();
}

export async function unirComandas(comandaOrigemId: string, comandaDestinoId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_unir_comandas", {
    p_comanda_origem_id: comandaOrigemId,
    p_comanda_destino_id: comandaDestinoId,
  });

  if (error) {
    throw new Error(error.message.includes("omanda") ? error.message : "Não foi possível unir as comandas.");
  }

  revalidarMesas();
}
