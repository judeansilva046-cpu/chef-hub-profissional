import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { ConsumoPrevistoTable } from "@/features/producao/components/consumo-previsto-table";
import { NovaProducaoButton } from "@/features/producao/components/nova-producao-button";
import { ProducaoNavegacao } from "@/features/producao/components/producao-navegacao";
import { ProducoesTable } from "@/features/producao/components/producoes-table";
import { RepetirSemanaButton } from "@/features/producao/components/repetir-semana-button";
import { getSemanaRange, hojeIso } from "@/features/producao/date-range";
import {
  calcularConsumoPrevisto,
  listarProducoesPlanejadas,
} from "@/features/producao/queries";
import { listarFichasTecnicasAtivasParaSelecao } from "@/features/fichas-tecnicas/queries";

export const metadata: Metadata = {
  title: "Planejamento de produção — Chef Hub Profissional",
};

interface ProducaoPageProps {
  searchParams: Promise<{ visao?: string; data?: string }>;
}

export default async function ProducaoPage({
  searchParams,
}: ProducaoPageProps) {
  const params = await searchParams;
  const visao = params.visao === "dia" ? "dia" : "semana";
  const dataAncora = params.data ?? hojeIso();

  const { inicio, fim } =
    visao === "dia"
      ? { inicio: dataAncora, fim: dataAncora }
      : getSemanaRange(dataAncora);

  const [producoes, consumoPrevisto, fichas] = await Promise.all([
    listarProducoesPlanejadas({ dataInicio: inicio, dataFim: fim }),
    calcularConsumoPrevisto({ dataInicio: inicio, dataFim: fim }),
    listarFichasTecnicasAtivasParaSelecao(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Planejamento de produção</Heading>
            <Text tone="muted">
              Produção diária e semanal, consumo previsto de ingredientes e
              necessidade de compra.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {visao === "semana" && (
              <RepetirSemanaButton dataInicioSemanaAtual={inicio} />
            )}
            <NovaProducaoButton fichas={fichas} dataPadrao={dataAncora} />
          </div>
        </div>

        <ProducaoNavegacao
          visao={visao}
          dataAncora={dataAncora}
          dataInicio={inicio}
          dataFim={fim}
        />

        <Tabs defaultValue="producoes">
          <TabsList>
            <TabsTrigger value="producoes">Produções</TabsTrigger>
            <TabsTrigger value="consumo">
              Consumo previsto e necessidade de compra
            </TabsTrigger>
          </TabsList>
          <TabsContent value="producoes">
            <ProducoesTable producoes={producoes} />
          </TabsContent>
          <TabsContent value="consumo">
            <ConsumoPrevistoTable itens={consumoPrevisto} />
          </TabsContent>
        </Tabs>
      </Container>
    </Section>
  );
}
