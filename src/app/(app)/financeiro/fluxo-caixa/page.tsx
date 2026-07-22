import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { formatarMoeda } from "@/lib/format";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";
import { agregarFluxoCaixa, saldoDiario } from "@/features/financeiro/erp/calculations";
import { listarFluxoCaixa } from "@/features/financeiro/erp/queries";

export const metadata: Metadata = {
  title: "Fluxo de caixa — Chef Hub Profissional",
};

export default async function FluxoCaixaPage() {
  const dataInicio = primeiroDiaDoMesAtual();
  const dataFim = ultimoDiaDoMesAtual();
  const rows = await listarFluxoCaixa({ dataInicio, dataFim });
  const agg = agregarFluxoCaixa(
    rows.map((r) => ({
      flow_date: r.flow_date,
      tipo: r.tipo,
      amount: Number(r.amount),
    })),
  );
  const diario = saldoDiario(
    rows.map((r) => ({
      flow_date: r.flow_date,
      tipo: r.tipo,
      amount: Number(r.amount),
    })),
  );

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>Fluxo de caixa</Heading>
          <Text tone="muted">
            Entradas, saídas e saldo diário/mensal ({dataInicio} → {dataFim}).
          </Text>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <Text>
            Entradas: <Text as="span" weight="semibold">{formatarMoeda(agg.entradas)}</Text>
          </Text>
          <Text>
            Saídas: <Text as="span" weight="semibold">{formatarMoeda(agg.saidas)}</Text>
          </Text>
          <Text>
            Saldo: <Text as="span" weight="semibold">{formatarMoeda(agg.saldo)}</Text>
          </Text>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Entradas</th>
                <th className="py-2 pr-3">Saídas</th>
                <th className="py-2">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {diario.map((d) => (
                <tr key={d.date} className="border-b border-border">
                  <td className="py-2 pr-3">{d.date}</td>
                  <td className="py-2 pr-3">{formatarMoeda(d.entradas)}</td>
                  <td className="py-2 pr-3">{formatarMoeda(d.saidas)}</td>
                  <td className="py-2">{formatarMoeda(d.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
