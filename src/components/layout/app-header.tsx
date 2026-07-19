import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logout } from "@/features/auth/actions";
import type { Tables } from "@/lib/supabase/database.types";

import { EmpresaSwitcher } from "./empresa-switcher";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/pdv", label: "PDV" },
  { href: "/caixa", label: "Caixa" },
  { href: "/mesas", label: "Mesas" },
  { href: "/kds", label: "KDS" },
  { href: "/expedicao", label: "Expedição" },
  { href: "/fichas-tecnicas", label: "Fichas técnicas" },
  { href: "/vendas", label: "Vendas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/crm/dashboard", label: "CRM" },
  { href: "/estoque", label: "Estoque" },
  { href: "/compras", label: "Compras" },
  { href: "/producao", label: "Produção" },
  { href: "/lista-compras", label: "Lista de compras" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/integracoes", label: "Integrações" },
  { href: "/ingredientes", label: "Ingredientes" },
  { href: "/categorias", label: "Categorias" },
  { href: "/unidades-medida", label: "Unidades de medida" },
] as const;

export interface AppHeaderProps {
  empresas: Tables<"empresas">[];
  empresaAtualId: string;
}

export function AppHeader({ empresas, empresaAtualId }: AppHeaderProps) {
  return (
    <header className="border-border bg-background border-b">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/fichas-tecnicas"
          className="text-foreground shrink-0 text-lg font-semibold tracking-tight"
        >
          Chef Hub <span className="text-primary">Profissional</span>
        </Link>

        <div className="flex items-center gap-3">
          <EmpresaSwitcher
            empresas={empresas}
            empresaAtualId={empresaAtualId}
          />
          <ThemeToggle />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </Container>

      <nav className="border-border flex items-center gap-4 overflow-x-auto border-t px-4 py-2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground shrink-0 text-sm font-medium transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
