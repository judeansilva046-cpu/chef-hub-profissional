import type { ModuleSubNavLink } from "@/components/layout/module-sub-nav";

export const ESTOQUE_SUB_NAV_LINKS: readonly ModuleSubNavLink[] = [
  { href: "/estoque", label: "Visão geral", exact: true },
  { href: "/estoque/inteligente", label: "Inteligente" },
  { href: "/estoque/sugestoes", label: "Sugestões" },
  { href: "/estoque/perdas", label: "Perdas" },
  { href: "/estoque/movimentacoes", label: "Movimentações" },
  { href: "/estoque/lotes", label: "Lotes e validade" },
  { href: "/estoque/inventarios", label: "Inventários" },
  { href: "/estoque/etiquetas", label: "Etiquetas" },
];
