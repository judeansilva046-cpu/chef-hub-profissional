"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { fichaTecnicaSchema } from "./validation";

export interface SalvarFichaTecnicaInput {
  fichaId: string | null;
  nome: string;
  modoPreparo: string | null;
  tempoPreparoMinutos: number | null;
  rendimentoQuantidade: number | null;
  rendimentoUnidadeId: string;
  precoVendaPraticado: number | null;
  margemContribuicaoPercentualAlvo: number | null;
  itens: {
    ingredienteId: string;
    pesoBruto: number | null;
    percentualPerda: number;
  }[];
}

/**
 * Único caminho de escrita para ficha técnica + itens: cria ou atualiza,
 * substitui a lista de itens e gera uma nova versão — tudo numa transação
 * atômica no banco (ver supabase/migrations/0010, função salvar_ficha_tecnica).
 * Lança erro em vez de retornar estado, pois o formulário chama esta ação
 * diretamente (não via <form action>) por causa da lista dinâmica de itens.
 */
export async function salvarFichaTecnica(
  input: SalvarFichaTecnicaInput,
): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const validated = fichaTecnicaSchema.safeParse({
    fichaId: input.fichaId,
    nome: input.nome,
    modoPreparo: input.modoPreparo?.trim() || null,
    tempoPreparoMinutos: input.tempoPreparoMinutos,
    rendimentoQuantidade: input.rendimentoQuantidade,
    rendimentoUnidadeId: input.rendimentoUnidadeId,
    precoVendaPraticado: input.precoVendaPraticado,
    margemContribuicaoPercentualAlvo: input.margemContribuicaoPercentualAlvo,
    itens: input.itens.map((item, index) => ({
      ingredienteId: item.ingredienteId,
      pesoBruto: item.pesoBruto,
      percentualPerda: item.percentualPerda,
      ordem: index,
    })),
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("salvar_ficha_tecnica", {
    p_ficha_id: validated.data.fichaId,
    p_empresa_id: empresa.id,
    p_nome: validated.data.nome,
    p_modo_preparo: validated.data.modoPreparo,
    p_tempo_preparo_minutos: validated.data.tempoPreparoMinutos,
    p_rendimento_quantidade: validated.data.rendimentoQuantidade,
    p_rendimento_unidade_id: validated.data.rendimentoUnidadeId,
    p_preco_venda_praticado: validated.data.precoVendaPraticado,
    p_margem_contribuicao_percentual_alvo:
      validated.data.margemContribuicaoPercentualAlvo,
    p_itens: validated.data.itens.map((item) => ({
      ingrediente_id: item.ingredienteId,
      peso_bruto: item.pesoBruto,
      percentual_perda: item.percentualPerda,
      ordem: item.ordem,
    })),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fichas-tecnicas");
  if (validated.data.fichaId) {
    revalidatePath(`/fichas-tecnicas/${validated.data.fichaId}`);
  }

  return data;
}

/**
 * Retorna o id da ficha duplicada em vez de redirecionar — quem chama esta
 * ação é sempre um Client Component (botão "Duplicar"), e chamar redirect()
 * dentro de uma Server Action invocada diretamente (fora de <form action>)
 * lançaria o erro especial de redirecionamento do Next.js dentro de um
 * try/catch do chamador, sendo capturado como erro comum por engano. Quem
 * chama decide a navegação via useRouter().
 */
export async function duplicarFichaTecnica(id: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_duplicar_ficha_tecnica", {
    p_ficha_id: id,
  });

  if (error) {
    throw new Error("Não foi possível duplicar a ficha técnica.");
  }

  revalidatePath("/fichas-tecnicas");
  return data;
}

export async function alternarAtivoFichaTecnica(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fichas_tecnicas")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar a ficha técnica.");
  }

  revalidatePath("/fichas-tecnicas");
  revalidatePath(`/fichas-tecnicas/${id}`);
}
