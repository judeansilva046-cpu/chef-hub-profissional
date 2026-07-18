import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Constrói o href de uma página específica, preservando outros filtros/busca da URL atual. */
  createHref: (page: number) => string;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  createHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginação"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <PaginationLink
        href={hasPrevious ? createHref(page - 1) : undefined}
        disabled={!hasPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </PaginationLink>

      <span className="text-muted-foreground text-sm">
        Página {page} de {totalPages}
      </span>

      <PaginationLink
        href={hasNext ? createHref(page + 1) : undefined}
        disabled={!hasNext}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
    disabled && "pointer-events-none opacity-50",
  );

  if (!href) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
