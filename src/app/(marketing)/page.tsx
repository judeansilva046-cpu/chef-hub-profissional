import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  Heading,
  Input,
  Label,
  Section,
  Separator,
  Text,
} from "@/components/ui";

const colorTokens = [
  { name: "primary", bg: "bg-primary", fg: "text-primary-foreground" },
  { name: "secondary", bg: "bg-secondary", fg: "text-secondary-foreground" },
  { name: "muted", bg: "bg-muted", fg: "text-muted-foreground" },
  { name: "accent", bg: "bg-accent", fg: "text-accent-foreground" },
  { name: "success", bg: "bg-success", fg: "text-success-foreground" },
  { name: "warning", bg: "bg-warning", fg: "text-warning-foreground" },
  { name: "danger", bg: "bg-danger", fg: "text-danger-foreground" },
  { name: "info", bg: "bg-info", fg: "text-info-foreground" },
] as const;

const typeScale = [
  { label: "text-xs", className: "text-xs" },
  { label: "text-sm", className: "text-sm" },
  { label: "text-base", className: "text-base" },
  { label: "text-lg", className: "text-lg" },
  { label: "text-xl", className: "text-xl" },
  { label: "text-2xl", className: "text-2xl" },
  { label: "text-3xl", className: "text-3xl" },
  { label: "text-4xl", className: "text-4xl" },
] as const;

const spacingScale = [
  { label: "1 (4px)", className: "w-1" },
  { label: "2 (8px)", className: "w-2" },
  { label: "4 (16px)", className: "w-4" },
  { label: "6 (24px)", className: "w-6" },
  { label: "8 (32px)", className: "w-8" },
  { label: "12 (48px)", className: "w-12" },
  { label: "16 (64px)", className: "w-16" },
] as const;

export default function Home() {
  return (
    <>
      <Section className="border-border bg-secondary/40 border-b">
        <Container className="flex flex-col gap-4">
          <Badge variant="outline" className="w-fit">
            Fundação — Sprint 01
          </Badge>
          <Heading level={1}>Design System do Chef Hub Profissional</Heading>
          <Text size="lg" tone="muted" className="max-w-2xl">
            Plataforma de gestão inteligente para restaurantes, delivery, dark
            kitchens, padarias, confeitarias, cafeterias e pequenos produtores
            de alimentos. Esta página reúne os tokens e componentes que
            sustentam toda a interface — nenhuma funcionalidade de negócio foi
            implementada ainda.
          </Text>
          <Text size="sm" tone="muted">
            Use o botão no canto superior direito do cabeçalho para alternar
            entre os temas claro e escuro.
          </Text>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-6">
          <Heading level={3}>Cores</Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {colorTokens.map((token) => (
              <div
                key={token.name}
                className={`flex h-20 flex-col justify-end rounded-lg p-3 ${token.bg} ${token.fg}`}
              >
                <span className="text-xs font-medium">{token.name}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-border border-t">
        <Container className="flex flex-col gap-6">
          <Heading level={3}>Tipografia</Heading>
          <div className="flex flex-col gap-3">
            {typeScale.map((item) => (
              <div key={item.label} className="flex items-baseline gap-4">
                <span className="text-muted-foreground w-24 shrink-0 font-mono text-xs">
                  {item.label}
                </span>
                <span className={item.className}>Chef Hub Profissional</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-border border-t">
        <Container className="flex flex-col gap-6">
          <Heading level={3}>Espaçamento</Heading>
          <div className="flex flex-col gap-3">
            {spacingScale.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="text-muted-foreground w-20 shrink-0 font-mono text-xs">
                  {item.label}
                </span>
                <div className={`bg-primary h-4 rounded ${item.className}`} />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-border border-t">
        <Container className="flex flex-col gap-6">
          <Heading level={3}>Botões</Heading>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Container>
      </Section>

      <Section className="border-border border-t">
        <Container className="flex flex-col gap-6">
          <Heading level={3}>Badges</Heading>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Container>
      </Section>

      <Section className="border-border border-t">
        <Container className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ficha técnica</CardTitle>
              <CardDescription>
                Exemplo estático de cartão do Design System.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text tone="muted">
                Cartões (Card) organizam conteúdo em blocos com cabeçalho, corpo
                e rodapé consistentes em toda a plataforma.
              </Text>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Ação secundária
              </Button>
              <Button size="sm">Ação primária</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campo de formulário</CardTitle>
              <CardDescription>
                Estrutura visual de Input e Label, sem validação.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="demo-name">Nome do produto</Label>
                <Input id="demo-name" placeholder="Ex: Pão de queijo" />
              </div>
              <Separator />
              <Text size="sm" tone="muted">
                Componentes de formulário desta sprint são apenas estruturais —
                regras de negócio chegam em sprints futuras.
              </Text>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </>
  );
}
