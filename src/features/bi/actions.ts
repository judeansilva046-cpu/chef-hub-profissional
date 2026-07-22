"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requirePapel } from "@/server/auth/require-papel";

import { PAPEIS_BI_METAS } from "./permissions";
import type { BiMetaTipo } from "./types";

const metaSchema = z.object({
  tipo: z.enum([
    "faturamento",
    "lucro",
    "cmv",
    "ticket_medio",
    "vendas",
    "desperdicio",
  ]),
  periodoInicio: z.string().min(8),
  periodoFim: z.string().min(8),
  valorMeta: z.coerce.number().nonnegative(),
  unidade: z.enum(["BRL", "percent", "qty", "kg"]).default("BRL"),
  observacao: z.string().max(500).optional().nullable(),
});

export async function criarBiMeta(input: {
  tipo: BiMetaTipo;
  periodoInicio: string;
  periodoFim: string;
  valorMeta: number;
  unidade?: "BRL" | "percent" | "qty" | "kg";
  observacao?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requirePapel(...PAPEIS_BI_METAS);
    const empresa = await getEmpresaAtual();
    if (!empresa) return { ok: false, error: "Empresa não encontrada." };

    const parsed = metaSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("bi_metas")
      .insert({
        empresa_id: empresa.id,
        tipo: parsed.data.tipo,
        periodo_inicio: parsed.data.periodoInicio,
        periodo_fim: parsed.data.periodoFim,
        valor_meta: parsed.data.valorMeta,
        unidade: parsed.data.unidade,
        observacao: parsed.data.observacao ?? null,
        criado_por: userData.user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/bi");
    revalidatePath("/bi/metas");
    return { ok: true, id: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao criar meta.",
    };
  }
}

export async function desativarBiMeta(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePapel(...PAPEIS_BI_METAS);
    const empresa = await getEmpresaAtual();
    if (!empresa) return { ok: false, error: "Empresa não encontrada." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("bi_metas")
      .update({ ativo: false, atualizado_em: new Date().toISOString() })
      .eq("id", id)
      .eq("empresa_id", empresa.id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/bi");
    revalidatePath("/bi/metas");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao desativar meta.",
    };
  }
}
