import { describe, expect, it } from "vitest";

import {
  blocosDoPapel,
  papelPodeVerBloco,
  papelTemPermissao,
} from "./permissions";

describe("dashboard permissions por papel", () => {
  it("owner vê financeiro, estoque, equipe, auditoria e configurações", () => {
    expect(papelTemPermissao("owner", "ver_financeiro")).toBe(true);
    expect(papelTemPermissao("owner", "ver_estoque")).toBe(true);
    expect(papelTemPermissao("owner", "ver_equipe")).toBe(true);
    expect(papelTemPermissao("owner", "ver_auditoria")).toBe(true);
    expect(papelTemPermissao("owner", "ver_configuracoes")).toBe(true);
    expect(blocosDoPapel("owner")).toContain("financeiro_executivo");
    expect(blocosDoPapel("owner")).toContain("auditoria_recente");
  });

  it("gerente vê auditoria da empresa, mas não equipe/configurações", () => {
    expect(papelTemPermissao("gerente", "ver_equipe")).toBe(false);
    expect(papelTemPermissao("gerente", "ver_configuracoes")).toBe(false);
    expect(papelTemPermissao("gerente", "ver_auditoria")).toBe(true);
    expect(papelPodeVerBloco("gerente", "auditoria_recente")).toBe(true);
    expect(papelPodeVerBloco("gerente", "estoque_critico")).toBe(true);
  });

  it("financeiro não vê estoque nem cozinha", () => {
    expect(papelTemPermissao("financeiro", "ver_estoque")).toBe(false);
    expect(papelTemPermissao("financeiro", "ver_cozinha")).toBe(false);
    expect(papelTemPermissao("financeiro", "ver_financeiro")).toBe(true);
    expect(papelPodeVerBloco("financeiro", "estoque_critico")).toBe(false);
    expect(papelPodeVerBloco("financeiro", "financeiro_executivo")).toBe(true);
  });

  it("garçom não vê financeiro", () => {
    expect(papelTemPermissao("garcom", "ver_financeiro")).toBe(false);
    expect(papelTemPermissao("garcom", "ver_estoque")).toBe(false);
    expect(papelTemPermissao("garcom", "ver_mesas")).toBe(true);
    expect(papelPodeVerBloco("garcom", "financeiro_executivo")).toBe(false);
    expect(papelPodeVerBloco("garcom", "mesas")).toBe(true);
  });

  it("cozinha não vê usuários nem financeiro", () => {
    expect(papelTemPermissao("cozinha", "ver_usuarios")).toBe(false);
    expect(papelTemPermissao("cozinha", "ver_financeiro")).toBe(false);
    expect(papelTemPermissao("cozinha", "ver_cozinha")).toBe(true);
  });

  it("caixa não vê auditoria nem estoque", () => {
    expect(papelTemPermissao("caixa", "ver_auditoria")).toBe(false);
    expect(papelTemPermissao("caixa", "ver_estoque")).toBe(false);
    expect(papelTemPermissao("caixa", "ver_caixa")).toBe(true);
    expect(papelPodeVerBloco("caixa", "caixa_turno")).toBe(true);
    expect(papelPodeVerBloco("caixa", "auditoria_recente")).toBe(false);
  });
});
