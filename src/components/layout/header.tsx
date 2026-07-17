import { Container } from "@/components/ui/container";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header className="border-border bg-background border-b">
      <Container className="flex h-16 items-center justify-between">
        <span className="text-foreground text-lg font-semibold tracking-tight">
          Chef Hub <span className="text-primary">Profissional</span>
        </span>
        <ThemeToggle />
      </Container>
    </header>
  );
}
