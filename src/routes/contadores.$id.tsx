import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Award, Building2, FileCheck2, Handshake, Mail, Percent, Phone, Users } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar as RBar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import { Bar, Chip, Metric, Panel, SlaBadge } from "@/components/ui-kit";
import { contadorById } from "@/lib/contadores-data";
import { brl, stages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contadores/$id")({
  loader: ({ params }) => {
    const contador = contadorById(params.id);
    if (!contador) throw notFound();
    return { nome: contador.nome, cidade: contador.cidade };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [
          { title: "Parceiro não encontrado — Certus AC" },
          { name: "robots", content: "noindex" },
        ],
      };
    return {
      meta: [
        { title: `${loaderData.nome} — Cockpit do contador` },
        {
          name: "description",
          content: `Cockpit do parceiro contábil ${loaderData.nome}: carteira de clientes, pedidos em andamento, comissões, metas e credenciamento.`,
        },
        { property: "og:title", content: `${loaderData.nome} — Cockpit do contador parceiro` },
        {
          property: "og:description",
          content: "Carteira, pedidos, comissões e credenciamento do parceiro.",
        },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Cockpit,
});

const abas = [
  { id: "carteira", label: "Carteira de clientes", icon: Users },
  { id: "pedidos", label: "Pedidos", icon: Handshake },
  { id: "comissoes", label: "Comissões", icon: Percent },
  { id: "credenciamento", label: "Credenciamento", icon: FileCheck2 },
] as const;

const situacaoTone = {
  ativo: "blue",
  novo: "neutral",
  "em risco": "outline",
  inadimplente: "alert",
} as const;

const docTone = {
  aprovado: "blue",
  "em análise": "neutral",
  pendente: "outline",
  vencido: "alert",
} as const;

const comissaoTone = {
  paga: "deep",
  aprovada: "blue",
  apurada: "neutral",
  prevista: "outline",
  retida: "alert",
} as const;

const tierTone: Record<string, string> = {
  Diamante: "bg-primary text-primary-foreground",
  Ouro: "bg-primary-soft text-primary-deep",
  Prata: "bg-muted text-muted-foreground",
  Bronze: "border border-border-strong text-muted-foreground",
};

function stageNome(id: string) {
  return stages.find((s) => s.id === id)?.nome ?? id;
}

function Cockpit() {
  const { id } = Route.useParams();
  const c = contadorById(id)!;
  const [aba, setAba] = useState<(typeof abas)[number]["id"]>("carteira");

  const atingimento = Math.round((c.emissoesMes / c.metaMes) * 100);
  const emCurso = c.pedidos.filter((p) => p.stage !== "concluido");
  const emRisco = c.pedidos.filter((p) => p.slaRestanteHoras <= 4);
  const vencendo = c.carteira.filter((w) => {
    const dias = Math.round((new Date(w.proximoVencimento).getTime() - Date.now()) / 86_400_000);
    return dias <= 30;
  });
  const inadimplentes = c.carteira.filter((w) => w.situacao === "inadimplente");

  const datasets = () => [
    {
      nome: "Resumo",
      linhas: [
        {
          Parceiro: c.nome,
          CNPJ: c.cnpj,
          CRC: c.crc,
          Status: c.status,
          Tier: c.tier,
          Gestor: c.gestor,
          "Emissões mês": c.emissoesMes,
          "Meta mês": c.metaMes,
          "Atingimento %": atingimento,
          "Receita mês": c.receitaMes,
          "Receita ano": c.receitaAno,
          "Comissão mês": c.comissaoMes,
          "Comissão acumulada": c.comissaoAcumulada,
          "Inadimplência %": c.inadimplencia,
          "Conversão %": c.conversao,
          NPS: c.nps,
        },
      ],
    },
    {
      nome: "Carteira",
      linhas: c.carteira.map((w) => ({
        Cliente: w.nome,
        Documento: w.documento,
        Tipo: w.tipoPessoa,
        "Certificados ativos": w.certificadosAtivos,
        "Próximo vencimento": w.proximoVencimento,
        "Última emissão": w.ultimaEmissao,
        "Receita ano": w.receitaAno,
        Situação: w.situacao,
      })),
    },
    {
      nome: "Pedidos",
      linhas: c.pedidos.map((p) => ({
        Protocolo: p.protocolo,
        Cliente: p.cliente,
        Tipo: p.tipo,
        Etapa: stageNome(p.stage),
        Valor: p.valor,
        "SLA restante (h)": p.slaRestanteHoras,
        Responsável: p.responsavel,
        "Aberto em": p.abertoEm,
      })),
    },
    {
      nome: "Comissões",
      linhas: c.extrato.map((e) => ({
        Competência: e.competencia,
        Emissões: e.emissoes,
        Base: e.base,
        "%": e.percentual,
        Comissão: e.valor,
        Status: e.status,
        Pagamento: e.pagamento,
      })),
    },
    {
      nome: "Evolução",
      linhas: c.serie.map((s) => ({
        Mês: s.mes,
        Emissões: s.emissoes,
        Receita: s.receita,
        Comissão: s.comissao,
      })),
    },
    {
      nome: "Credenciamento",
      linhas: c.documentos.map((d) => ({
        Documento: d.nome,
        Tipo: d.tipo,
        Validade: d.validade ?? "—",
        Status: d.status,
      })),
    },
  ];

  return (
    <AppShell
      title={c.nome}
      subtitle={`${c.cnpj} · ${c.crc} · parceiro desde ${c.desde}`}
      actions={
        <div className="flex items-center gap-2">
          <ExportMenu datasets={datasets} base={`certus-contador-${c.id}`} label="Relatórios" />
          <Link
            to="/parceiro"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Portal do parceiro
          </Link>
          <Link
            to="/contadores"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Voltar à rede
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
          <div className="grid size-12 place-items-center rounded-md bg-primary-soft text-primary-deep">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold">{c.razaoSocial}</p>
              <Chip
                tone={c.status === "ativo" ? "blue" : c.status === "suspenso" ? "alert" : "neutral"}
              >
                {c.status}
              </Chip>
              <span
                className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", tierTone[c.tier])}
              >
                <Award className="mr-0.5 inline size-3" />
                {c.tier}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {c.responsavel} · {c.email} · {c.telefone} · {c.cidade}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.tabelaEspecial} · gestor {c.gestor}
            </p>
          </div>
          <div className="ml-auto w-56">
            <p className="text-[11px] uppercase text-muted-foreground">Meta do mês</p>
            <p className="tabular font-display text-lg font-semibold">
              {c.emissoesMes}/{c.metaMes}{" "}
              <span className="text-sm text-muted-foreground">({atingimento}%)</span>
            </p>
            <Bar value={atingimento} />
          </div>
        </div>

        <div className="flex flex-wrap rounded-lg border border-border bg-card">
          <Metric
            label="Clientes vinculados"
            value={String(c.carteira.length)}
            hint={`${vencendo.length} vencem em 30d`}
          />
          <Metric
            label="Pedidos em curso"
            value={String(emCurso.length)}
            hint={`${emRisco.length} com SLA crítico`}
          />
          <Metric
            label="Receita do mês"
            value={brl(c.receitaMes)}
            hint={`ticket ${brl(c.ticketMedio)}`}
          />
          <Metric
            label="Comissão do mês"
            value={brl(c.comissaoMes)}
            hint={`${c.comissaoPercentual}% sobre a base`}
          />
          <Metric
            label="Comissão em aberto"
            value={brl(c.comissaoAberta)}
            hint={`acumulado ${brl(c.comissaoAcumulada)}`}
          />
        </div>

        <div className="flex flex-wrap rounded-lg border border-border bg-card">
          <Metric label="Conversão" value={`${c.conversao}%`} hint="pedido → emissão" />
          <Metric
            label="Qualidade documental"
            value={`${c.qualidadeDocs}%`}
            hint="aprovados na 1ª análise"
          />
          <Metric label="Tempo médio" value={`${c.tempoMedioDias}d`} hint="entrada → emissão" />
          <Metric
            label="Inadimplência"
            value={`${c.inadimplencia}%`}
            hint={`${inadimplentes.length} cliente(s)`}
          />
          <Metric
            label="NPS do parceiro"
            value={c.nps ? String(c.nps) : "—"}
            hint={`churn ${c.churnCarteira}%`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="Produção do parceiro" hint="Emissões, receita e comissão por mês">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={c.serie} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="r"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                    }}
                    formatter={(v: number, n: string) => (n === "Emissões" ? v : brl(Number(v)))}
                  />
                  <RBar
                    yAxisId="l"
                    dataKey="emissoes"
                    name="Emissões"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    yAxisId="r"
                    type="monotone"
                    dataKey="receita"
                    name="Receita"
                    stroke="var(--color-primary-deep)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="r"
                    type="monotone"
                    dataKey="comissao"
                    name="Comissão"
                    stroke="var(--color-border-strong)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Comissão acumulada" hint="Curva de repasse ao parceiro">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={c.serie} margin={{ left: 4, right: 8 }}>
                  <defs>
                    <linearGradient id="gcom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                    }}
                    formatter={(v: number) => brl(Number(v))}
                  />
                  <Area
                    type="monotone"
                    dataKey="comissao"
                    name="Comissão"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#gcom)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1 border-b border-border">
              {abas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAba(a.id)}
                  className={cn(
                    "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                    aba === a.id
                      ? "border-primary font-medium text-primary-deep"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <a.icon className="size-4" /> {a.label}
                </button>
              ))}
            </div>

            {aba === "carteira" && (
              <Panel bodyClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Cliente</th>
                        <th className="px-4 py-2 font-medium">Certificados</th>
                        <th className="px-4 py-2 font-medium">Próx. vencimento</th>
                        <th className="px-4 py-2 font-medium">Última emissão</th>
                        <th className="px-4 py-2 text-right font-medium">Receita 12m</th>
                        <th className="px-4 py-2 font-medium">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.carteira.map((w) => (
                        <tr key={w.id} className="hover:bg-muted/50">
                          <td className="px-4 py-2.5">
                            {w.clienteId ? (
                              <Link
                                to="/clientes/$id"
                                params={{ id: w.clienteId }}
                                className="font-medium text-primary hover:underline"
                              >
                                {w.nome}
                              </Link>
                            ) : (
                              <span className="font-medium">{w.nome}</span>
                            )}
                            <span className="block text-xs tabular text-muted-foreground">
                              {w.documento} · {w.tipoPessoa}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 tabular">{w.certificadosAtivos}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap tabular text-muted-foreground">
                            {w.proximoVencimento}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap tabular text-muted-foreground">
                            {w.ultimaEmissao}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular">{brl(w.receitaAno)}</td>
                          <td className="px-4 py-2.5">
                            <Chip tone={situacaoTone[w.situacao]}>{w.situacao}</Chip>
                          </td>
                        </tr>
                      ))}
                      {c.carteira.length === 0 && (
                        <tr>
                          <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                            Nenhum cliente vinculado a este parceiro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {aba === "pedidos" && (
              <div className="space-y-4">
                <Panel
                  title="Pedidos por etapa"
                  hint="Distribuição do funil operacional do parceiro"
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {stages
                      .filter((s) => s.id !== "concluido")
                      .map((s) => {
                        const qtd = c.pedidos.filter((p) => p.stage === s.id).length;
                        return (
                          <div
                            key={s.id}
                            className={cn(
                              "rounded-md border px-3 py-2",
                              qtd > 0 ? "border-primary/40 bg-primary-soft/40" : "border-border",
                            )}
                          >
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {s.nome}
                            </p>
                            <p className="tabular font-display text-lg font-semibold">{qtd}</p>
                          </div>
                        );
                      })}
                  </div>
                </Panel>
                <Panel bodyClassName="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-2 font-medium">Protocolo</th>
                          <th className="px-4 py-2 font-medium">Cliente</th>
                          <th className="px-4 py-2 font-medium">Tipo</th>
                          <th className="px-4 py-2 font-medium">Etapa</th>
                          <th className="px-4 py-2 font-medium">SLA</th>
                          <th className="px-4 py-2 text-right font-medium">Valor</th>
                          <th className="px-4 py-2 font-medium">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {c.pedidos.map((p) => (
                          <tr key={p.id} className="hover:bg-muted/50">
                            <td className="px-4 py-2.5 tabular font-medium">{p.protocolo}</td>
                            <td className="px-4 py-2.5">{p.cliente}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{p.tipo}</td>
                            <td className="px-4 py-2.5">
                              <Chip
                                tone={
                                  p.stage === "bloqueado"
                                    ? "alert"
                                    : p.stage === "concluido"
                                      ? "blue"
                                      : "neutral"
                                }
                              >
                                {stageNome(p.stage)}
                              </Chip>
                            </td>
                            <td className="px-4 py-2.5">
                              {p.stage === "concluido" ? (
                                <span className="text-xs text-muted-foreground">entregue</span>
                              ) : (
                                <SlaBadge horas={p.slaRestanteHoras} />
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular">{brl(p.valor)}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                              {p.responsavel}
                            </td>
                          </tr>
                        ))}
                        {c.pedidos.length === 0 && (
                          <tr>
                            <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={7}>
                              Nenhum pedido em andamento para este parceiro.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            )}

            {aba === "comissoes" && (
              <Panel
                bodyClassName="p-0"
                title="Extrato de comissões"
                hint={`Regra vigente: ${c.comissaoPercentual}% sobre a receita líquida`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Competência</th>
                        <th className="px-4 py-2 text-right font-medium">Emissões</th>
                        <th className="px-4 py-2 text-right font-medium">Base</th>
                        <th className="px-4 py-2 text-right font-medium">%</th>
                        <th className="px-4 py-2 text-right font-medium">Comissão</th>
                        <th className="px-4 py-2 font-medium">Pagamento</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.extrato.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/50">
                          <td className="px-4 py-2.5 tabular font-medium">{e.competencia}</td>
                          <td className="px-4 py-2.5 text-right tabular">{e.emissoes}</td>
                          <td className="px-4 py-2.5 text-right tabular">{brl(e.base)}</td>
                          <td className="px-4 py-2.5 text-right tabular">{e.percentual}%</td>
                          <td className="px-4 py-2.5 text-right tabular font-medium">
                            {brl(e.valor)}
                          </td>
                          <td className="px-4 py-2.5 tabular text-muted-foreground">
                            {e.pagamento}
                          </td>
                          <td className="px-4 py-2.5">
                            <Chip tone={comissaoTone[e.status]}>{e.status}</Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/40 text-sm font-medium">
                        <td className="px-4 py-2.5">Total</td>
                        <td className="px-4 py-2.5 text-right tabular">
                          {c.extrato.reduce((s, e) => s + e.emissoes, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular">
                          {brl(c.extrato.reduce((s, e) => s + e.base, 0))}
                        </td>
                        <td />
                        <td className="px-4 py-2.5 text-right tabular">
                          {brl(c.extrato.reduce((s, e) => s + e.valor, 0))}
                        </td>
                        <td colSpan={2} className="px-4 py-2.5 text-right">
                          <Link
                            to="/financeiro/comissoes"
                            className="text-xs text-primary hover:underline"
                          >
                            Ver apuração no financeiro →
                          </Link>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Panel>
            )}

            {aba === "credenciamento" && (
              <Panel
                bodyClassName="p-0"
                title="Documentos de credenciamento"
                hint="Habilitação, compliance e capacitação"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Documento</th>
                        <th className="px-4 py-2 font-medium">Tipo</th>
                        <th className="px-4 py-2 font-medium">Validade</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.documentos.map((d) => (
                        <tr key={d.id} className="hover:bg-muted/50">
                          <td className="px-4 py-2.5">{d.nome}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{d.tipo}</td>
                          <td className="px-4 py-2.5 tabular text-muted-foreground">
                            {d.validade ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <Chip tone={docTone[d.status]}>{d.status}</Chip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </div>

          <aside className="space-y-4">
            <Panel title="Alertas do parceiro">
              <ul className="space-y-2 text-sm">
                {emRisco.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-alert/30 bg-alert-soft/40 px-3 py-2"
                  >
                    <p className="font-medium">{p.protocolo} · SLA crítico</p>
                    <p className="text-xs text-muted-foreground">
                      {p.cliente} — {stageNome(p.stage)}
                    </p>
                  </li>
                ))}
                {vencendo.map((w) => (
                  <li key={w.id} className="rounded-md border border-border px-3 py-2">
                    <p className="font-medium">Certificado a vencer</p>
                    <p className="text-xs text-muted-foreground">
                      {w.nome} — {w.proximoVencimento}
                    </p>
                  </li>
                ))}
                {c.documentos
                  .filter((d) => d.status === "vencido" || d.status === "pendente")
                  .map((d) => (
                    <li key={d.id} className="rounded-md border border-border px-3 py-2">
                      <p className="font-medium">Credenciamento: {d.status}</p>
                      <p className="text-xs text-muted-foreground">{d.nome}</p>
                    </li>
                  ))}
                {emRisco.length + vencendo.length === 0 &&
                  c.documentos.every((d) => d.status === "aprovado") && (
                    <li className="text-sm text-muted-foreground">Sem alertas abertos.</li>
                  )}
              </ul>
            </Panel>

            <Panel title="Contatos">
              <ul className="space-y-3 text-sm">
                {c.contatos.map((k) => (
                  <li key={k.id}>
                    <p className="font-medium">{k.nome}</p>
                    <p className="text-xs text-muted-foreground">{k.papel}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" /> {k.email}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="size-3" /> {k.telefone}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Atividades recentes">
              <ol className="space-y-3">
                {c.atividades.map((a) => (
                  <li key={a.id} className="border-l-2 border-border pl-3">
                    <p className="text-xs tabular text-muted-foreground">{a.quando}</p>
                    <p className={cn("text-sm", a.tipo === "alerta" && "text-alert")}>{a.texto}</p>
                    <p className="text-xs text-muted-foreground">{a.autor}</p>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel title="Observações do gestor">
              <p className="text-sm text-muted-foreground">{c.observacao}</p>
            </Panel>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
