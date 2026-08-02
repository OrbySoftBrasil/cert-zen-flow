import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Building2, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar as RBar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { ExportMenu } from "@/components/export-menu";
import { Bar, Chip, Metric, Panel } from "@/components/ui-kit";
import { contadores, funilCredenciamento, tierRegras, type ContadorStatus } from "@/lib/contadores-data";
import { brl } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contadores/")({
  head: () => ({
    meta: [
      { title: "Contadores parceiros — Certus AC" },
      {
        name: "description",
        content:
          "Rede de contadores credenciados: carteira de clientes indicados, emissões, comissões, tier de parceria e status de credenciamento.",
      },
      { property: "og:title", content: "Rede de contadores parceiros — Certus AC" },
      { property: "og:description", content: "Carteira, emissões, comissões e credenciamento dos parceiros contábeis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contadores,
});

const statusTone: Record<ContadorStatus, "blue" | "neutral" | "alert" | "outline"> = {
  ativo: "blue",
  "em credenciamento": "neutral",
  suspenso: "alert",
  inativo: "outline",
};

const tierTone: Record<string, string> = {
  Diamante: "bg-primary text-primary-foreground",
  Ouro: "bg-primary-soft text-primary-deep",
  Prata: "bg-muted text-muted-foreground",
  Bronze: "border border-border-strong text-muted-foreground",
};

function Contadores() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"todos" | ContadorStatus>("todos");
  const [tier, setTier] = useState("todos");
  const [ordem, setOrdem] = useState<"emissoes" | "receita" | "comissao" | "nome">("emissoes");

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return contadores
      .filter((c) => (status === "todos" ? true : c.status === status))
      .filter((c) => (tier === "todos" ? true : c.tier === tier))
      .filter(
        (c) =>
          !t ||
          c.nome.toLowerCase().includes(t) ||
          c.cnpj.includes(t) ||
          c.responsavel.toLowerCase().includes(t) ||
          c.cidade.toLowerCase().includes(t),
      )
      .sort((a, b) =>
        ordem === "nome"
          ? a.nome.localeCompare(b.nome)
          : ordem === "receita"
            ? b.receitaMes - a.receitaMes
            : ordem === "comissao"
              ? b.comissaoMes - a.comissaoMes
              : b.emissoesMes - a.emissoesMes,
      );
  }, [busca, status, tier, ordem]);

  const ativos = contadores.filter((c) => c.status === "ativo");
  const totalEmissoes = contadores.reduce((s, c) => s + c.emissoesMes, 0);
  const totalReceita = contadores.reduce((s, c) => s + c.receitaMes, 0);
  const totalComissao = contadores.reduce((s, c) => s + c.comissaoMes, 0);
  const clientesVinculados = contadores.reduce((s, c) => s + c.carteira.length, 0);
  const pedidosAbertos = contadores.reduce(
    (s, c) => s + c.pedidos.filter((p) => p.stage !== "concluido").length,
    0,
  );
  const pedidosRisco = contadores.reduce(
    (s, c) => s + c.pedidos.filter((p) => p.slaRestanteHoras <= 4).length,
    0,
  );
  const docsPendentes = contadores.reduce(
    (s, c) => s + c.documentos.filter((d) => d.status !== "aprovado").length,
    0,
  );

  const ranking = [...contadores].sort((a, b) => b.emissoesMes - a.emissoesMes).slice(0, 6);

  const datasets = () => [
    {
      nome: "Parceiros",
      linhas: contadores.map((c) => ({
        Parceiro: c.nome,
        CNPJ: c.cnpj,
        CRC: c.crc,
        Responsável: c.responsavel,
        Cidade: c.cidade,
        Status: c.status,
        Tier: c.tier,
        Gestor: c.gestor,
        "Clientes na carteira": c.carteira.length,
        "Emissões mês": c.emissoesMes,
        "Meta mês": c.metaMes,
        "Receita mês": c.receitaMes,
        "Comissão %": c.comissaoPercentual,
        "Comissão mês": c.comissaoMes,
        "Comissão em aberto": c.comissaoAberta,
        "Inadimplência %": c.inadimplencia,
        "Conversão %": c.conversao,
        NPS: c.nps,
        "Qualidade docs %": c.qualidadeDocs,
      })),
    },
    {
      nome: "Carteira de clientes",
      linhas: contadores.flatMap((c) =>
        c.carteira.map((w) => ({
          Parceiro: c.nome,
          Cliente: w.nome,
          Documento: w.documento,
          Tipo: w.tipoPessoa,
          "Certificados ativos": w.certificadosAtivos,
          "Próximo vencimento": w.proximoVencimento,
          "Última emissão": w.ultimaEmissao,
          "Receita ano": w.receitaAno,
          Situação: w.situacao,
        })),
      ),
    },
    {
      nome: "Pedidos por parceiro",
      linhas: contadores.flatMap((c) =>
        c.pedidos.map((p) => ({
          Parceiro: c.nome,
          Protocolo: p.protocolo,
          Cliente: p.cliente,
          Tipo: p.tipo,
          Etapa: p.stage,
          Valor: p.valor,
          "SLA restante (h)": p.slaRestanteHoras,
          Responsável: p.responsavel,
          "Aberto em": p.abertoEm,
        })),
      ),
    },
    {
      nome: "Comissões",
      linhas: contadores.flatMap((c) =>
        c.extrato.map((e) => ({
          Parceiro: c.nome,
          Competência: e.competencia,
          Emissões: e.emissoes,
          Base: e.base,
          "%": e.percentual,
          Comissão: e.valor,
          Status: e.status,
          Pagamento: e.pagamento,
        })),
      ),
    },
    {
      nome: "Credenciamento",
      linhas: contadores.flatMap((c) =>
        c.documentos.map((d) => ({
          Parceiro: c.nome,
          Documento: d.nome,
          Tipo: d.tipo,
          Validade: d.validade ?? "—",
          Status: d.status,
        })),
      ),
    },
  ];

  return (
    <AppShell
      title="Contadores parceiros"
      subtitle={`${ativos.length} credenciados ativos · ${clientesVinculados} clientes vinculados`}
      actions={
        <div className="flex items-center gap-2">
          <ExportMenu datasets={datasets} base="certus-contadores" label="Relatórios" />
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            <UserPlus className="size-3.5" /> Credenciar parceiro
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap rounded-lg border border-border bg-card">
          <Metric label="Parceiros ativos" value={String(ativos.length)} hint={`${contadores.length} na rede`} />
          <Metric label="Emissões via parceiros" value={String(totalEmissoes)} delta={9.4} hint="no mês" />
          <Metric label="Receita indicada" value={brl(totalReceita)} delta={7.1} hint="competência aberta" />
          <Metric label="Comissão apurada" value={brl(totalComissao)} hint={`${((totalComissao / totalReceita) * 100).toFixed(1)}% da receita`} />
          <Metric label="Clientes vinculados" value={String(clientesVinculados)} hint="carteira consolidada" />
        </div>

        <div className="flex flex-wrap rounded-lg border border-border bg-card">
          <Metric label="Pedidos em andamento" value={String(pedidosAbertos)} hint="originados por parceiros" />
          <Metric label="Pedidos com SLA em risco" value={String(pedidosRisco)} hint="≤ 4h ou estourado" />
          <Metric label="Docs de credenciamento" value={String(docsPendentes)} hint="pendentes ou vencidos" />
          <Metric label="Ticket médio da rede" value={brl(Math.round(totalReceita / Math.max(1, totalEmissoes)))} hint="por emissão" />
          <Metric label="Em credenciamento" value={String(funilCredenciamento[0]?.qtd ?? 0)} hint="cadastros no funil" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Ranking de emissões" hint="Volume no mês por parceiro">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} layout="vertical" margin={{ left: 24, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--color-border)" }}
                  />
                  <RBar dataKey="emissoesMes" name="Emissões" radius={[0, 4, 4, 0]}>
                    {ranking.map((r) => (
                      <Cell key={r.id} fill={r.status === "ativo" ? "var(--color-primary)" : "var(--color-border-strong)"} />
                    ))}
                  </RBar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Funil de credenciamento" hint="Novos parceiros por etapa">
            <div className="space-y-3">
              {funilCredenciamento.map((f) => (
                <div key={f.etapa}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{f.etapa}</span>
                    <span className="tabular font-medium">{f.qtd}</span>
                  </div>
                  <Bar value={(f.qtd / funilCredenciamento[0]!.qtd) * 100} />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {tierRegras.map((t) => (
                <div key={t.tier} className="flex items-start gap-2 text-xs">
                  <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", tierTone[t.tier])}>{t.tier}</span>
                  <span className="min-w-0 text-muted-foreground">
                    {t.meta} · comissão {t.comissao} · {t.beneficios}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          bodyClassName="p-0"
          title="Rede credenciada"
          hint={`${lista.length} parceiro(s) no filtro`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Parceiro, CNPJ, responsável"
                  className="w-56 rounded-md border border-border bg-card py-1.5 pl-7 pr-2.5 text-xs outline-none focus:border-primary"
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
              >
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="em credenciamento">Em credenciamento</option>
                <option value="suspenso">Suspenso</option>
                <option value="inativo">Inativo</option>
              </select>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
              >
                <option value="todos">Todos os tiers</option>
                {tierRegras.map((t) => (
                  <option key={t.tier} value={t.tier}>
                    {t.tier}
                  </option>
                ))}
              </select>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as typeof ordem)}
                className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
              >
                <option value="emissoes">Ordenar por emissões</option>
                <option value="receita">Ordenar por receita</option>
                <option value="comissao">Ordenar por comissão</option>
                <option value="nome">Ordenar por nome</option>
              </select>
            </div>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Parceiro</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Clientes</th>
                <th className="px-4 py-2 font-medium">Pedidos</th>
                <th className="px-4 py-2 font-medium">Meta do mês</th>
                <th className="px-4 py-2 text-right font-medium">Receita</th>
                <th className="px-4 py-2 text-right font-medium">Comissão</th>
                <th className="px-4 py-2 font-medium">Gestor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((c) => {
                const abertos = c.pedidos.filter((p) => p.stage !== "concluido").length;
                const risco = c.pedidos.filter((p) => p.slaRestanteHoras <= 4).length;
                const atingimento = Math.round((c.emissoesMes / c.metaMes) * 100);
                return (
                  <tr key={c.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-deep">
                          <Building2 className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <Link
                            to="/contadores/$id"
                            params={{ id: c.id }}
                            className="font-medium text-primary hover:underline"
                          >
                            {c.nome}
                          </Link>
                          <span className="block text-xs text-muted-foreground">
                            {c.responsavel} · {c.cidade}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <Chip tone={statusTone[c.status]}>{c.status}</Chip>
                        <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", tierTone[c.tier])}>
                          <Award className="mr-0.5 inline size-3" />
                          {c.tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular">{c.carteira.length}</td>
                    <td className="px-4 py-3">
                      <span className="tabular">{abertos} em curso</span>
                      {risco > 0 && (
                        <span className="ml-1.5 text-[11px] font-medium text-alert">{risco} SLA</span>
                      )}
                    </td>
                    <td className="w-44 px-4 py-3">
                      <Bar value={atingimento} />
                      <span className="tabular text-[11px] text-muted-foreground">
                        {c.emissoesMes}/{c.metaMes} · {atingimento}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular">{brl(c.receitaMes)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="tabular block">{brl(c.comissaoMes)}</span>
                      <span className="text-[11px] text-muted-foreground">{c.comissaoPercentual}%</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{c.gestor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
