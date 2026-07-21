"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

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
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: mesa, error: mesaError } = await supabase
    .from("mesas")
    .select("id")
    .eq("id", mesaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (mesaError || !mesa) {
    throw new Error("Mesa não encontrada.");
  }

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
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: comanda, error: comandaError } = await supabase
    .from("comandas")
    .select("id")
    .eq("id", comandaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (comandaError || !comanda) {
    throw new Error("Comanda não encontrada.");
  }

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
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: comanda, error: comandaError } = await supabase
    .from("comandas")
    .select("id")
    .eq("id", comandaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (comandaError || !comanda) {
    throw new Error("Comanda não encontrada.");
  }

  const { data: mesa, error: mesaError } = await supabase
    .from("mesas")
    .select("id")
    .eq("id", novaMesaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (mesaError || !mesa) {
    throw new Error("Mesa não encontrada.");
  }

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
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: origem, error: origemError } = await supabase
    .from("comandas")
    .select("id")
    .eq("id", comandaOrigemId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (origemError || !origem) {
    throw new Error("Comanda de origem não encontrada.");
  }

  const { data: destino, error: destinoError } = await supabase
    .from("comandas")
    .select("id")
    .eq("id", comandaDestinoId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (destinoError || !destino) {
    throw new Error("Comanda de destino não encontrada.");
  }

  const { error } = await supabase.rpc("fn_unir_comandas", {
    p_comanda_origem_id: comandaOrigemId,
    p_comanda_destino_id: comandaDestinoId,
  });

  if (error) {
    throw new Error(error.message.includes("omanda") ? error.message : "Não foi possível unir as comandas.");
  }

  revalidarMesas();
}
