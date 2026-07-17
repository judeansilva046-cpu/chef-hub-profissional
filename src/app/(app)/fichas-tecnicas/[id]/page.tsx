import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { History, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { DuplicarFichaButton } from "@/features/fichas-tecnicas/components/duplicar-ficha-button";
import { FichaTecnicaPrintButton } from "@/features/fichas-tecnicas/components/ficha-tecnica-print-button";
import { ResumoCalculosPanel } from "@/features/fichas-tecnicas/components/resumo-calculos-panel";
import { buscarFichaTecnicaPorId } from "@/features/fichas-tecnicas/queries";
import { cn } from "@/lib/utils";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import type { ResumoFichaTecnica } from "@/features/fichas-tecnicas/calculations";

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatoPeso = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});
const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

interface FichaTecnicaPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: FichaTecnicaPageProps): Promise<Metadata> {
  const { id } = await params;
  const ficha = await buscarFichaTecnicaPorId(id);
  return {
    title: ficha ? `${ficha.nome} — Chef Hub Profissional` : "Ficha técnica",
  };
}

export default async function FichaTecnicaPage({
  params,
}: FichaTecnicaPageProps) {
  const { id } = await params;
  const [ficha, empresa] = await Promise.all([
    buscarFichaTecnicaPorId(id),
    getEmpresaAtual(),
  ]);

  if (!ficha) {
    notFound();
  }

  const resumo: ResumoFichaTecnica = {
    pesoBrutoTotal: ficha.peso_bruto_total,
    pesoLiquidoTotal: ficha.peso_liquido_total,
    custoTotal: ficha.custo_total,
    custoPorPorcao: ficha.custo_por_porcao,
    margemAlvoEfetiva:
      ficha.margem_contribuicao_percentual_alvo ??
      empresa?.margem_contribuicao_padrao ??
      70,
    precoSugerido: ficha.preco_sugerido,
    precoReferencia: ficha.preco_venda_praticado ?? ficha.preco_sugerido,
    cmvPercentual: ficha.cmv_percentual,
    margemContribuicaoPercentual: ficha.margem_contribuicao_percentual,
    markupPercentual: ficha.markup_percentual,
  };

  const itens = ficha.fichas_tecnicas_itens
    .slice()
    .sort((a, b) => a.ordem - b.ordem);

  return (
    <Section className="py-8 print:py-0">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Heading level={2}>{ficha.nome}</Heading>
              <Badge variant={ficha.ativo ? "success" : "outline"}>
                {ficha.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <Text tone="muted">
              Versão {ficha.versao_atual} · Rendimento:{" "}
              {ficha.rendimento_quantidade} {ficha.unidades_medida.sigla}
              {ficha.tempo_preparo_minutos !== null &&
                ` · ${ficha.tempo_preparo_minutos} min de preparo`}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Link
              href={`/fichas-tecnicas/${ficha.id}/versoes`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <History className="h-4 w-4" />
              Histórico
            </Link>
            <DuplicarFichaButton fichaId={ficha.id} />
            <FichaTecnicaPrintButton />
            <Link
              href={`/fichas-tecnicas/${ficha.id}/editar`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingredientes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table className="border-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Peso bruto</TableHead>
                      <TableHead>Perda</TableHead>
                      <TableHead>Peso líquido</TableHead>
                      <TableHead>Custo unitário</TableHead>
                      <TableHead className="text-right">Custo total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-foreground font-medium">
                          {item.ingredientes.nome}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatoPeso.format(item.peso_bruto)}{" "}
                          {item.ingredientes.unidades_medida.sigla}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatoPercentual.format(item.percentual_perda)}%
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatoPeso.format(item.peso_liquido ?? 0)}{" "}
                          {item.ingredientes.unidades_medida.sigla}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatoMoeda.format(item.custo_unitario_utilizado)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatoMoeda.format(item.custo_total_item ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {ficha.modo_preparo && (
              <Card>
                <CardHeader>
                  <CardTitle>Modo de preparo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Text className="whitespace-pre-wrap">
                    {ficha.modo_preparo}
                  </Text>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <ResumoCalculosPanel resumo={resumo} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
