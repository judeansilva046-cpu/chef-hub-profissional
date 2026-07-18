"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "theme";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // localStorage indisponível (modo privado, etc.) — tema não persiste.
  }
}

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Botão de alternância claro/escuro. Não depende de estado React: lê e
 * escreve diretamente o atributo data-theme em <html>, o mesmo mecanismo
 * usado pelo script inline anti-flash em app/layout.tsx (ver
 * docs/DESIGN-SYSTEM.md). Os ícones são exibidos via CSS puro
 * (data-icon + seletor [data-theme]) para nunca divergir entre servidor e
 * cliente.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema claro/escuro"
      className={cn(
        "border-border text-foreground hover:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <Sun data-icon="sun" className="h-4 w-4" />
      <Moon data-icon="moon" className="h-4 w-4" />
      <span className="sr-only">Alternar tema</span>
    </button>
  );
}
