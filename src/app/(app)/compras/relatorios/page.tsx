import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { COMPRAS_SUB_NAV_LINKS } from "@/features/compras/components/compras-sub-nav-links";
import { ExportarRelatorioButtons } from "@/features/relatorios/components/exportar-relatorio-buttons";

export const metadata: Metadata = {
  title: "Relatórios de compras — Chef Hub Profissional",
};

const RELATORIOS = [
  { tipo: "solicitacoes", titulo: "Solicitações de compra", descricao: "Todas as solicitações, com setor, prioridade e valor estimado." },
  { tipo: "cotacoes", titulo: "Cotações", descricao: "Cotações, fornecedores convidados e vencedor escolhido." },
  { tipo: "pedidos", titulo: "Pedidos de compra", descricao: "Pedidos por fornecedor, centro de custo e status." },
  { tipo: "divergencias", titulo: "Divergências de recebimento", descricao: "Itens recusados ou com preço divergente na conferência." },
  { tipo: "historico-precos", titulo: "Histórico de preços", descricao: "Últimas 500 variações de preço por ingrediente/fornecedor." },
  { tipo: "avaliacoes", titulo: "Avaliação de fornecedores", descricao: "Notas de pontualidade, qualidade, preço e atendimento." },
  { tipo: "compras-por-centro-custo", titulo: "Compras por centro de custo", descricao: "Total comprado agrupado por centro de custo." },
];

export default function RelatoriosComprasPage() {
  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Relatórios de compras</Heading>
          <Text tone="muted">Exporte qualquer relatório em Excel ou PDF.</Text>
        </div>

        <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RELATORIOS.map((relatorio) => (
            <Card key={relatorio.tipo}>
              <CardHeader>
                <CardTitle className="text-base">{relatorio.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Text tone="muted" size="sm">
                  {relatorio.descricao}
                </Text>
                <ExportarRelatorioButtons tipo={relatorio.tipo} endpoint="/api/compras/exportar" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
