import type { ModuleSubNavLink } from "@/components/layout/module-sub-nav";

export const FINANCEIRO_SUB_NAV_LINKS: readonly ModuleSubNavLink[] = [
  { href: "/financeiro/painel", label: "Painel" },
  { href: "/financeiro/precificacao", label: "Precificação" },
  { href: "/financeiro/ponto-equilibrio", label: "Ponto de equilíbrio" },
  { href: "/financeiro/metas-vendas", label: "Metas de vendas" },
  { href: "/financeiro/custos-fixos", label: "Custos fixos" },
  { href: "/financeiro/custos-variaveis", label: "Custos variáveis" },
  { href: "/financeiro/canais", label: "Canais de venda" },
  { href: "/financeiro/simulador-promocoes", label: "Simulador de promoções" },
];
