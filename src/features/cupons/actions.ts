"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { aplicarCupomSchema, cupomSchema } from "./validation";

export interface CupomActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseCupomForm(formData: FormData) {
  return cupomSchema.safeParse({
    codigo: formData.get("codigo"),
    descricao: formData.get("descricao"),
    tipo: formData.get("tipo"),
    valor: formData.get("valor") || 0,
    fichaTecnicaGratisId: formData.get("fichaTecnicaGratisId"),
    compraMinima: formData.get("compraMinima") || 0,
    limiteUsoTotal: formData.get("limiteUsoTotal"),
    limiteUsoPorCliente: formData.get("limiteUsoPorCliente") || 1,
    canalVendaId: formData.get("canalVendaId"),
    segmento: formData.get("segmento"),
    validoDe: formData.get("validoDe"),
    validoAte: formData.get("validoAte"),
  });
}

function paraColunas(dados: ReturnType<typeof cupomSchema.parse>) {
  return {
    codigo: dados.codigo,
    descricao: dados.descricao,
    tipo: dados.tipo,
    valor: dados.valor,
    ficha_tecnica_gratis_id: dados.fichaTecnicaGratisId,
    compra_minima: dados.compraMinima,
    limite_uso_total: dados.limiteUsoTotal,
    limite_uso_por_cliente: dados.limiteUsoPorCliente,
    canal_venda_id: dados.canalVendaId,
    segmento: dados.segmento,
    valido_de: dados.validoDe,
    valido_ate: dados.validoAte,
  };
}

export async function criarCupom(
  _prevState: CupomActionState | undefined,
  formData: FormData,
): Promise<CupomActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseCupomForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_cupons").insert({
    empresa_id: empresa.id,
    ...paraColunas(validated.data),
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { codigo: ["Já existe um cupom com este código."] } };
    }
    return { formError: "Não foi possível salvar o cupom." };
  }

  revalidatePath("/crm/cupons");
  return { success: true };
}

export async function atualizarCupom(
  id: string,
  _prevState: CupomActionState | undefined,
  formData: FormData,
): Promise<CupomActionState> {
  const validated = parseCupomForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_cupons")
    .update(paraColunas(validated.data))
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { codigo: ["Já existe um cupom com este código."] } };
    }
    return { formError: "Não foi possível salvar o cupom." };
  }

  revalidatePath("/crm/cupons");
  return { success: true };
}

export async function alternarAtivoCupom(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_cupons").update({ ativo }).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar o cupom.");
  revalidatePath("/crm/cupons");
}

export interface AplicarCupomResultado {
  valorDesconto: number;
  tipo: string;
  fichaTecnicaGratisId: string | null;
}

export async function aplicarCupom(input: {
  codigo: string;
  clienteId: string;
  valorCompra: number;
  canalVendaId?: string;
}): Promise<AplicarCupomResultado> {
  const validated = aplicarCupomSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_validar_e_aplicar_cupom", {
    p_codigo: validated.data.codigo,
    p_cliente_id: validated.data.clienteId,
    p_valor_compra: validated.data.valorCompra,
    p_canal_venda_id: validated.data.canalVendaId ?? undefined,
  });

  if (error) throw new Error(error.message);

  const linha = (Array.isArray(data) ? data[0] : data) as
    | { valor_desconto: number; tipo: string; ficha_tecnica_gratis_id: string | null }
    | undefined;

  if (!linha) throw new Error("Cupom inválido.");

  revalidatePath("/crm/cupons");

  return {
    valorDesconto: linha.valor_desconto,
    tipo: linha.tipo,
    fichaTecnicaGratisId: linha.ficha_tecnica_gratis_id,
  };
}

export async function estornarUsoCupom(usoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_estornar_uso_cupom", { p_uso_id: usoId });
  if (error) throw new Error(error.message);
  revalidatePath("/crm/cupons");
}
