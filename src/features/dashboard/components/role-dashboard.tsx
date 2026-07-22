import {
  ChefHat,
  ClipboardList,
  CookingPot,
  CreditCard,
  Package,
  PlusCircle,
  Receipt,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

import type { DashboardData } from "../queries-por-papel";
import { tituloDashboard } from "../permissions";
import { DashboardCard } from "./dashboard-card";
import { DashboardLayout } from "./dashboard-layout";
import { DashboardSection } from "./dashboard-section";
import { MetricCard } from "./metric-card";
import { PermissionGate } from "./permission-gate";
import { QuickAction } from "./quick-action";

function MetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}

function AcoesPorPapel({ papel }: { papel: PapelEmpresa }) {
  const acoes: Record<
    PapelEmpresa,
    Array<{ href: string; label: string; icon?: typeof PlusCircle }>
  > = {
    owner: [
      { href: "/pedidos/novo", label: "Novo pedido", icon: PlusCircle },
      { href: "/pdv", label: "Abrir PDV", icon: CreditCard },
      { href: "/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/equipe", label: "Equipe", icon: Users },
    ],
    gerente: [
      { href: "/pedidos/novo", label: "Novo pedido", icon: PlusCircle },
      { href: "/kds", label: "KDS", icon: CookingPot },
      { href: "/estoque", label: "Estoque", icon: Package },
      { href: "/mesas", label: "Mesas", icon: UtensilsCrossed },
    ],
    financeiro: [
      { href: "/financeiro", label: "Painel financeiro", icon: Wallet },
      { href: "/financeiro/painel", label: "Nunca no vermelho", icon: Receipt },
      { href: "/relatorios", label: "Relatórios", icon: ClipboardList },
      { href: "/vendas", label: "Vendas", icon: CreditCard },
    ],
    caixa: [
      { href: "/pdv", label: "PDV", icon: CreditCard },
      { href: "/caixa", label: "Caixa", icon: Wallet },
      { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    ],
    cozinha: [
      { href: "/kds", label: "Fila KDS", icon: CookingPot },
      { href: "/producao", label: "Produção", icon: ChefHat },
      { href: "/expedicao", label: "Expedição", icon: Package },
    ],
    garcom: [
      { href: "/pedidos/novo", label: "Novo pedido", icon: PlusCircle },
      { href: "/mesas", label: "Mesas", icon: UtensilsCrossed },
      { href: "/pdv", label: "PDV", icon: CreditCard },
      { href: "/clientes", label: "Clientes", icon: Users },
    ],
  };

  return (
    <div className="flex flex-wrap gap-2">
      {acoes[papel].map((acao) => (
        <QuickAction
          key={acao.href + acao.label}
          href={acao.href}
          label={acao.label}
          icon={acao.icon}
        />
      ))}
    </div>
  );
}

export function RoleDashboard({ data }: { data: DashboardData }) {
  const { papel } = data;

  return (
    <DashboardLayout
      title={tituloDashboard(papel)}
      description="Indicadores filtrados pelo seu papel — dados carregados só para o que você pode ver (RBAC + RLS)."
      toolbar={<AcoesPorPapel papel={papel} />}
    >
      <PermissionGate papel={papel} permissao="ver_financeiro">
        {data.financeiro ? (
          <DashboardSection title="Financeiro">
            <MetricsGrid>
              <MetricCard
                label="Faturamento do dia"
                value={formatarMoeda(data.financeiro.faturamentoDia)}
                icon={Wallet}
              />
              <MetricCard
                label="Faturamento do mês"
                value={formatarMoeda(data.financeiro.faturamentoMes)}
                icon={Receipt}
              />
              <MetricCard
                label="Lucro estimado"
                value={formatarMoeda(data.financeiro.lucroEstimado)}
                tone={data.financeiro.lucroEstimado < 0 ? "danger" : "success"}
              />
              <MetricCard
                label="CMV"
                value={
                  data.financeiro.cmvPercentual != null
                    ? formatarPercentual(data.financeiro.cmvPercentual)
                    : "—"
                }
              />
              <MetricCard
                label="Margem"
                value={
                  data.financeiro.margemPercentual != null
                    ? formatarPercentual(data.financeiro.margemPercentual)
                    : "—"
                }
              />
              <MetricCard
                label="Ticket médio"
                value={
                  data.financeiro.ticketMedio != null
                    ? formatarMoeda(data.financeiro.ticketMedio)
                    : "—"
                }
              />
              <MetricCard
                label="A receber (pedidos abertos)"
                value={formatarMoeda(data.financeiro.contasReceberEstimado)}
                hint="Saldo em aberto vs pagamentos"
              />
              <MetricCard
                label="Compras em aberto"
                value={String(data.financeiro.contasPagarEstimado)}
                hint="Pedidos de compra pendentes (qtd)"
              />
              {papel === "financeiro" || papel === "owner" ? (
                <MetricCard
                  label="Fluxo de caixa (turno)"
                  value={formatarMoeda(data.financeiro.fluxoCaixaDia)}
                  hint="Vendas + suprimentos − sangrias do caixa aberto"
                />
              ) : null}
            </MetricsGrid>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      {data.vendas ? (
        <DashboardSection title="Vendas">
          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardCard title="Produtos mais vendidos">
              {data.vendas.topProdutos.length === 0 ? (
                <Text tone="muted" size="sm">
                  Sem vendas no período.
                </Text>
              ) : (
                <ul className="space-y-2">
                  {data.vendas.topProdutos.map((p) => (
                    <li
                      key={p.nome}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate">{p.nome}</span>
                      <span className="text-muted-foreground shrink-0">
                        {p.quantidade} · {formatarMoeda(p.faturamento)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
            <DashboardCard title="Por canal">
              {data.vendas.porCanal.length === 0 ? (
                <Text tone="muted" size="sm">
                  Sem dados de canal.
                </Text>
              ) : (
                <ul className="space-y-2">
                  {data.vendas.porCanal.map((c) => (
                    <li
                      key={c.nome}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>{c.nome}</span>
                      <span className="text-muted-foreground">
                        {formatarMoeda(c.faturamento)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>
        </DashboardSection>
      ) : null}

      {data.pedidos ? (
        <DashboardSection title="Pedidos">
          <MetricsGrid>
            <MetricCard
              label="Em andamento"
              value={String(data.pedidos.emAndamento)}
              icon={ClipboardList}
            />
            <MetricCard
              label="Aguardando pagamento"
              value={String(data.pedidos.aguardandoPagamento)}
              tone="warning"
            />
            <MetricCard
              label="Em preparo"
              value={String(data.pedidos.em_preparo)}
            />
            <MetricCard label="Prontos" value={String(data.pedidos.pronto)} />
            {papel === "owner" || papel === "gerente" ? (
              <>
                <MetricCard
                  label="Finalizados (mês)"
                  value={String(data.pedidos.entregue)}
                />
                <MetricCard
                  label="Cancelados (mês)"
                  value={String(data.pedidos.cancelado)}
                  tone={data.pedidos.cancelado > 0 ? "danger" : "default"}
                />
              </>
            ) : null}
          </MetricsGrid>
        </DashboardSection>
      ) : null}

      <PermissionGate papel={papel} permissao="ver_estoque">
        {data.estoque ? (
          <DashboardSection title="Estoque crítico">
            <MetricsGrid>
              <MetricCard
                label="Abaixo do mínimo"
                value={String(data.estoque.abaixoDoMinimo)}
                tone={data.estoque.abaixoDoMinimo > 0 ? "danger" : "default"}
                icon={Package}
              />
              <MetricCard
                label="Lotes vencendo (7 dias)"
                value={String(data.estoque.lotesVencendoEm7Dias)}
                tone={
                  data.estoque.lotesVencendoEm7Dias > 0 ? "warning" : "default"
                }
              />
            </MetricsGrid>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      <PermissionGate papel={papel} permissao="ver_mesas">
        {data.mesas ? (
          <DashboardSection title="Mesas">
            <MetricsGrid>
              <MetricCard label="Ocupadas" value={String(data.mesas.ocupadas)} />
              <MetricCard label="Livres" value={String(data.mesas.livres)} />
              <MetricCard label="Total" value={String(data.mesas.total)} />
            </MetricsGrid>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      <PermissionGate papel={papel} permissao="ver_caixa">
        {data.caixa ? (
          <DashboardSection title="Caixa do turno">
            <MetricsGrid>
              <MetricCard
                label="Status"
                value={data.caixa.caixaAberto ? "Aberto" : "Fechado"}
                tone={data.caixa.caixaAberto ? "success" : "warning"}
              />
              <MetricCard
                label="Vendas no caixa"
                value={formatarMoeda(data.caixa.totalVendas)}
              />
              <MetricCard
                label="PIX"
                value={formatarMoeda(data.caixa.porForma.pix)}
              />
              <MetricCard
                label="Cartão"
                value={formatarMoeda(data.caixa.porForma.cartao)}
              />
              <MetricCard
                label="Dinheiro"
                value={formatarMoeda(data.caixa.porForma.dinheiro)}
              />
              <MetricCard
                label="Sangrias"
                value={formatarMoeda(data.caixa.totalSangrias)}
              />
              <MetricCard
                label="Suprimentos"
                value={formatarMoeda(data.caixa.totalSuprimentos)}
              />
            </MetricsGrid>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      <PermissionGate papel={papel} permissao="ver_cozinha">
        {data.cozinha ? (
          <DashboardSection title="Cozinha / produção">
            <MetricsGrid>
              <MetricCard
                label="Em preparo"
                value={String(data.cozinha.emPreparo)}
                icon={CookingPot}
              />
              <MetricCard
                label="Prontos"
                value={String(data.cozinha.prontos)}
              />
              <MetricCard
                label="Tempo médio de espera"
                value={
                  data.cozinha.tempoMedioMinutos != null
                    ? `${Math.round(data.cozinha.tempoMedioMinutos)} min`
                    : "—"
                }
              />
              <MetricCard
                label="Produções abertas (semana)"
                value={String(data.cozinha.producoesAbertas)}
              />
              {data.expedicao ? (
                <MetricCard
                  label="Expedições abertas"
                  value={String(data.expedicao.abertas)}
                />
              ) : null}
            </MetricsGrid>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      <PermissionGate papel={papel} permissao="ver_usuarios">
        {data.equipe ? (
          <DashboardSection title="Equipe">
            <MetricsGrid>
              <MetricCard
                label="Membros ativos"
                value={String(data.equipe.membrosAtivos)}
                hint="Contas vinculadas à empresa (não é presença em tempo real)"
                icon={Users}
              />
              {data.clientesAtivos != null ? (
                <MetricCard
                  label="Clientes ativos"
                  value={String(data.clientesAtivos)}
                />
              ) : null}
            </MetricsGrid>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      <PermissionGate papel={papel} permissao="ver_auditoria">
        {data.auditoria && data.auditoria.length > 0 ? (
          <DashboardSection
            title="Auditoria recente"
            description="Últimas mudanças de status de pedidos"
          >
            <DashboardCard title="Histórico">
              <ul className="space-y-2">
                {data.auditoria.map((item) => (
                  <li key={item.id} className="text-sm">
                    <span className="text-muted-foreground">
                      {new Date(item.criadoEm).toLocaleString("pt-BR")}
                    </span>
                    {" · "}
                    {item.statusAnterior ?? "—"} → {item.statusNovo}
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </DashboardSection>
        ) : null}
      </PermissionGate>

      {data.alertas &&
      (papel === "owner" ||
        papel === "gerente" ||
        data.alertas.pedidosCompraPendentes > 0) ? (
        <PermissionGate
          papel={papel}
          permissao={
            papel === "gerente" || papel === "owner"
              ? "ver_estoque"
              : "ver_financeiro"
          }
        >
          <DashboardSection title="Alertas operacionais">
            <MetricsGrid>
              {(papel === "owner" || papel === "gerente") && (
                <>
                  <MetricCard
                    label="Fichas no vermelho"
                    value={String(data.alertas.fichasNoVermelho)}
                    tone={
                      data.alertas.fichasNoVermelho > 0 ? "danger" : "default"
                    }
                  />
                  <MetricCard
                    label="Fichas abaixo do necessário"
                    value={String(data.alertas.fichasAbaixoDoNecessario)}
                    tone={
                      data.alertas.fichasAbaixoDoNecessario > 0
                        ? "warning"
                        : "default"
                    }
                  />
                </>
              )}
              <MetricCard
                label="Compras pendentes"
                value={String(data.alertas.pedidosCompraPendentes)}
              />
            </MetricsGrid>
          </DashboardSection>
        </PermissionGate>
      ) : null}
    </DashboardLayout>
  );
}
