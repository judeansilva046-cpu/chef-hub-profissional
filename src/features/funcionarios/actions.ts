"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import { funcionarioSchema } from "./validation";

export interface FuncionarioActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidarFuncionarios() {
  revalidatePath("/financeiro/funcionarios");
}

function parseFuncionarioForm(formData: FormData) {
  return funcionarioSchema.safeParse({
    nome: formData.get("nome"),
    cargo: formData.get("cargo"),
    tipoContrato: formData.get("tipoContrato"),
    salarioBruto: formData.get("salarioBruto"),
    cargaHorariaSemanal: formData.get("cargaHorariaSemanal"),
    beneficiosMensais: formData.get("beneficiosMensais"),
    percentualEncargos: formData.get("percentualEncargos"),
    observacoes: formData.get("observacoes"),
  });
}

export async function criarFuncionario(
  _prevState: FuncionarioActionState | undefined,
  formData: FormData,
): Promise<FuncionarioActionState> {
  const empresa = await requireEmpresaAtual();

  const validated = parseFuncionarioForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("funcionarios").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    cargo: validated.data.cargo,
    tipo_contrato: validated.data.tipoContrato,
    salario_bruto: validated.data.salarioBruto,
    carga_horaria_semanal: validated.data.cargaHorariaSemanal,
    beneficios_mensais: validated.data.beneficiosMensais,
    percentual_encargos: validated.data.percentualEncargos,
    observacoes: validated.data.observacoes,
  });

  if (error) {
    return { formError: "Não foi possível salvar o funcionário." };
  }

  revalidarFuncionarios();
  return { success: true };
}

export async function atualizarFuncionario(
  id: string,
  _prevState: FuncionarioActionState | undefined,
  formData: FormData,
): Promise<FuncionarioActionState> {
  const empresa = await requireEmpresaAtual();

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
      tipo_contrato: validated.data.tipoContrato,
      salario_bruto: validated.data.salarioBruto,
      carga_horaria_semanal: validated.data.cargaHorariaSemanal,
      beneficios_mensais: validated.data.beneficiosMensais,
      percentual_encargos: validated.data.percentualEncargos,
      observacoes: validated.data.observacoes,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return { formError: "Não foi possível salvar o funcionário." };
  }

  revalidarFuncionarios();
  return { success: true };
}

export async function excluirFuncionario(id: string) {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível excluir o funcionário.");
  }

  revalidarFuncionarios();
}
