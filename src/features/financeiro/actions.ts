"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";

import {
  canalVendaSchema,
  custoFixoSchema,
  custoVariavelSchema,
  metaVendasSchema,
} from "./validation";

export interface FinanceiroActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidarFinanceiro() {
  revalidatePath("/financeiro/painel");
  revalidatePath("/financeiro/precificacao");
  revalidatePath("/financeiro/ponto-equilibrio");
  revalidatePath("/financeiro/custos-fixos");
  revalidatePath("/financeiro/custos-variaveis");
  revalidatePath("/financeiro/canais");
  revalidatePath("/financeiro/simulador-promocoes");
}

function parseCustoFixoForm(formData: FormData) {
  return custoFixoSchema.safeParse({
    nome: formData.get("nome"),
    categoria: formData.get("categoria"),
    valorMensal: formData.get("valorMensal"),
  });
}

export async function criarCustoFixo(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseCustoFixoForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("custos_fixos").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    categoria: validated.data.categoria,
    valor_mensal: validated.data.valorMensal,
  });

  if (error) {
    return { formError: "Não foi possível salvar o custo fixo." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function atualizarCustoFixo(
  id: string,
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();

  const validated = parseCustoFixoForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("custos_fixos")
    .update({
      nome: validated.data.nome,
      categoria: validated.data.categoria,
      valor_mensal: validated.data.valorMensal,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return { formError: "Não foi possível salvar o custo fixo." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function alternarAtivoCustoFixo(id: string, ativo: boolean) {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("custos_fixos")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar o custo fixo.");
  }

  revalidarFinanceiro();
}

function parseCustoVariavelForm(formData: FormData) {
  return custoVariavelSchema.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
  });
}

export async function criarCustoVariavel(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseCustoVariavelForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("custos_variaveis").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    tipo: validated.data.tipo,
    valor: validated.data.valor,
  });

  if (error) {
    return { formError: "Não foi possível salvar o custo variável." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function atualizarCustoVariavel(
  id: string,
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();

  const validated = parseCustoVariavelForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("custos_variaveis")
    .update({
      nome: validated.data.nome,
      tipo: validated.data.tipo,
      valor: validated.data.valor,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return { formError: "Não foi possível salvar o custo variável." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function alternarAtivoCustoVariavel(id: string, ativo: boolean) {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("custos_variaveis")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar o custo variável.");
  }

  revalidarFinanceiro();
}

function parseMetaVendasForm(formData: FormData) {
  return metaVendasSchema.safeParse({
    mesReferencia: formData.get("mesReferencia"),
    valorMetaReceita: formData.get("valorMetaReceita"),
    quantidadeMeta: formData.get("quantidadeMeta") || null,
    observacao: formData.get("observacao"),
  });
}

export async function criarMetaVendas(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseMetaVendasForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("metas_vendas").insert({
    empresa_id: empresa.id,
    mes_referencia: `${validated.data.mesReferencia}-01`,
    valor_meta_receita: validated.data.valorMetaReceita,
    quantidade_meta: validated.data.quantidadeMeta,
    observacao: validated.data.observacao,
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe uma meta cadastrada para esse mês."
          : "Não foi possível salvar a meta.",
    };
  }

  revalidatePath("/financeiro/metas-vendas");
  revalidarFinanceiro();
  return { success: true };
}

export async function atualizarMetaVendas(
  id: string,
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();

  const validated = parseMetaVendasForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("metas_vendas")
    .update({
      mes_referencia: `${validated.data.mesReferencia}-01`,
      valor_meta_receita: validated.data.valorMetaReceita,
      quantidade_meta: validated.data.quantidadeMeta,
      observacao: validated.data.observacao,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe uma meta cadastrada para esse mês."
          : "Não foi possível salvar a meta.",
    };
  }

  revalidatePath("/financeiro/metas-vendas");
  revalidarFinanceiro();
  return { success: true };
}

export async function excluirMetaVendas(id: string) {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("metas_vendas")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível excluir a meta.");
  }

  revalidatePath("/financeiro/metas-vendas");
  revalidarFinanceiro();
}

function parseCanalVendaForm(formData: FormData) {
  return canalVendaSchema.safeParse({
    tipo: formData.get("tipo"),
    nome: formData.get("nome"),
    taxaPercentual: formData.get("taxaPercentual"),
    taxaFixa: formData.get("taxaFixa"),
  });
}

export async function criarCanalVenda(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseCanalVendaForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("canais_venda").insert({
    empresa_id: empresa.id,
    tipo: validated.data.tipo,
    nome: validated.data.nome,
    taxa_percentual: validated.data.taxaPercentual,
    taxa_fixa: validated.data.taxaFixa,
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Esse canal já está cadastrado para a empresa."
          : "Não foi possível salvar o canal.",
    };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function atualizarCanalVenda(
  id: string,
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();

  const validated = parseCanalVendaForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("canais_venda")
    .update({
      tipo: validated.data.tipo,
      nome: validated.data.nome,
      taxa_percentual: validated.data.taxaPercentual,
      taxa_fixa: validated.data.taxaFixa,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Esse canal já está cadastrado para a empresa."
          : "Não foi possível salvar o canal.",
    };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function alternarAtivoCanalVenda(id: string, ativo: boolean) {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("canais_venda")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar o canal.");
  }

  revalidarFinanceiro();
}

export async function excluirCanalVenda(id: string) {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("canais_venda")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível excluir o canal.");
  }

  revalidarFinanceiro();
}
