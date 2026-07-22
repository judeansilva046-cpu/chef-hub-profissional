export type PapelEmpresa =
  | "owner"
  | "gerente"
  | "financeiro"
  | "caixa"
  | "cozinha"
  | "garcom";

/**
 * Prefixos de rota permitidos por papel.
 * Matching: pathname === prefixo OU pathname.startsWith(prefixo + "/").
 *
 * Gerente tem gestão operacional, mas NÃO admin de sistema
 * (`/equipe`, `/integracoes`).
 */
export const PREFIXOS_POR_PAPEL: Record<PapelEmpresa, "*" | readonly string[]> =
  {
    owner: "*",
    gerente: [
      "/dashboard",
      "/admin",
      "/pedidos",
      "/pdv",
      "/caixa",
      "/mesas",
      "/kds",
      "/expedicao",
      "/fichas-tecnicas",
      "/ingredientes",
      "/categorias",
      "/unidades-medida",
      "/estoque",
      "/compras",
      "/producao",
      "/lista-compras",
      "/vendas",
      "/clientes",
      "/crm",
      "/bi",
      "/ai",
      "/financeiro",
      "/relatorios",
    ],
    financeiro: [
      "/dashboard",
      "/financeiro",
      "/relatorios",
      "/vendas",
      "/clientes",
      "/crm",
      "/bi",
      "/ai",
    ],
    caixa: [
      "/dashboard",
      "/pedidos",
      "/pdv",
      "/caixa",
      "/expedicao",
      "/vendas",
      "/clientes",
      "/crm",
    ],
    cozinha: [
      "/dashboard",
      "/pedidos",
      "/kds",
      "/producao",
      "/fichas-tecnicas",
    ],
    garcom: [
      "/dashboard",
      "/pedidos",
      "/pdv",
      "/mesas",
      "/expedicao",
      "/clientes",
      "/crm",
    ],
  };

/** Home padrão quando o usuário tenta uma rota fora do escopo do papel. */
export const HOME_POR_PAPEL: Record<PapelEmpresa, string> = {
  owner: "/dashboard",
  gerente: "/dashboard",
  financeiro: "/dashboard",
  caixa: "/pdv",
  cozinha: "/kds",
  garcom: "/mesas",
};

const ROTAS_PUBLICAS_APP = new Set(["/onboarding"]);

export function caminhoCasaDoPapel(papel: PapelEmpresa): string {
  return HOME_POR_PAPEL[papel];
}

export function podeAcessarRota(
  papel: PapelEmpresa,
  pathname: string,
): boolean {
  if (ROTAS_PUBLICAS_APP.has(pathname)) {
    return true;
  }

  const prefixos = PREFIXOS_POR_PAPEL[papel];
  if (prefixos === "*") {
    return true;
  }

  return prefixos.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`),
  );
}

export function filtrarLinksPorPapel<T extends { href: string }>(
  links: readonly T[],
  papel: PapelEmpresa | null,
): T[] {
  if (!papel) {
    return [...links];
  }

  return links.filter((link) => podeAcessarRota(papel, link.href));
}
