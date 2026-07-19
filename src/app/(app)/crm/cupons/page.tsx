import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { CupomDialog } from "@/features/cupons/components/cupom-dialog";
import { CuponsTable } from "@/features/cupons/components/cupons-table";
import { UsosCupomCard } from "@/features/cupons/components/usos-cupom-card";
import { listarCupons } from "@/features/cupons/queries";
import { listarFichasTecnicasAtivasParaSelecao } from "@/features/fichas-tecnicas/queries";
import { listarCanaisVenda } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Cupons — CRM — Chef Hub Profissional",
};

interface CuponsPageProps {
  searchParams: Promise<{ cupomId?: string }>;
}

export default async function CuponsPage({ searchParams }: CuponsPageProps) {
  const params = await searchParams;
  const [cupons, fichasTecnicas, canaisVenda] = await Promise.all([
    listarCupons(),
    listarFichasTecnicasAtivasParaSelecao(),
    listarCanaisVenda(),
  ]);

  const cupomSelecionado = params.cupomId ? cupons.find((cupom) => cupom.id === params.cupomId) : null;

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Cupons</Heading>
          <CupomDialog
            fichasTecnicas={fichasTecnicas.map((f) => ({ id: f.id, nome: f.nome }))}
            canaisVenda={canaisVenda}
            trigger={<Button>Novo cupom</Button>}
          />
        </div>

        <div className="min-w-0">
          <CuponsTable
            cupons={cupons}
            fichasTecnicas={fichasTecnicas.map((f) => ({ id: f.id, nome: f.nome }))}
            canaisVenda={canaisVenda}
          />
        </div>

        {cupomSelecionado && <UsosCupomCard cupomId={cupomSelecionado.id} codigo={cupomSelecionado.codigo} />}
      </Container>
    </Section>
  );
}
