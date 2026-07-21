import type { PapelEmpresa } from "./permissoes-rota";

export const PAPEIS_CAIXA = ["caixa"] as const satisfies readonly PapelEmpresa[];

export const PAPEIS_COZINHA = [
  "cozinha",
] as const satisfies readonly PapelEmpresa[];

export const PAPEIS_GARCOM = [
  "garcom",
] as const satisfies readonly PapelEmpresa[];

export const PAPEIS_SALA = [
  "caixa",
  "garcom",
] as const satisfies readonly PapelEmpresa[];

export const PAPEIS_EXPEDICAO = [
  "caixa",
  "garcom",
] as const satisfies readonly PapelEmpresa[];

/** Módulo financeiro (custos, metas, canais) — além de owner/gerente. */
export const PAPEIS_FINANCEIRO = [
  "financeiro",
] as const satisfies readonly PapelEmpresa[];

/**
 * Back-office operacional (estoque, compras, cardápio mutável).
 * `requirePapel()` sem args: owner + gerente.
 */
export const PAPEIS_GESTAO = [] as const satisfies readonly PapelEmpresa[];
