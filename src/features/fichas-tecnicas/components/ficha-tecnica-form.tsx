"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CurrencyInput,
  NumberField,
  PercentInput,
} from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarFichaTecnica } from "../actions";
import { calcularResumoFichaTecnica } from "../calculations";
import type { FichaTecnicaCompleta } from "../queries";
import {
  criarFormularioVazio,
  criarItemVazio,
  type FichaTecnicaFormState,
} from "../types";
import { FichaTecnicaItemRow } from "./ficha-tecnica-item-row";
import { ResumoCalculosPanel } from "./resumo-calculos-panel";

function estadoInicialFromFicha(
  ficha: FichaTecnicaCompleta,
): FichaTecnicaFormState {
  return {
    nome: ficha.nome,
    modoPreparo: ficha.modo_preparo ?? "",
    tempoPreparoMinutos: ficha.tempo_preparo_minutos,
    rendimentoQuantidade: ficha.rendimento_quantidade,
    rendimentoUnidadeId: ficha.rendimento_unidade_id,
    precoVendaPraticado: ficha.preco_venda_praticado,
    margemContribuicaoPercentualAlvo: ficha.margem_contribuicao_percentual_alvo,
    itens:
      ficha.fichas_tecnicas_itens.length > 0
        ? ficha.fichas_tecnicas_itens
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((item) => ({
              uid: item.id,
              ingredienteId: item.ingrediente_id,
              pesoBruto: item.peso_bruto,
              percentualPerda: item.percentual_perda,
            }))
        : [criarItemVazio()],
  };
}

export interface FichaTecnicaFormProps {
  ficha?: FichaTecnicaCompleta;
  ingredientes: IngredienteParaSelecao[];
  unidadesMedida: Tables<"unidades_medida">[];
  margemContribuicaoPadraoEmpresa: number | null;
}

export function FichaTecnicaForm({
  ficha,
  ingredientes,
  unidadesMedida,
  margemContribuicaoPadraoEmpresa,
}: FichaTecnicaFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FichaTecnicaFormState>(() =>
    ficha ? estadoInicialFromFicha(ficha) : criarFormularioVazio(),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ingredientesPorId = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i])),
    [ingredientes],
  );

  const resumo = useMemo(
    () =>
      calcularResumoFichaTecnica({
        itens: form.itens.map((item) => {
          const ingrediente = ingredientesPorId.get(item.ingredienteId);
          return {
            pesoBruto: item.pesoBruto ?? 0,
            percentualPerda: item.percentualPerda,
            custoUnitario: ingrediente?.custo_unitario_atual ?? 0,
          };
        }),
        rendimentoQuantidade: form.rendimentoQuantidade ?? 0,
        precoVendaPraticado: form.precoVendaPraticado,
        margemContribuicaoPercentualAlvo: form.margemContribuicaoPercentualAlvo,
        margemContribuicaoPadraoEmpresa,
      }),
    [form, ingredientesPorId, margemContribuicaoPadraoEmpresa],
  );

  function atualizarItem(
    uid: string,
    novoItem: FichaTecnicaFormState["itens"][number],
  ) {
    setForm((atual) => ({
      ...atual,
      itens: atual.itens.map((item) => (item.uid === uid ? novoItem : item)),
    }));
  }

  function removerItem(uid: string) {
    setForm((atual) => ({
      ...atual,
      itens: atual.itens.filter((item) => item.uid !== uid),
    }));
  }

  function adicionarItem() {
    setForm((atual) => ({
      ...atual,
      itens: [...atual.itens, criarItemVazio()],
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    startTransition(async () => {
      try {
        const id = await salvarFichaTecnica({
          fichaId: ficha?.id ?? null,
          nome: form.nome,
          modoPreparo: form.modoPreparo,
          tempoPreparoMinutos: form.tempoPreparoMinutos,
          rendimentoQuantidade: form.rendimentoQuantidade,
          rendimentoUnidadeId: form.rendimentoUnidadeId,
          precoVendaPraticado: form.precoVendaPraticado,
          margemContribuicaoPercentualAlvo:
            form.margemContribuicaoPercentualAlvo,
          itens: form.itens,
        });
        router.push(`/fichas-tecnicas/${id}`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a ficha técnica.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome da ficha técnica</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, nome: event.target.value }))
                }
                placeholder="Ex: Bolo de cenoura com cobertura"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rendimentoQuantidade">Rendimento</Label>
                <NumberField
                  id="rendimentoQuantidade"
                  value={form.rendimentoQuantidade}
                  onChange={(value) =>
                    setForm((atual) => ({
                      ...atual,
                      rendimentoQuantidade: value,
                    }))
                  }
                  min={0}
                  placeholder="Ex: 10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rendimentoUnidadeId">
                  Unidade do rendimento
                </Label>
                <Select
                  id="rendimentoUnidadeId"
                  value={form.rendimentoUnidadeId}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      rendimentoUnidadeId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    Selecionar...
                  </option>
                  {unidadesMedida.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome} ({unidade.sigla})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tempoPreparoMinutos">
                  Tempo de preparo (min)
                </Label>
                <NumberField
                  id="tempoPreparoMinutos"
                  value={form.tempoPreparoMinutos}
                  onChange={(value) =>
                    setForm((atual) => ({
                      ...atual,
                      tempoPreparoMinutos: value,
                    }))
                  }
                  min={0}
                  placeholder="Ex: 45"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="precoVendaPraticado">
                  Preço de venda praticado
                </Label>
                <CurrencyInput
                  id="precoVendaPraticado"
                  value={form.precoVendaPraticado}
                  onChange={(value) =>
                    setForm((atual) => ({
                      ...atual,
                      precoVendaPraticado: value,
                    }))
                  }
                  min={0}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="margemContribuicaoPercentualAlvo">
                Margem de contribuição alvo (opcional)
              </Label>
              <PercentInput
                id="margemContribuicaoPercentualAlvo"
                value={form.margemContribuicaoPercentualAlvo}
                onChange={(value) =>
                  setForm((atual) => ({
                    ...atual,
                    margemContribuicaoPercentualAlvo: value,
                  }))
                }
                min={0}
                max={99.99}
                placeholder={`Padrão da empresa: ${margemContribuicaoPadraoEmpresa ?? 70}%`}
              />
              <Text size="sm" tone="muted">
                Usada para calcular o preço sugerido. Se não informada, usa o
                padrão da empresa (ou 70% quando a empresa também não define
                um).
              </Text>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modoPreparo">Modo de preparo</Label>
              <Textarea
                id="modoPreparo"
                rows={6}
                value={form.modoPreparo}
                onChange={(event) =>
                  setForm((atual) => ({
                    ...atual,
                    modoPreparo: event.target.value,
                  }))
                }
                placeholder="Passo a passo do preparo..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground grid grid-cols-12 gap-3 pb-2 text-xs font-medium tracking-wide uppercase">
              <span className="col-span-4">Ingrediente</span>
              <span className="col-span-2">Peso bruto</span>
              <span className="col-span-2">Perda %</span>
              <span className="col-span-2">Rendimento</span>
              <span className="col-span-1">Custo</span>
              <span className="col-span-1" />
            </div>

            {form.itens.map((item) => (
              <FichaTecnicaItemRow
                key={item.uid}
                item={item}
                ingredientes={ingredientes}
                onChange={(novoItem) => atualizarItem(item.uid, novoItem)}
                onRemove={() => removerItem(item.uid)}
                podeRemover={form.itens.length > 1}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={adicionarItem}
            >
              <Plus className="h-4 w-4" />
              Adicionar ingrediente
            </Button>
          </CardContent>
        </Card>

        {erro && (
          <Text tone="danger" size="sm">
            {erro}
          </Text>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar ficha técnica"}
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <ResumoCalculosPanel resumo={resumo} />
      </div>
    </form>
  );
}
