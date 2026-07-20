"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import {
  canalVendaSchema,
  centroCustoSchema,
  custoFixoSchema,
  custoVariavelSchema,
  funcionarioSchema,
  metaVendasSchema,
  planoContaSchema,
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
  revalidatePath("/financeiro/funcionarios");
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
    .eq("id", id);

  if (error) {
    return { formError: "Não foi possível salvar o custo fixo." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function alternarAtivoCustoFixo(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custos_fixos")
    .update({ ativo })
    .eq("id", id);

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
    .eq("id", id);

  if (error) {
    return { formError: "Não foi possível salvar o custo variável." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function alternarAtivoCustoVariavel(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custos_variaveis")
    .update({ ativo })
    .eq("id", id);

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
    .eq("id", id);

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
  const supabase = await createClient();
  const { error } = await supabase.from("metas_vendas").delete().eq("id", id);

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
    .eq("id", id);

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("canais_venda")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o canal.");
  }

  revalidarFinanceiro();
}

export async function excluirCanalVenda(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("canais_venda").delete().eq("id", id);

  if (error) {
    throw new Error("Não foi possível excluir o canal.");
  }

  revalidarFinanceiro();
}

export async function criarPlanoConta(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = planoContaSchema.safeParse({
    codigo: formData.get("codigo"),
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    contaPaiId: formData.get("contaPaiId"),
  });
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("plano_contas").insert({
    empresa_id: empresa.id,
    codigo: validated.data.codigo,
    nome: validated.data.nome,
    tipo: validated.data.tipo,
    conta_pai_id: validated.data.contaPaiId,
  });

  if (error) {
    return {
      formError: error.code === "23505" ? "Esse código já está em uso." : "Não foi possível salvar a conta.",
    };
  }

  revalidatePath("/financeiro/plano-de-contas");
  return { success: true };
}

export async function alternarAtivoPlanoConta(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("plano_contas").update({ ativo }).eq("id", id);

  if (error) throw new Error("Não foi possível atualizar a conta.");
  revalidatePath("/financeiro/plano-de-contas");
}

export async function criarCentroCusto(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = centroCustoSchema.safeParse({
    codigo: formData.get("codigo"),
    nome: formData.get("nome"),
  });
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("centros_custo").insert({
    empresa_id: empresa.id,
    codigo: validated.data.codigo,
    nome: validated.data.nome,
  });

  if (error) {
    return {
      formError: error.code === "23505" ? "Esse código já está em uso." : "Não foi possível salvar o centro de custo.",
    };
  }

  revalidatePath("/financeiro/centros-de-custo");
  return { success: true };
}

export async function alternarAtivoCentroCusto(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("centros_custo").update({ ativo }).eq("id", id);

  if (error) throw new Error("Não foi possível atualizar o centro de custo.");
  revalidatePath("/financeiro/centros-de-custo");
}

function parseFuncionarioForm(formData: FormData) {
  return funcionarioSchema.safeParse({
    nome: formData.get("nome"),
    cargo: formData.get("cargo"),
    tipoContratacao: formData.get("tipoContratacao"),
    salarioBase: formData.get("salarioBase"),
    cargaHorariaSemanal: formData.get("cargaHorariaSemanal"),
    encargosPercentual: formData.get("encargosPercentual"),
    beneficiosValor: formData.get("beneficiosValor"),
    dataAdmissao: formData.get("dataAdmissao"),
    observacoes: formData.get("observacoes"),
  });
}

export async function criarFuncionario(
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseFuncionarioForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("funcionarios").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    cargo: validated.data.cargo,
    tipo_contratacao: validated.data.tipoContratacao,
    salario_base: validated.data.salarioBase,
    carga_horaria_semanal: validated.data.cargaHorariaSemanal,
    encargos_percentual: validated.data.encargosPercentual,
    beneficios_valor: validated.data.beneficiosValor,
    data_admissao: validated.data.dataAdmissao,
    observacoes: validated.data.observacoes,
  });

  if (error) {
    return { formError: "Não foi possível salvar o funcionário." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function atualizarFuncionario(
  id: string,
  _prevState: FinanceiroActionState | undefined,
  formData: FormData,
): Promise<FinanceiroActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseFuncionarioForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .update({
      nome: validated.data.nome,
      cargo: validated.data.cargo,
      tipo_contratacao: validated.data.tipoContratacao,
      salario_base: validated.data.salarioBase,
      carga_horaria_semanal: validated.data.cargaHorariaSemanal,
      encargos_percentual: validated.data.encargosPercentual,
      beneficios_valor: validated.data.beneficiosValor,
      data_admissao: validated.data.dataAdmissao,
      observacoes: validated.data.observacoes,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return { formError: "Não foi possível salvar o funcionário." };
  }

  revalidarFinanceiro();
  return { success: true };
}

export async function alternarAtivoFuncionario(id: string, ativo: boolean) {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .update({ ativo, data_desligamento: ativo ? null : new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) throw new Error("Não foi possível atualizar o funcionário.");
  revalidarFinanceiro();
}
