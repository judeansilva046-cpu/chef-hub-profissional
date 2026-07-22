import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { cardapioDigitalMenu } from "@/integrations/cardapio-digital/cardapio_digital";

export const metadata: Metadata = {
  title: "Cardápio digital — Chef Hub",
};

interface PageProps {
  params: Promise<{ empresaId: string; mesaId: string }>;
}

/**
 * Superfície pública de autoatendimento / pedido na mesa (homologação).
 * Pedidos são registrados via capability DigitalMenu (sem login).
 */
export default async function CardapioMesaPage({ params }: PageProps) {
  const { empresaId, mesaId } = await params;
  const qr = await cardapioDigitalMenu.gerarQrCodeMesa(
    {
      empresaId,
      integrationId: "cardapio_digital",
      credentials: {},
      config: {},
    },
    mesaId,
  );

  return (
    <main className="bg-background min-h-dvh py-10">
      <Container className="flex max-w-lg flex-col gap-6">
        <div>
          <Heading level={2}>Cardápio digital</Heading>
          <Text tone="muted">Mesa {mesaId} · autoatendimento e acompanhamento</Text>
        </div>

        <div className="border-border bg-card rounded-lg border p-4">
          <Text weight="semibold">QR desta mesa</Text>
          <Text size="sm" tone="muted" className="mt-1 break-all">
            {qr.url}
          </Text>
        </div>

        <form
          action={async () => {
            "use server";
            await cardapioDigitalMenu.receberPedidoAutoatendimento(
              {
                empresaId,
                integrationId: "cardapio_digital",
                credentials: {},
                config: {},
              },
              {
                mesaId,
                items: [{ name: "Item homologação", qty: 1 }],
              },
            );
          }}
          className="flex flex-col gap-3"
        >
          <Text size="sm">
            Demo de pedido na mesa (homologação). Em produção, o cardápio virá do
            catálogo sincronizado.
          </Text>
          <Button type="submit">Enviar pedido de teste</Button>
        </form>

        <div className="border-border rounded-lg border p-4">
          <Text weight="semibold">Acompanhamento</Text>
          <Text size="sm" tone="muted" className="mt-1">
            Após o pedido, o status (confirmado → preparo → pronto → entrega)
            é atualizado pelos canais conectados (iFood/WhatsApp/KDS).
          </Text>
        </div>

        <Text size="sm" tone="muted">
          Pagamento online (PIX) fica disponível quando Mercado Pago ou Asaas
          estiverem conectados na Central de Integrações.
        </Text>
      </Container>
    </main>
  );
}
