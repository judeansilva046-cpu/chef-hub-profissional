import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CaixaWorkspace } from "@/features/caixa/components/caixa-workspace";
import { CaixasTable } from "@/features/caixa/components/caixas-table";
import { buscarCaixaAbertoDoOperador, buscarCaixaDetalhado, listarCaixas } from "@/features/caixa/queries";

export const metadata: Metadata = {
  title: "Caixa — Chef Hub Profissional",
};

interface CaixaPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CaixaPage({ searchParams }: CaixaPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const caixaAberto = await buscarCaixaAbertoDoOperador();
  const [detalhe, historico] = await Promise.all([
    caixaAberto ? buscarCaixaDetalhado(caixaAberto.id) : Promise.resolve(null),
    listarCaixas({ page }),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-8">
        <div>
          <Heading level={2}>Caixa</Heading>
          <Text tone="muted">Abertura, sangrias, suprimentos e fechamento — por operador, com conferência.</Text>
        </div>

        <CaixaWorkspace detalhe={detalhe} />

        <div className="flex flex-col gap-4">
          <Text weight="medium">Histórico</Text>
          <CaixasTable caixas={historico.data} />
          <Pagination
            page={historico.page}
            totalPages={historico.totalPages}
            createHref={(pagina) => `/caixa?page=${pagina}`}
          />
        </div>
      </Container>
    </Section>
  );
}
