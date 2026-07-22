import type { ModuleSubNavLink } from "@/components/layout/module-sub-nav";

export const CRM_SUB_NAV_LINKS: readonly ModuleSubNavLink[] = [
  { href: "/crm", label: "Dashboard", exact: true },
  { href: "/crm/fidelidade", label: "Fidelidade" },
  { href: "/crm/cupons", label: "Cupons" },
  { href: "/crm/segmentos", label: "Segmentos" },
  { href: "/crm/campanhas", label: "Campanhas" },
  { href: "/clientes", label: "Clientes" },
];
