import { describe, expect, it } from "vitest";

import {
  assertSemVazamentoEntreEmpresas,
  filtrarPorEmpresaId,
  podeVerObservabilidade,
} from "./permissions";
import { montarTimeline, tituloEventoAuditoria } from "./timeline";

describe("observabilidade permissions", () => {
  it("somente owner e gerente veem monitoramento", () => {
    expect(podeVerObservabilidade("owner")).toBe(true);
    expect(podeVerObservabilidade("gerente")).toBe(true);
    expect(podeVerObservabilidade("financeiro")).toBe(false);
    expect(podeVerObservabilidade("caixa")).toBe(false);
    expect(podeVerObservabilidade("cozinha")).toBe(false);
    expect(podeVerObservabilidade("garcom")).toBe(false);
    expect(podeVerObservabilidade(null)).toBe(false);
  });

  it("filtra auditoria por empresa (isolamento)", () => {
    const rows = [
      { id: "1", empresa_id: "emp-a" },
      { id: "2", empresa_id: "emp-b" },
      { id: "3", empresa_id: "emp-a" },
    ];
    const filtrados = filtrarPorEmpresaId(rows, "emp-a");
    expect(filtrados).toHaveLength(2);
    expect(assertSemVazamentoEntreEmpresas(filtrados, "emp-a")).toBe(true);
    expect(assertSemVazamentoEntreEmpresas(rows, "emp-a")).toBe(false);
  });
});

describe("observabilidade timeline", () => {
  it("monta rótulos de ciclo de pedido", () => {
    expect(
      tituloEventoAuditoria("status", "pedidos", { status: "confirmado" }),
    ).toBe("Pedido enviado à cozinha");
    expect(
      tituloEventoAuditoria("status", "pedidos", { status: "em_preparo" }),
    ).toBe("Pedido em preparo");
    expect(
      tituloEventoAuditoria("status", "pedidos", { status: "pronto" }),
    ).toBe("Pedido pronto");
    expect(
      tituloEventoAuditoria("status", "pedidos", { status: "entregue" }),
    ).toBe("Pedido entregue");
    expect(tituloEventoAuditoria("pagamento", "pagamentos")).toBe(
      "Pagamento realizado",
    );
    expect(
      tituloEventoAuditoria("status", "caixas", { fechado: true }),
    ).toBe("Fechamento de caixa");
  });

  it("ordena timeline a partir de eventos", () => {
    const items = montarTimeline([
      {
        id: "a",
        acao: "criar",
        entidade: "pedidos",
        valor_novo: { status: "rascunho" },
        criado_em: "2026-07-21T10:00:00Z",
      },
      {
        id: "b",
        acao: "pagamento",
        entidade: "pagamentos",
        criado_em: "2026-07-21T11:00:00Z",
      },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]!.titulo).toBe("Pedido criado");
    expect(items[1]!.titulo).toBe("Pagamento realizado");
  });
});
