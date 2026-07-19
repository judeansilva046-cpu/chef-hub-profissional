import {
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    // `relative`: torna este wrapper o containing block dos descendentes
    // absolutamente posicionados (ex: <span className="sr-only"> em botões
    // de ícone dentro de TableCell) — sem isso, overflow-x-auto clipa/rola
    // o conteúdo visual normalmente, mas um elemento position:absolute
    // "escapa" desse clipping para o containing block mais próximo acima,
    // inflando document.documentElement.scrollWidth mesmo invisível (bug
    // só visível em tabelas largas o bastante para rolar em mobile).
    <div className="border-border relative w-full overflow-x-auto rounded-lg border">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-secondary text-muted-foreground text-left", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-border divide-y", className)} {...props} />
  );
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("hover:bg-secondary/50 transition-colors", className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
