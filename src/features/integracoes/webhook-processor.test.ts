import { describe, expect, it } from "vitest";

import { classifyWebhookEvent } from "./webhook-processor";

describe("webhook processor — classificação de eventos", () => {
  it("classifica pedidos iFood", () => {
    expect(
      classifyWebhookEvent("ifood", { code: "PLC", orderId: "o1" }).action,
    ).toBe("order_created");
    expect(
      classifyWebhookEvent("ifood", { code: "CAN", orderId: "o2" }).action,
    ).toBe("order_cancelled");
    expect(
      classifyWebhookEvent("ifood", { code: "CFM", orderId: "o3" }).action,
    ).toBe("order_status");
  });

  it("classifica pagamentos PIX", () => {
    expect(
      classifyWebhookEvent("mercado_pago", { type: "payment", id: "p1" }).action,
    ).toBe("payment");
    expect(classifyWebhookEvent("asaas", { event: "PAYMENT_RECEIVED" }).action).toBe(
      "payment",
    );
  });
});
