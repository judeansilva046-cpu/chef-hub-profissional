import type { PapelEmpresa } from "./permissoes-rota";

/**
 * Conjuntos de papéis operacionais para Server Actions.
 * `owner` e `gerente` passam automaticamente em `requirePapel` — listar só
 * os papéis de chão de loja.
 */
export const PAPEIS_CAIXA = ["caixa"] as const satisfies readonly PapelEmpresa[];

export const PAPEIS_COZINHA = [
  "cozinha",
] as const satisfies readonly PapelEmpresa[];

export const PAPEIS_GARCOM = [
  "garcom",
] as const satisfies readonly PapelEmpresa[];

/** PDV, montagem/confirmação de pedidos e clientes de sala. */
export const PAPEIS_SALA = [
  "caixa",
  "garcom",
] as const satisfies readonly PapelEmpresa[];

/** Expedição (retirada/entrega). */
export const PAPEIS_EXPEDICAO = [
  "caixa",
  "garcom",
] as const satisfies readonly PapelEmpresa[];

/**
 * Back-office (estoque, compras, financeiro, cardápio mutável, integrações).
 * Só owner/gerente — chamar `requirePapel()` sem argumentos extras, ou
 * `requirePapel(...PAPEIS_GESTAO)` (lista vazia = só gestão plena).
 */
export const PAPEIS_GESTAO = [] as const satisfies readonly PapelEmpresa[];
