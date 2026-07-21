import { describe, expect, it } from "vitest";

import {
  caminhoCasaDoPapel,
  filtrarLinksPorPapel,
  podeAcessarRota,
} from "./permissoes-rota";

describe("permissoes-rota", () => {
  it("owner e gerente acessam qualquer rota", () => {
    expect(podeAcessarRota("owner", "/equipe")).toBe(true);
    expect(podeAcessarRota("gerente", "/financeiro/painel")).toBe(true);
    expect(podeAcessarRota("gerente", "/integracoes")).toBe(true);
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
  });

  it("filtra links da nav pelo papel", () => {
    const links = [
      { href: "/pdv", label: "PDV" },
      { href: "/kds", label: "KDS" },
      { href: "/equipe", label: "Equipe" },
    ];
    expect(filtrarLinksPorPapel(links, "caixa").map((l) => l.href)).toEqual([
      "/pdv",
    ]);
    expect(filtrarLinksPorPapel(links, "owner")).toHaveLength(3);
  });
});
