import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  LayoutDashboard,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ExportMenu } from "@/components/export-menu";
import { Bar, Chip, Panel, SlaBadge } from "@/components/ui-kit";
import { contadorById, type CarteiraItem, type PedidoContador } from "@/lib/contadores-data";
import { brl, stages, type CertType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parceiro")({
  head: () => ({
    meta: [
      { title: "Portal do contador parceiro — Certus AC" },
      {
        name: "description",
        content:
          "Área do contador parceiro Certus AC: acompanhe pedidos dos seus clientes, cadastre novos clientes, faça pedidos de certificado e consulte suas comissões.",
      },
      { property: "og:title", content: "Portal do contador parceiro — Certus AC" },
      {
        property: "og:description",
        content: "Pedidos, carteira de clientes, novos pedidos e extrato de comissões do parceiro contábil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalParceiro,
});

const abas = [
  { id: "painel", label: "Painel", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos", icon: FileSpreadsheet },
  { id: "clientes", label: "Meus clientes", icon: Users },
  { id: "comissoes", label: "Comissões", icon: Percent },
] as const;

const tabelaPrecos: { tipo: CertType; balcao: number; parceiro: number; prazo: string }[] = [
  { tipo: "e-CPF A1", balcao: 199, parceiro: 155, prazo: "mesmo dia" },
  { tipo: "e-CPF A3", balcao: 289, parceiro: 225, prazo: "1 dia útil" },
  { tipo: "e-CNPJ A1", balcao: 289, parceiro: 225, prazo: "mesmo dia" },
  { tipo: "e-CNPJ A3", balcao: 389, parceiro: 303, prazo: "1 dia útil" },
  { tipo: "Nuvem PJ", balcao: 349, parceiro: 272, prazo: "2 dias úteis" },
];

const situacaoTone = {
  ativo: "blue",
  novo: "neutral",
  "em risco": "outline",
  inadimplente: "alert",
} as const;

const comissaoTone = {
  paga: "blue",
  aprovada: "blue",
  apurada: "neutral",
  prevista: "outline",
  retida: "alert",
} as const;

function stageNome(id: string) {
  return stages.find((s) => s.id === id)?.nome ?? id;
}

export function PortalParceiro() {
  const contador = contadorById("ct1")!;
  const [aba, setAba] = useState<(typeof abas)[number]["id"]>("painel");
  const [busca, setBusca] = useState("");
  const [novoCliente, setNovoCliente] = useState(false);
  const [novoPedido, setNovoPedido] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [carteira, setCarteira] = useState<CarteiraItem[]>(contador.carteira);
  const [pedidos, setPedidos] = useState<PedidoContador[]>(contador.pedidos);

  // form: novo cliente
  const [cNome, setCNome] = useState("");
  const [cDoc, setCDoc] = useState("");
  const [cTipo, setCTipo] = useState<"PF" | "PJ">("PJ");
  const [cEmail, setCEmail] = useState("");
  const [cTel, setCTel] = useState("");

  // form: novo pedido
  const [pCliente, setPCliente] = useState(contador.carteira[0]?.nome ?? "");
  const [pTipo, setPTipo] = useState<CertType>("e-CNPJ A1");
  const [pModalidade, setPModalidade] = useState("Videoconferência");
  const [pObs, setPObs] = useState("");

  const emAndamento = pedidos.filter((p) => p.stage !== "concluido");
  const concluidos = pedidos.filter((p) => p.stage === "concluido");
  const emRisco = pedidos.filter((p) => p.slaRestanteHoras <= 4 && p.stage !== "concluido");
  const vencendo = carteira.filter((c) => {
    const dias = Math.round((new Date(c.proximoVencimento).getTime() - Date.now()) / 86_400_000);
    return dias <= 30;
  });

  const carteiraFiltrada = useMemo(
    () =>
      carteira.filter(
        (c) =>
          c.nome.toLowerCase().includes(busca.toLowerCase()) ||
          c.documento.includes(busca),
      ),
    [carteira, busca],
  );

  const metaPct = Math.round((contador.emissoesMes / contador.metaMes) * 100);
  const preco = tabelaPrecos.find((t) => t.tipo === pTipo)!;

  function salvarCliente() {
    if (!cNome.trim() || !cDoc.trim()) return;
    setCarteira((atual) => [
      {
        id: `nw${atual.length + 1}`,
        nome: cNome.trim(),
        documento: cDoc.trim(),
        tipoPessoa: cTipo,
        certificadosAtivos: 0,
        proximoVencimento: "—",
        ultimaEmissao: "—",
        receitaAno: 0,
        situacao: "novo",
      },
      ...atual,
    ]);
    setAviso(`Cliente ${cNome.trim()} cadastrado na sua carteira.`);
    setCNome("");
    setCDoc("");
    setCEmail("");
    setCTel("");
    setNovoCliente(false);
    setAba("clientes");
    setTimeout(() => setAviso(null), 5000);
  }

  function enviarPedido() {
    if (!pCliente) return;
    const protocolo = `SC-${9200 + pedidos.length + Math.floor(Math.random() * 60)}`;
    setPedidos((atual) => [
      {
        id: protocolo,
        protocolo,
        cliente: pCliente,
        tipo: pTipo,
        stage: "novo",
        valor: preco.parceiro,
        slaRestanteHoras: 24,
        responsavel: "Fila de triagem",
        abertoEm: new Date().toISOString().slice(0, 10),
      },
      ...atual,
    ]);
    setAviso(`Pedido ${protocolo} enviado para a Certus AC. Prazo estimado: ${preco.prazo}.`);
    setPObs("");
    setNovoPedido(false);
    setAba("pedidos");
    setTimeout(() => setAviso(null), 6000);
  }

  const datasets = () => [
    {
      nome: "Pedidos",
      linhas: pedidos.map((p) => ({
        Protocolo: p.protocolo,
        Cliente: p.cliente,
        Tipo: p.tipo,
        Etapa: stageNome(p.stage),
        Valor: p.valor,
        "SLA (h)": p.slaRestanteHoras,
        Aberto: p.abertoEm,
      })),
    },
    {
      nome: "Clientes",
      linhas: carteira.map((c) => ({
        Cliente: c.nome,
        Documento: c.documento,
        Tipo: c.tipoPessoa,
        "Certificados ativos": c.certificadosAtivos,
        "Próximo vencimento": c.proximoVencimento,
        "Receita ano": c.receitaAno,
        Situação: c.situacao,
      })),
    },
    {
      nome: "Comissoes",
      linhas: contador.extrato.map((e) => ({
        Competência: e.competencia,
        Emissões: e.emissoes,
        Base: e.base,
        "%": e.percentual,
        Valor: e.valor,
        Status: e.status,
        Pagamento: e.pagamento,
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2.5 px-4">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Certus AC · Portal do parceiro</p>
            <p className="text-[11px] text-muted-foreground">
              {contador.nome} · {contador.crc}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Chip tone="blue">Tier {contador.tier}</Chip>
            <Chip tone="outline">Comissão {contador.comissaoPercentual}%</Chip>
            <Link
              to="/contadores/$id"
              params={{ id: contador.id }}
              className="hidden text-xs text-primary hover:underline sm:block"
            >
              Visão interna
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-4">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
                aba === a.id
                  ? "border-primary font-medium text-primary-deep"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <a.icon className="size-4" />
              {a.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 py-2">
            <ExportMenu datasets={datasets} base="parceiro" label="Exportar" />
            <button
              onClick={() => setNovoPedido(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" />
              Novo pedido
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        {aviso && (
          <div className="flex items-start gap-2 rounded-md bg-primary-soft px-3 py-2.5 text-sm text-primary-deep">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>{aviso}</p>
          </div>
        )}

        {aba === "painel" && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Pedidos em andamento", valor: String(emAndamento.length), hint: `${emRisco.length} com SLA crítico` },
                { label: "Emissões no mês", valor: String(contador.emissoesMes), hint: `meta ${contador.metaMes}` },
                { label: "Comissão a receber", valor: brl(contador.comissaoAberta), hint: `acumulado ${brl(contador.comissaoAcumulada)}` },
                { label: "Clientes na carteira", valor: String(carteira.length), hint: `${vencendo.length} vencendo em 30 dias` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{m.valor}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{m.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <Panel title="Produção e comissão" hint="últimos 6 meses">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={contador.serie} margin={{ left: -18, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="pRec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          fontSize: 12,
                        }}
                        formatter={(v: number, n) => (n === "emissoes" ? v : brl(v))}
                      />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        stroke="var(--color-primary)"
                        fill="url(#pRec)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="comissao"
                        stroke="var(--color-primary-deep)"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <div className="space-y-4">
                <Panel title="Meta do mês">
                  <p className="font-display text-2xl font-semibold tabular">
                    {contador.emissoesMes}
                    <span className="text-sm font-normal text-muted-foreground"> / {contador.metaMes}</span>
                  </p>
                  <div className="mt-2">
                    <Bar value={metaPct} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {metaPct}% da meta · faltam {Math.max(0, contador.metaMes - contador.emissoesMes)} emissões para o
                    bônus do tier.
                  </p>
                </Panel>

                <Panel title="Renovações a vender" hint="clientes vencendo em 30 dias">
                  <ul className="space-y-2">
                    {vencendo.slice(0, 5).map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">{c.nome}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular">{c.proximoVencimento}</span>
                      </li>
                    ))}
                    {vencendo.length === 0 && (
                      <li className="text-sm text-muted-foreground">Nenhuma renovação nos próximos 30 dias.</li>
                    )}
                  </ul>
                </Panel>
              </div>
            </div>

            <Panel
              title="Pedidos recentes"
              actions={
                <button onClick={() => setAba("pedidos")} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  Ver todos <ArrowUpRight className="size-3" />
                </button>
              }
              bodyClassName="p-0"
            >
              <TabelaPedidos pedidos={pedidos.slice(0, 5)} />
            </Panel>
          </>
        )}

        {aba === "pedidos" && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Em andamento", valor: emAndamento.length },
                { label: "SLA crítico", valor: emRisco.length },
                { label: "Concluídos", valor: concluidos.length },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{m.valor}</p>
                </div>
              ))}
            </div>
            <Panel title="Todos os pedidos" hint="status em tempo real na operação da Certus AC" bodyClassName="p-0">
              <TabelaPedidos pedidos={pedidos} />
            </Panel>
          </>
        )}

        {aba === "clientes" && (
          <Panel
            title="Meus clientes"
            hint={`${carteira.length} clientes na carteira`}
            actions={
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome ou documento"
                    className="w-52 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => setNovoCliente(true)}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="size-3.5" />
                  Cadastrar cliente
                </button>
              </div>
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Cliente</th>
                    <th className="px-4 py-2.5 font-medium">Documento</th>
                    <th className="px-4 py-2.5 font-medium">Certificados</th>
                    <th className="px-4 py-2.5 font-medium">Próx. vencimento</th>
                    <th className="px-4 py-2.5 font-medium">Receita ano</th>
                    <th className="px-4 py-2.5 font-medium">Situação</th>
                    <th className="px-4 py-2.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {carteiraFiltrada.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.nome}</p>
                        <p className="text-[11px] text-muted-foreground">{c.tipoPessoa}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular">{c.documento}</td>
                      <td className="px-4 py-3 tabular">{c.certificadosAtivos}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular">{c.proximoVencimento}</td>
                      <td className="px-4 py-3 tabular">{brl(c.receitaAno)}</td>
                      <td className="px-4 py-3">
                        <Chip tone={situacaoTone[c.situacao]}>{c.situacao}</Chip>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setPCliente(c.nome);
                            setNovoPedido(true);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Fazer pedido
                        </button>
                      </td>
                    </tr>
                  ))}
                  {carteiraFiltrada.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {aba === "comissoes" && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "A receber", valor: brl(contador.comissaoAberta), hint: "competência atual" },
                { label: "Comissão do mês", valor: brl(contador.comissaoMes), hint: `${contador.comissaoPercentual}% sobre a base` },
                { label: "Acumulado no ano", valor: brl(contador.comissaoAcumulada), hint: `${contador.emissoesAno} emissões` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{m.valor}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{m.hint}</p>
                </div>
              ))}
            </div>

            <Panel title="Extrato de comissões" hint={contador.tabelaEspecial} bodyClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Competência</th>
                      <th className="px-4 py-2.5 font-medium">Emissões</th>
                      <th className="px-4 py-2.5 font-medium">Base</th>
                      <th className="px-4 py-2.5 font-medium">%</th>
                      <th className="px-4 py-2.5 font-medium">Comissão</th>
                      <th className="px-4 py-2.5 font-medium">Pagamento</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contador.extrato.map((e) => (
                      <tr key={e.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{e.competencia}</td>
                        <td className="px-4 py-3 tabular">{e.emissoes}</td>
                        <td className="px-4 py-3 tabular">{brl(e.base)}</td>
                        <td className="px-4 py-3 tabular">{e.percentual}%</td>
                        <td className="px-4 py-3 font-medium tabular">{brl(e.valor)}</td>
                        <td className="px-4 py-3 text-muted-foreground tabular">{e.pagamento}</td>
                        <td className="px-4 py-3">
                          <Chip tone={comissaoTone[e.status]}>{e.status}</Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Sua tabela de preços" hint="valores parceiro já com desconto do tier" bodyClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Produto</th>
                      <th className="px-4 py-2.5 font-medium">Balcão</th>
                      <th className="px-4 py-2.5 font-medium">Seu preço</th>
                      <th className="px-4 py-2.5 font-medium">Sua comissão</th>
                      <th className="px-4 py-2.5 font-medium">Prazo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tabelaPrecos.map((t) => (
                      <tr key={t.tipo} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{t.tipo}</td>
                        <td className="px-4 py-3 text-muted-foreground tabular line-through">{brl(t.balcao)}</td>
                        <td className="px-4 py-3 tabular">{brl(t.parceiro)}</td>
                        <td className="px-4 py-3 tabular text-primary">
                          {brl(Math.round((t.parceiro * contador.comissaoPercentual) / 100))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{t.prazo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </main>

      {novoCliente && (
        <Modal titulo="Cadastrar novo cliente" onClose={() => setNovoCliente(false)}>
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {(["PJ", "PF"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCTipo(t)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs transition-colors",
                    cTipo === t
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:border-primary",
                  )}
                >
                  {t === "PJ" ? "Pessoa jurídica" : "Pessoa física"}
                </button>
              ))}
            </div>
            <Campo label={cTipo === "PJ" ? "Razão social" : "Nome completo"} value={cNome} onChange={setCNome} />
            <Campo label={cTipo === "PJ" ? "CNPJ" : "CPF"} value={cDoc} onChange={setCDoc} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="E-mail do responsável" value={cEmail} onChange={setCEmail} />
              <Campo label="Telefone" value={cTel} onChange={setCTel} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              O cliente entra na sua carteira e a comissão de todas as emissões dele é atribuída a você
              automaticamente.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setNovoCliente(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">
                Cancelar
              </button>
              <button
                onClick={salvarCliente}
                disabled={!cNome.trim() || !cDoc.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {novoPedido && (
        <Modal titulo="Novo pedido de certificado" onClose={() => setNovoPedido(false)}>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Cliente</span>
              <select
                value={pCliente}
                onChange={(e) => setPCliente(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
              >
                {carteira.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-xs text-muted-foreground">Produto</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {tabelaPrecos.map((t) => (
                  <button
                    key={t.tipo}
                    onClick={() => setPTipo(t.tipo)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                      pTipo === t.tipo
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {t.tipo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Modalidade de validação</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {["Videoconferência", "Presencial no escritório", "Renovação por vínculo"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPModalidade(m)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                      pModalidade === m
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs text-muted-foreground">Observações para a operação</span>
              <textarea
                value={pObs}
                onChange={(e) => setPObs(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                placeholder="Ex.: titular disponível apenas no período da tarde."
              />
            </label>

            <div className="rounded-md bg-muted/60 px-3 py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Seu preço</span>
                <span className="font-medium tabular">{brl(preco.parceiro)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Sua comissão</span>
                <span className="font-medium tabular text-primary">
                  {brl(Math.round((preco.parceiro * contador.comissaoPercentual) / 100))}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Prazo estimado</span>
                <span className="tabular">{preco.prazo}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setNovoPedido(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">
                Cancelar
              </button>
              <button
                onClick={enviarPedido}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                Enviar pedido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TabelaPedidos({ pedidos }: { pedidos: PedidoContador[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Protocolo</th>
            <th className="px-4 py-2.5 font-medium">Cliente</th>
            <th className="px-4 py-2.5 font-medium">Produto</th>
            <th className="px-4 py-2.5 font-medium">Etapa</th>
            <th className="px-4 py-2.5 font-medium">SLA</th>
            <th className="px-4 py-2.5 font-medium">Valor</th>
            <th className="px-4 py-2.5 font-medium">Aberto em</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pedidos.map((p) => (
            <tr key={p.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 font-medium tabular">{p.protocolo}</td>
              <td className="px-4 py-3">{p.cliente}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.tipo}</td>
              <td className="px-4 py-3">
                <Chip tone={p.stage === "concluido" ? "blue" : p.stage === "bloqueado" ? "alert" : "neutral"}>
                  {stageNome(p.stage)}
                </Chip>
              </td>
              <td className="px-4 py-3">
                {p.stage === "concluido" ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <SlaBadge horas={p.slaRestanteHoras} />
                )}
              </td>
              <td className="px-4 py-3 tabular">{brl(p.valor)}</td>
              <td className="px-4 py-3 text-muted-foreground tabular">{p.abertoEm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-sm font-semibold">{titulo}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
