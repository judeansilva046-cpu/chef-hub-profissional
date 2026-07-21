import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ContaReceberForm } from "@/features/financeiro/components/conta-receber-form";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { formatarMoeda } from "@/lib/format";
import { listarContasReceber } from "@/features/financeiro/erp/queries";

export const metadata: Metadata = {
  title: "Contas a receber — Chef Hub Profissional",
};

export default async function ContasReceberPage() {
  const contas = await listarContasReceber({ limit: 50 });

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>Contas a receber</Heading>
          <Text tone="muted">
            Clientes, delivery, mesas, PIX, cartão, dinheiro, parcelas e baixa
            automática.
          </Text>
        </div>
        <ContaReceberForm />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="py-2 pr-3">Descrição</th>
                <th className="py-2 pr-3">Origem</th>
                <th className="py-2 pr-3">Vencimento</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="py-2 pr-3">{c.description}</td>
                  <td className="py-2 pr-3">{c.source}</td>
                  <td className="py-2 pr-3">{c.due_date}</td>
                  <td className="py-2 pr-3">{formatarMoeda(Number(c.amount))}</td>
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
