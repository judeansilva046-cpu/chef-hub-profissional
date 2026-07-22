import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      const api = {
        select: () => api,
        eq: () => api,
        limit: () => api,
        maybeSingle: async () => ({ data: null }),
        insert: async () => ({ error: null }),
      };
      if (table === "integrations") return api;
      return api;
    },
  }),
}));

vi.mock("@/server/observabilidade/logs", () => ({
  registrarLog: vi.fn(),
}));

import { processWebhookInbox } from "./webhook-inbox";

describe("webhook inbox", () => {
  const prev = process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED;

  afterEach(() => {
    if (prev === undefined) delete process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED;
    else process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED = prev;
  });

  it("rejeita provedor desconhecido", async () => {
    const result = await processWebhookInbox({
      provider: "desconhecido",
      rawBody: "{}",
      headers: new Headers(),
    });
    expect(result.status).toBe(404);
  });

  it("rejeita assinatura inválida em modo live sem flag", async () => {
    const prevMode = process.env.INTEGRACOES_MODE;
    process.env.INTEGRACOES_MODE = "live";
    delete process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED;
    try {
      const result = await processWebhookInbox({
        provider: "ifood",
        rawBody: JSON.stringify({ orderId: "1" }),
        headers: new Headers(),
      });
      expect(result.status).toBe(401);
    } finally {
      if (prevMode === undefined) delete process.env.INTEGRACOES_MODE;
      else process.env.INTEGRACOES_MODE = prevMode;
    }
  });

  it("aceita unsigned em homologação (padrão Sprint 18)", async () => {
    process.env.INTEGRACOES_MODE = "homolog";
    delete process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED;
    const result = await processWebhookInbox({
      provider: "ifood",
      rawBody: JSON.stringify({ orderId: "1" }),
      headers: new Headers(),
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });
});
