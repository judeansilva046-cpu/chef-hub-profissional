import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ContaPagarForm } from "@/features/financeiro/components/conta-pagar-form";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { formatarMoeda } from "@/lib/format";
import {
  listarCategoriasFinanceiras,
  listarCentrosCusto,
  listarContasPagar,
} from "@/features/financeiro/erp/queries";

export const metadata: Metadata = {
  title: "Contas a pagar — Chef Hub Profissional",
};

export default async function ContasPagarPage() {
  const [centros, categorias, contas] = await Promise.all([
    listarCentrosCusto(),
    listarCategoriasFinanceiras(),
    listarContasPagar({ limit: 50 }),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>Contas a pagar</Heading>
          <Text tone="muted">
            Fornecedor, centro de custo, competência, vencimento, parcelas,
            juros, multa e anexos.
          </Text>
        </div>
        <ContaPagarForm centros={centros} categorias={categorias} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="py-2 pr-3">Descrição</th>
                <th className="py-2 pr-3">Vencimento</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2 pr-3">Pago</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-2 pr-3">{c.description}</td>
                  <td className="py-2 pr-3">{c.due_date}</td>
                  <td className="py-2 pr-3">{formatarMoeda(Number(c.amount))}</td>
                  <td className="py-2 pr-3">
                    {formatarMoeda(Number(c.paid_amount))}
                  </td>
                  <td className="py-2">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
