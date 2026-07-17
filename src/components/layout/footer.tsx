import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-border bg-background border-t">
      <Container className="text-muted-foreground flex h-16 items-center justify-between text-sm">
        <span>&copy; {new Date().getFullYear()} Chef Hub Profissional</span>
        <span>Fundação — Sprint 01</span>
      </Container>
    </footer>
  );
}
