import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import type { IntegrationCategory } from "@/integrations/types";

import type { PainelIntegracoesMetrics } from "../metrics";
import type { IntegrationHubItem } from "../queries";
import { IntegrationCard } from "./integration-card";
import { IntegrationLogsPanel } from "./integration-logs-panel";
import { IntegrationMetricsPanel } from "./integration-metrics-panel";
import { IntegrationSyncHistory } from "./integration-sync-history";

const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  delivery: "Delivery",
  whatsapp: "WhatsApp",
  pix: "PIX",
  printer: "Impressoras",
  cardapio_digital: "Cardápio digital",
};

const ORDER: IntegrationCategory[] = [
  "delivery",
  "whatsapp",
  "pix",
  "printer",
  "cardapio_digital",
];

export function IntegrationHub({
  items,
  logs,
  syncs,
  status,
  metrics,
}: {
  items: IntegrationHubItem[];
  logs: Array<{
    id: string;
    level: string;
    event_type: string;
    message: string;
    created_at: string;
    duration_ms?: number | null;
  }>;
  syncs: Array<{
    id: string;
    sync_type: string;
    status: string;
    started_at: string;
    items_count: number;
    error_message?: string | null;
    duration_ms?: number | null;
  }>;
  status: {
    total: number;
    online: number;
    offline: number;
    pending: number;
    error: number;
    withCredentials: number;
  };
  metrics: PainelIntegracoesMetrics;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4 text-sm">
        <Text>
          Online: <Text as="span" weight="semibold">{status.online}</Text>
        </Text>
        <Text>
          Offline: <Text as="span" weight="semibold">{status.offline}</Text>
        </Text>
        <Text>
          Pendente: <Text as="span" weight="semibold">{status.pending}</Text>
        </Text>
        <Text>
          Erro: <Text as="span" weight="semibold">{status.error}</Text>
        </Text>
        <Text>
          Com credenciais:{" "}
          <Text as="span" weight="semibold">{status.withCredentials}</Text>
        </Text>
      </div>

      <IntegrationMetricsPanel metrics={metrics} />

      {ORDER.map((category) => {
        const group = items.filter((i) => i.catalog.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} className="flex flex-col gap-3">
            <Heading level={4}>{CATEGORY_LABEL[category]}</Heading>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.map((item) => (
                <IntegrationCard
                  key={item.catalog.id}
                  catalog={item.catalog}
                  integration={item.integration}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <Heading level={4}>Histórico de sincronização</Heading>
          <IntegrationSyncHistory syncs={syncs} />
        </section>
        <section className="flex flex-col gap-3">
          <Heading level={4}>Logs</Heading>
          <IntegrationLogsPanel logs={logs} />
        </section>
      </div>
    </div>
  );
}
