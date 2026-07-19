"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { avaliacaoFornecedorSchema, fornecedorSchema } from "./validation";

export interface FornecedorActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseFornecedorForm(formData: FormData) {
  return fornecedorSchema.safeParse({
    nome: formData.get("nome"),
    nomeFantasia: formData.get("nomeFantasia"),
    documento: formData.get("documento"),
    inscricaoEstadual: formData.get("inscricaoEstadual"),
    telefone: formData.get("telefone"),
    whatsapp: formData.get("whatsapp"),
    contatoNome: formData.get("contatoNome"),
    email: formData.get("email"),
    endereco: formData.get("endereco"),
    categorias: formData.get("categorias"),
    condicoesPagamento: formData.get("condicoesPagamento"),
    prazoMedioEntregaDias: formData.get("prazoMedioEntregaDias"),
    pedidoMinimo: formData.get("pedidoMinimo"),
    banco: formData.get("banco"),
    agencia: formData.get("agencia"),
    conta: formData.get("conta"),
    tipoConta: formData.get("tipoConta"),
    chavePix: formData.get("chavePix"),
    observacoes: formData.get("observacoes"),
  });
}

function paraColunas(dados: ReturnType<typeof fornecedorSchema.parse>) {
  const dadosBancarios =
    dados.banco || dados.agencia || dados.conta || dados.tipoConta
      ? { banco: dados.banco, agencia: dados.agencia, conta: dados.conta, tipoConta: dados.tipoConta }
      : null;

  return {
    nome: dados.nome,
    nome_fantasia: dados.nomeFantasia,
    documento: dados.documento,
    inscricao_estadual: dados.inscricaoEstadual,
    telefone: dados.telefone,
    whatsapp: dados.whatsapp,
    contato_nome: dados.contatoNome,
    email: dados.email,
    endereco: dados.endereco,
    categorias: dados.categorias,
    condicoes_pagamento: dados.condicoesPagamento,
    prazo_medio_entrega_dias: dados.prazoMedioEntregaDias,
    pedido_minimo: dados.pedidoMinimo,
    dados_bancarios: dadosBancarios,
    chave_pix: dados.chavePix,
    observacoes: dados.observacoes,
  };
}

export async function criarFornecedor(
  _prevState: FornecedorActionState | undefined,
  formData: FormData,
): Promise<FornecedorActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseFornecedorForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fornecedores").insert({
    empresa_id: empresa.id,
    ...paraColunas(validated.data),
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe um fornecedor com esse nome."
          : "Não foi possível salvar o fornecedor.",
    };
  }

  revalidatePath("/compras/fornecedores");
  return { success: true };
}

export async function atualizarFornecedor(
  id: string,
  _prevState: FornecedorActionState | undefined,
  formData: FormData,
): Promise<FornecedorActionState> {
  const validated = parseFornecedorForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update(paraColunas(validated.data))
    .eq("id", id);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe um fornecedor com esse nome."
          : "Não foi possível salvar o fornecedor.",
    };
  }

  revalidatePath("/compras/fornecedores");
  revalidatePath(`/compras/fornecedores/${id}`);
  return { success: true };
}

export async function alternarAtivoFornecedor(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o fornecedor.");
  }

  revalidatePath("/compras/fornecedores");
}

export interface AvaliacaoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function criarAvaliacaoFornecedor(
  _prevState: AvaliacaoActionState | undefined,
  formData: FormData,
): Promise<AvaliacaoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = avaliacaoFornecedorSchema.safeParse({
    fornecedorId: formData.get("fornecedorId"),
    pedidoId: formData.get("pedidoId"),
    pontualidade: formData.get("pontualidade"),
    qualidade: formData.get("qualidade"),
    preco: formData.get("preco"),
    atendimento: formData.get("atendimento"),
    comentario: formData.get("comentario"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("compras_avaliacoes_fornecedor").insert({
    empresa_id: empresa.id,
    fornecedor_id: validated.data.fornecedorId,
    pedido_id: validated.data.pedidoId,
    pontualidade: validated.data.pontualidade,
    qualidade: validated.data.qualidade,
    preco: validated.data.preco,
    atendimento: validated.data.atendimento,
    comentario: validated.data.comentario,
  });

  if (error) return { formError: "Não foi possível salvar a avaliação." };

  revalidatePath("/compras/fornecedores");
  if (validated.data.pedidoId) revalidatePath(`/compras/pedidos/${validated.data.pedidoId}`);
  return { success: true };
}

export interface AnexoActionState {
  formError?: string;
  success?: boolean;
}

export async function adicionarAnexo(input: {
  referenciaTipo: "fornecedor" | "solicitacao_compra" | "pedido_compra" | "recebimento";
  referenciaId: string;
  nomeArquivo: string;
  url: string;
  tipo?: string;
}) {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase.from("compras_anexos").insert({
    empresa_id: empresa.id,
    referencia_tipo: input.referenciaTipo,
    referencia_id: input.referenciaId,
    nome_arquivo: input.nomeArquivo,
    url: input.url,
    tipo: input.tipo ?? "outro",
  });

  if (error) throw new Error("Não foi possível anexar o documento.");

  revalidatePath("/compras/fornecedores");
  revalidatePath("/compras/solicitacoes");
  revalidatePath("/compras/pedidos");
}

export async function removerAnexo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("compras_anexos").delete().eq("id", id);
  if (error) throw new Error("Não foi possível remover o anexo.");
  revalidatePath("/compras/fornecedores");
  revalidatePath("/compras/solicitacoes");
  revalidatePath("/compras/pedidos");
}
