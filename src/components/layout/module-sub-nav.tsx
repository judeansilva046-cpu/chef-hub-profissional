"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface ModuleSubNavLink {
  href: string;
  label: string;
  /** Quando ausente, ativo apenas em correspondência exata (evita a raiz do módulo ficar sempre marcada). */
  exact?: boolean;
}

export interface ModuleSubNavProps {
  links: readonly ModuleSubNavLink[];
  className?: string;
}

/** Sub-navegação de um módulo (ex: Estoque, Compras), baseada na rota atual — mesmo visual do Tabs, mas navegando entre páginas de verdade. */
export function ModuleSubNav({ links, className }: ModuleSubNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "bg-secondary inline-flex flex-wrap items-center gap-1 rounded-md p-1",
        className,
      )}
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
