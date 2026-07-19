import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

import { InteracaoForm } from "./interacao-form";
import { listarInteracoesCliente } from "../queries";

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  sms: "SMS",
  interno: "Interno",
  ligacao: "Ligação",
  presencial: "Presencial",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "outline"> = {
  pendente: "outline",
  enviado: "info",
  entregue: "success",
  falhou: "danger",
  lido: "success",
};

export async function InteracoesCard({ clienteId }: { clienteId: string }) {
  const interacoes = await listarInteracoesCliente(clienteId);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Interações e comunicação</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <InteracaoForm clienteId={clienteId} />

        {interacoes.length === 0 ? (
          <EmptyState title="Nenhuma interação registrada" description="Mensagens, notas e reclamações aparecerão aqui." />
        ) : (
          <div className="flex flex-col gap-3">
            {interacoes.map((interacao) => (
              <div key={interacao.id} className="border-border rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{CANAL_LABEL[interacao.canal] ?? interacao.canal}</Badge>
                    {interacao.tipo === "reclamacao" && (
                      <Badge variant={interacao.reclamacao_resolvida ? "success" : "warning"}>
                        {interacao.reclamacao_resolvida ? "Reclamação resolvida" : "Reclamação pendente"}
                      </Badge>
                    )}
                    <Badge variant={STATUS_VARIANT[interacao.status_entrega] ?? "outline"}>
                      {interacao.status_entrega}
                    </Badge>
                  </div>
                  <Text size="sm" tone="muted">
                    {formatarDataHora(interacao.criado_em)}
                  </Text>
                </div>
                {interacao.assunto && (
                  <Text size="sm" weight="semibold" className="mt-1">
                    {interacao.assunto}
                  </Text>
                )}
                {interacao.conteudo && (
                  <Text size="sm" className="mt-1">
                    {interacao.conteudo}
                  </Text>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
