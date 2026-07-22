import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { CupomForm } from "@/features/crm/components/cupom-form";
import { listarCupons } from "@/features/crm/queries";

export const metadata: Metadata = {
  title: "Cupons — Chef Hub Profissional",
};

export default async function CuponsPage() {
  const cupons = await listarCupons();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Cupons e promoções</Heading>
          <Text tone="muted">Percentual, valor fixo, frete, brinde, primeira compra, aniversário e inatividade.</Text>
        </div>
        <ModuleSubNav links={CRM_SUB_NAV_LINKS} />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <CupomForm />
          <div className="flex flex-col gap-2">
            {cupons.length === 0 ? (
              <Text size="sm" tone="muted">Nenhum cupom.</Text>
            ) : (
              cupons.map((c) => (
                <div key={c.id} className="border-border bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                  <span>
                    <strong>{c.code}</strong> — {c.name}
                  </span>
                  <Badge variant={c.active ? "success" : "outline"}>
                    {c.tipo} · {c.uses_count} usos
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
