import type { BiDashboardId } from "./types";

export const BI_NAV: Array<{ id: BiDashboardId; href: string; label: string }> = [
  { id: "visao_geral", href: "/bi", label: "Visão geral" },
  { id: "financeiro", href: "/bi/financeiro", label: "Financeiro" },
  { id: "vendas", href: "/bi/vendas", label: "Vendas" },
  { id: "delivery", href: "/bi/delivery", label: "Delivery" },
  { id: "salao", href: "/bi/salao", label: "Salão" },
  { id: "estoque", href: "/bi/estoque", label: "Estoque" },
  { id: "crm", href: "/bi/crm", label: "CRM" },
  { id: "kds", href: "/bi/kds", label: "KDS" },
  { id: "funcionarios", href: "/bi/funcionarios", label: "Funcionários" },
  { id: "metas", href: "/bi/metas", label: "Metas" },
];
