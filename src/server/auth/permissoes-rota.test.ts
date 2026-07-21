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

  it("financeiro acessa só finanças/relatórios/vendas/clientes", () => {
    expect(podeAcessarRota("financeiro", "/dashboard")).toBe(true);
    expect(podeAcessarRota("financeiro", "/financeiro")).toBe(true);
    expect(podeAcessarRota("financeiro", "/relatorios")).toBe(true);
    expect(podeAcessarRota("financeiro", "/estoque")).toBe(false);
    expect(podeAcessarRota("financeiro", "/kds")).toBe(false);
    expect(podeAcessarRota("financeiro", "/mesas")).toBe(false);
  });

  it("caixa acessa PDV/caixa e não acessa KDS/equipe", () => {
    expect(podeAcessarRota("caixa", "/pdv")).toBe(true);
    expect(podeAcessarRota("caixa", "/caixa/abc")).toBe(true);
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

  it("garçom acessa mesas/PDV e não acessa financeiro", () => {
    expect(podeAcessarRota("garcom", "/mesas/1")).toBe(true);
    expect(podeAcessarRota("garcom", "/pdv")).toBe(true);
    expect(podeAcessarRota("garcom", "/financeiro")).toBe(false);
    expect(podeAcessarRota("garcom", "/kds")).toBe(false);
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
