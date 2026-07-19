import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { calcularIndicadoresDashboardCrm } from "@/features/crm/calculations";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import {
  buscarResumoCupons,
  buscarResumoFidelidadeCashback,
  buscarResumoFunil,
  buscarVendasPorClienteUltimos60Dias,
  contarContatosPorCampanha,
} from "@/features/crm/queries";
import { buscarClientesComMetricas } from "@/features/crm-segmentacao/queries";
import { formatarDecimal, formatarMoeda, formatarPercentual } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard — CRM — Chef Hub Profissional",
};

function CardIndicador({ titulo, valor, subtitulo }: { titulo: string; valor: string; subtitulo?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-semibold">{valor}</Text>
        {subtitulo && (
          <Text tone="muted" size="sm">
            {subtitulo}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardCrmPage() {
  const [clientes, vendasPorCliente, funil, cupons, fidelidadeCashback, contatosCampanhas] = await Promise.all([
    buscarClientesComMetricas(),
    buscarVendasPorClienteUltimos60Dias(),
    buscarResumoFunil(),
    buscarResumoCupons(),
    buscarResumoFidelidadeCashback(),
    contarContatosPorCampanha(),
  ]);

  const indicadores = calcularIndicadoresDashboardCrm(clientes, vendasPorCliente);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Clientes
          </Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <CardIndicador titulo="Novos clientes (30d)" valor={formatarDecimal(indicadores.novosClientes)} />
            <CardIndicador titulo="Clientes ativos" valor={formatarDecimal(indicadores.clientesAtivos)} />
            <CardIndicador titulo="Clientes inativos" valor={formatarDecimal(indicadores.clientesInativos)} />
            <CardIndicador titulo="Taxa de recompra" valor={formatarPercentual(indicadores.taxaRecompraPercentual)} />
            <CardIndicador titulo="Frequência média" valor={`${formatarDecimal(indicadores.frequenciaMediaCompras)} compras`} />
            <CardIndicador titulo="Retenção (30d)" valor={formatarPercentual(indicadores.retencaoPercentual)} />
            <CardIndicador titulo="Churn (30d)" valor={formatarPercentual(indicadores.churnPercentual)} />
            <CardIndicador titulo="Ticket médio geral" valor={formatarMoeda(indicadores.ticketMedioGeral)} />
            <CardIndicador titulo="LTV médio" valor={formatarMoeda(indicadores.ltvMedio)} />
          </div>
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Funil comercial
          </Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CardIndicador titulo="Leads abertos" valor={formatarDecimal(funil.totalLeadsAbertos)} />
            <CardIndicador titulo="Valor estimado aberto" valor={formatarMoeda(funil.valorEstimadoAberto)} />
            <CardIndicador titulo="Convertidos" valor={formatarDecimal(funil.totalConvertidos)} />
            <CardIndicador titulo="Taxa de conversão" valor={formatarPercentual(funil.taxaConversaoPercentual)} />
          </div>
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Fidelidade, cashback e cupons
          </Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <CardIndicador titulo="Pontos emitidos" valor={formatarDecimal(fidelidadeCashback.pontosEmitidos)} />
            <CardIndicador titulo="Pontos resgatados" valor={formatarDecimal(fidelidadeCashback.pontosResgatados)} />
            <CardIndicador titulo="Cashback emitido" valor={formatarMoeda(fidelidadeCashback.cashbackEmitido)} />
            <CardIndicador titulo="Cashback resgatado" valor={formatarMoeda(fidelidadeCashback.cashbackResgatado)} />
            <CardIndicador titulo="Usos de cupons" valor={formatarDecimal(cupons.totalUsos)} />
            <CardIndicador titulo="Desconto concedido" valor={formatarMoeda(cupons.totalDescontoConcedido)} />
          </div>
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Campanhas
          </Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <CardIndicador titulo="Contatos gerados por campanhas" valor={formatarDecimal(contatosCampanhas)} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
