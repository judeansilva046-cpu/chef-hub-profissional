import { describe, expect, it } from "vitest";

import {
  caminhoCasaDoPapel,
  filtrarLinksPorPapel,
  podeAcessarRota,
} from "./permissoes-rota";

describe("permissoes-rota", () => {
  it("owner acessa qualquer rota", () => {
    expect(podeAcessarRota("owner", "/equipe")).toBe(true);
    expect(podeAcessarRota("owner", "/integracoes")).toBe(true);
  });

  it("gerente acessa operação/gestão/monitoramento mas não admin (equipe/integrações)", () => {
    expect(podeAcessarRota("gerente", "/financeiro/painel")).toBe(true);
    expect(podeAcessarRota("gerente", "/estoque")).toBe(true);
    expect(podeAcessarRota("gerente", "/admin")).toBe(true);
    expect(podeAcessarRota("gerente", "/equipe")).toBe(false);
    expect(podeAcessarRota("gerente", "/integracoes")).toBe(false);
  });

  it("financeiro acessa finanças/relatórios/vendas/clientes/crm/bi", () => {
    expect(podeAcessarRota("financeiro", "/dashboard")).toBe(true);
    expect(podeAcessarRota("financeiro", "/financeiro")).toBe(true);
    expect(podeAcessarRota("financeiro", "/relatorios")).toBe(true);
    expect(podeAcessarRota("financeiro", "/crm")).toBe(true);
    expect(podeAcessarRota("financeiro", "/bi")).toBe(true);
    expect(podeAcessarRota("financeiro", "/bi/financeiro")).toBe(true);
    expect(podeAcessarRota("financeiro", "/estoque")).toBe(false);
    expect(podeAcessarRota("financeiro", "/kds")).toBe(false);
    expect(podeAcessarRota("financeiro", "/mesas")).toBe(false);
  });

  it("caixa acessa PDV/caixa/crm e não acessa KDS/equipe", () => {
    expect(podeAcessarRota("caixa", "/pdv")).toBe(true);
    expect(podeAcessarRota("caixa", "/caixa/abc")).toBe(true);
    expect(podeAcessarRota("caixa", "/crm/cupons")).toBe(true);
    expect(podeAcessarRota("caixa", "/kds")).toBe(false);
    expect(podeAcessarRota("caixa", "/equipe")).toBe(false);
    expect(podeAcessarRota("caixa", "/estoque")).toBe(false);
  });

  it("cozinha acessa KDS e não acessa PDV/caixa", () => {
    expect(podeAcessarRota("cozinha", "/kds")).toBe(true);
    expect(podeAcessarRota("cozinha", "/fichas-tecnicas/1/editar")).toBe(true);
    expect(podeAcessarRota("cozinha", "/pdv")).toBe(false);
    expect(podeAcessarRota("cozinha", "/caixa")).toBe(false);
  });

  it("garçom acessa mesas/PDV/crm e não acessa financeiro", () => {
    expect(podeAcessarRota("garcom", "/mesas/1")).toBe(true);
    expect(podeAcessarRota("garcom", "/pdv")).toBe(true);
    expect(podeAcessarRota("garcom", "/crm")).toBe(true);
    expect(podeAcessarRota("garcom", "/financeiro")).toBe(false);
    expect(podeAcessarRota("garcom", "/kds")).toBe(false);
  });

  it("gerente acessa CRM, BI e ChefHub AI", () => {
    expect(podeAcessarRota("gerente", "/crm/campanhas")).toBe(true);
    expect(podeAcessarRota("gerente", "/bi/vendas")).toBe(true);
    expect(podeAcessarRota("gerente", "/ai")).toBe(true);
  });

  it("caixa não acessa BI nem AI", () => {
    expect(podeAcessarRota("caixa", "/bi")).toBe(false);
    expect(podeAcessarRota("caixa", "/ai")).toBe(false);
  });

  it("financeiro acessa ChefHub AI", () => {
    expect(podeAcessarRota("financeiro", "/ai")).toBe(true);
  });

  it("home padrão por papel", () => {
    expect(caminhoCasaDoPapel("caixa")).toBe("/pdv");
    expect(caminhoCasaDoPapel("cozinha")).toBe("/kds");
    expect(caminhoCasaDoPapel("garcom")).toBe("/mesas");
    expect(caminhoCasaDoPapel("financeiro")).toBe("/dashboard");
  });

  it("filtra links da nav pelo papel", () => {
    const links = [
      { href: "/pdv", label: "PDV" },
      { href: "/kds", label: "KDS" },
      { href: "/equipe", label: "Equipe" },
      { href: "/financeiro", label: "Financeiro" },
    ];
    expect(filtrarLinksPorPapel(links, "caixa").map((l) => l.href)).toEqual([
      "/pdv",
    ]);
    expect(filtrarLinksPorPapel(links, "owner")).toHaveLength(4);
    expect(filtrarLinksPorPapel(links, "gerente").map((l) => l.href)).toEqual([
      "/pdv",
      "/kds",
      "/financeiro",
    ]);
    expect(filtrarLinksPorPapel(links, "financeiro").map((l) => l.href)).toEqual([
      "/financeiro",
    ]);
  });
});
