import type { ModuleSubNavLink } from "@/components/layout/module-sub-nav";

export const COMPRAS_SUB_NAV_LINKS: readonly ModuleSubNavLink[] = [
  { href: "/compras/dashboard", label: "Dashboard" },
  { href: "/compras/pedidos", label: "Pedidos" },
  { href: "/compras/solicitacoes", label: "Solicitações" },
  { href: "/compras/cotacoes", label: "Cotações" },
  { href: "/compras/fornecedores", label: "Fornecedores" },
  { href: "/compras/precos", label: "Comparativo de preços" },
  { href: "/compras/aprovacao", label: "Fluxo de aprovação" },
  { href: "/compras/relatorios", label: "Relatórios" },
  { href: "/financeiro/permissoes", label: "Permissões" },
];
