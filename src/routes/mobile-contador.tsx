import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  LayoutDashboard,
  LifeBuoy,
  Paperclip,
  Percent,
  Plus,
  Search,
  Signal,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MCard, MiniBar, Row, StatTile } from "@/components/mobile-kit";
import { Chip, SlaBadge } from "@/components/ui-kit";
import { contadorById, type CarteiraItem, type PedidoContador } from "@/lib/contadores-data";
import {
  baseConhecimento,
  brl,
  stages,
  ticketCategorias,
  type CertType,
  type TicketCategoria,
  type TicketStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mobile-contador")({
  head: () => ({
    meta: [
      { title: "Certus Parceiro — app mobile do contador" },
      {
        name: "description",
        content:
          "App mobile do contador parceiro Certus AC: acompanhe pedidos, cadastre clientes, faça pedidos de certificado, abra chamados e consulte comissões pelo celular.",
      },
      { property: "og:title", content: "Certus Parceiro — app mobile do contador" },
      {
        property: "og:description",
        content: "Pedidos, carteira, chamados e comissões do contador parceiro, direto do celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MobileContador,
});

type TabId = "painel" | "pedidos" | "clientes" | "chamados" | "comissoes";

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "painel", label: "Painel", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos", icon: FileSpreadsheet },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "chamados", label: "Chamados", icon: LifeBuoy },
  { id: "comissoes", label: "Comissões", icon: Percent },
];

const prioridades = ["baixa", "normal", "alta", "critica"] as const;

interface ChamadoParceiro {
  id: string;
  numero: string;
  cliente: string;
  assunto: string;
  categoria: TicketCategoria;
  subcategoria: string;
  prioridade: (typeof prioridades)[number];
  status: TicketStatus;
  abertoEm: string;
  atualizadoEm: string;
  responsavel: string;
  slaRestanteHoras: number;
}

const chamadosIniciais: ChamadoParceiro[] = [
  {
    id: "pch1",
    numero: "CH-4833",
    cliente: "Construtora Vale Norte LTDA",
    assunto: "Cliente não consegue assinar PDF com o token A3",
    categoria: "Instalação e uso",
    subcategoria: "Assinatura em PDF",
    prioridade: "alta",
    status: "em andamento",
    abertoEm: "há 1 dia",
    atualizadoEm: "há 2 h",
    responsavel: "Suporte N2 · Rafael",
    slaRestanteHoras: 3,
  },
  {
    id: "pch2",
    numero: "CH-4829",
    cliente: "Padaria Trigo de Ouro ME",
    assunto: "Documento reprovado na validação — reenvio",
    categoria: "Documentação",
    subcategoria: "Documento reprovado",
    prioridade: "normal",
    status: "aguardando cliente",
    abertoEm: "há 2 dias",
    atualizadoEm: "há 6 h",
    responsavel: "Validação · Marina",
    slaRestanteHoras: 12,
  },
  {
    id: "pch3",
    numero: "CH-4810",
    cliente: "Transportes Aurora S/A",
    assunto: "2ª via de boleto da competência atual",
    categoria: "Financeiro",
    subcategoria: "2ª via de boleto",
    prioridade: "baixa",
    status: "resolvido",
    abertoEm: "há 5 dias",
    atualizadoEm: "há 4 dias",
    responsavel: "Financeiro · Ana",
    slaRestanteHoras: 0,
  },
];

const chamadoTone: Record<TicketStatus, "blue" | "neutral" | "outline" | "deep" | "alert"> = {
  aberto: "deep",
  "em andamento": "blue",
  "aguardando cliente": "outline",
  resolvido: "neutral",
  fechado: "neutral",
};

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

const axis = { fontSize: 10, fill: "var(--muted-foreground)" } as const;
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 11,
} as const;

function stageNome(id: string) {
  return stages.find((s) => s.id === id)?.nome ?? id;
}

function useRelogio() {
  const [hora, setHora] = useState("--:--");
  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return hora;
}

function MobileContador() {
  const contador = contadorById("ct1")!;
  const hora = useRelogio();

  const [tab, setTab] = useState<TabId>("painel");
  const [aviso, setAviso] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "pedido" | "cliente" | "chamado" | "kb">(null);
  const [pedidoSel, setPedidoSel] = useState<string | null>(null);
  const [clienteSel, setClienteSel] = useState<string | null>(null);
  const [chamadoSel, setChamadoSel] = useState<string | null>(null);
  const [fabAberto, setFabAberto] = useState(false);

  const [carteira, setCarteira] = useState<CarteiraItem[]>(contador.carteira);
  const [pedidos, setPedidos] = useState<PedidoContador[]>(contador.pedidos);
  const [chamados, setChamados] = useState<ChamadoParceiro[]>(chamadosIniciais);

  const [busca, setBusca] = useState("");
  const [filtroPedido, setFiltroPedido] = useState<"todos" | "andamento" | "risco" | "concluidos">("andamento");
  const [chFiltro, setChFiltro] = useState<"todos" | "abertos" | "resolvidos">("todos");

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

  // form: novo chamado
  const [chCliente, setChCliente] = useState(contador.carteira[0]?.nome ?? "");
  const [chCategoria, setChCategoria] = useState<TicketCategoria>("Instalação e uso");
  const [chSub, setChSub] = useState(ticketCategorias[0]!.sub[0]!);
  const [chPrioridade, setChPrioridade] = useState<(typeof prioridades)[number]>("normal");
  const [chAssunto, setChAssunto] = useState("");
  const [chDescricao, setChDescricao] = useState("");

  const preco = tabelaPrecos.find((t) => t.tipo === pTipo)!;
  const emAndamento = pedidos.filter((p) => p.stage !== "concluido");
  const emRisco = pedidos.filter((p) => p.slaRestanteHoras <= 4 && p.stage !== "concluido");
  const concluidos = pedidos.filter((p) => p.stage === "concluido");
  const chamadosAbertos = chamados.filter((c) => c.status !== "resolvido" && c.status !== "fechado");
  const metaPct = Math.round((contador.emissoesMes / Math.max(1, contador.metaMes)) * 100);
  const vencendo = carteira.filter((c) => {
    const t = new Date(c.proximoVencimento).getTime();
    if (Number.isNaN(t)) return false;
    return Math.round((t - Date.now()) / 86_400_000) <= 30;
  });

  const carteiraFiltrada = useMemo(
    () =>
      carteira.filter(
        (c) => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.documento.includes(busca),
      ),
    [carteira, busca],
  );

  const pedidosFiltrados = useMemo(() => {
    if (filtroPedido === "andamento") return emAndamento;
    if (filtroPedido === "risco") return emRisco;
    if (filtroPedido === "concluidos") return concluidos;
    return pedidos;
  }, [filtroPedido, pedidos, emAndamento, emRisco, concluidos]);

  const chamadosFiltrados = chamados.filter((c) =>
    chFiltro === "todos"
      ? true
      : chFiltro === "abertos"
        ? c.status !== "resolvido" && c.status !== "fechado"
        : c.status === "resolvido" || c.status === "fechado",
  );

  const subsChamado = ticketCategorias.find((c) => c.nome === chCategoria)?.sub ?? [];
  const sugestoesKb = baseConhecimento.filter((a) => a.categoria === chCategoria);

  function notificar(msg: string) {
    setAviso(msg);
    setTimeout(() => setAviso(null), 6000);
  }

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
    notificar(`Cliente ${cNome.trim()} cadastrado na sua carteira.`);
    setCNome("");
    setCDoc("");
    setCEmail("");
    setCTel("");
    setSheet(null);
    setTab("clientes");
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
    notificar(`Pedido ${protocolo} enviado. Prazo estimado: ${preco.prazo}.`);
    setPObs("");
    setSheet(null);
    setFiltroPedido("andamento");
    setTab("pedidos");
  }

  function abrirChamado() {
    if (!chAssunto.trim() || !chDescricao.trim()) return;
    const numero = `CH-${4840 + chamados.length + Math.floor(Math.random() * 40)}`;
    setChamados((atual) => [
      {
        id: numero,
        numero,
        cliente: chCliente,
        assunto: chAssunto.trim(),
        categoria: chCategoria,
        subcategoria: chSub,
        prioridade: chPrioridade,
        status: "aberto",
        abertoEm: "agora",
        atualizadoEm: "agora",
        responsavel: "Fila de suporte",
        slaRestanteHoras: chPrioridade === "critica" ? 2 : chPrioridade === "alta" ? 4 : 8,
      },
      ...atual,
    ]);
    notificar(`Chamado ${numero} aberto. Primeira resposta em até 2 h úteis.`);
    setChAssunto("");
    setChDescricao("");
    setSheet(null);
    setTab("chamados");
  }

  const pedidoAberto = pedidos.find((p) => p.protocolo === pedidoSel);
  const clienteAberto = carteira.find((c) => c.id === clienteSel);
  const chamadoAberto = chamados.find((c) => c.id === chamadoSel);

  return (
    <div className="min-h-screen bg-muted/50 lg:flex lg:items-center lg:justify-center lg:gap-10 lg:p-10">
      <aside className="hidden max-w-sm lg:block">
        <p className="font-display text-2xl font-semibold">Certus Parceiro</p>
        <p className="mt-2 text-sm text-muted-foreground">
          App do contador credenciado. Tudo que existe no portal web: acompanhar pedidos, cadastrar clientes,
          fazer novos pedidos de certificado, abrir chamados e consultar comissões.
        </p>
        <Link to="/parceiro" className="mt-4 inline-block text-sm text-primary hover:underline">
          Abrir versão web do portal
        </Link>
      </aside>

      <div className="mx-auto w-full lg:w-[400px] lg:shrink-0 lg:rounded-[2.5rem] lg:border-8 lg:border-foreground/90 lg:shadow-2xl">
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background lg:h-[820px] lg:rounded-[2rem]">
          <div className="flex items-center justify-between bg-primary-deep px-5 pb-1 pt-2 text-[10px] font-medium text-primary-foreground tabular">
            <span>{hora}</span>
            <span className="flex items-center gap-1">
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <span>92%</span>
            </span>
          </div>

          <header className="bg-primary-deep px-5 pb-4 pt-2 text-primary-foreground">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-primary-foreground/70">Olá, {contador.responsavel}</p>
                <h1 className="truncate font-display text-lg font-semibold">{contador.nome}</h1>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground/10 text-[11px] font-bold">
                {contador.tier.slice(0, 2)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="rounded-full bg-primary-foreground/12 px-2 py-0.5 font-semibold uppercase tracking-wide">
                Tier {contador.tier}
              </span>
              <span className="rounded-full bg-primary-foreground/12 px-2 py-0.5 font-semibold uppercase tracking-wide">
                Comissão {contador.comissaoPercentual}%
              </span>
              <span className="text-primary-foreground/70">{contador.crc}</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overscroll-contain bg-muted/40 px-3 py-3 pb-28">
            {aviso && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-primary-soft px-3 py-2 text-[12px] text-primary-deep">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                <p>{aviso}</p>
              </div>
            )}

            {tab === "painel" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="Em andamento" value={String(emAndamento.length)} hint={`${emRisco.length} com SLA crítico`} tone={emRisco.length ? "alert" : "default"} />
                  <StatTile label="Emissões no mês" value={String(contador.emissoesMes)} hint={`meta ${contador.metaMes}`} tone="primary" />
                  <StatTile label="Comissão do mês" value={brl(contador.comissaoMes)} hint={`${contador.comissaoPercentual}% sobre a base`} />
                  <StatTile label="Chamados abertos" value={String(chamadosAbertos.length)} hint={`${chamados.length} no total`} />
                </div>

                <MCard title="Meta do mês" hint={`${metaPct}% atingido`}>
                  <MiniBar value={metaPct} tone={metaPct < 60 ? "alert" : "primary"} />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Faltam {Math.max(0, contador.metaMes - contador.emissoesMes)} emissões para o próximo tier de
                    comissão.
                  </p>
                </MCard>

                <MCard title="Produção" hint="emissões e receita por mês">
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={contador.serie} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="mes" tick={axis} axisLine={false} tickLine={false} />
                        <YAxis tick={axis} axisLine={false} tickLine={false} width={30} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey="emissoes"
                          stroke="var(--primary)"
                          fill="var(--primary-soft)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </MCard>

                <MCard title="Vencimentos em 30 dias" hint={`${vencendo.length} clientes`} bodyClassName="p-0">
                  {vencendo.length === 0 && (
                    <p className="px-4 py-4 text-[12px] text-muted-foreground">Nenhum vencimento próximo.</p>
                  )}
                  {vencendo.slice(0, 5).map((c) => (
                    <Row
                      key={c.id}
                      title={c.nome}
                      subtitle={`Vence em ${c.proximoVencimento} · ${c.certificadosAtivos} ativos`}
                      right={<ChevronRight className="size-4 text-muted-foreground" />}
                      onClick={() => {
                        setTab("clientes");
                        setClienteSel(c.id);
                      }}
                    />
                  ))}
                </MCard>

                <MCard title="Últimos pedidos" bodyClassName="p-0">
                  {pedidos.slice(0, 4).map((p) => (
                    <Row
                      key={p.id}
                      title={`${p.protocolo} · ${p.cliente}`}
                      subtitle={`${p.tipo} · ${stageNome(p.stage)}`}
                      right={<SlaBadge horas={p.slaRestanteHoras} />}
                      onClick={() => setPedidoSel(p.protocolo)}
                    />
                  ))}
                </MCard>

                <MCard title="Tabela de preços do parceiro" bodyClassName="p-0">
                  {tabelaPrecos.map((t) => (
                    <Row
                      key={t.tipo}
                      title={t.tipo}
                      subtitle={`Balcão ${brl(t.balcao)} · ${t.prazo}`}
                      right={<span className="text-[12px] font-semibold tabular text-primary-deep">{brl(t.parceiro)}</span>}
                    />
                  ))}
                </MCard>
              </div>
            )}

            {tab === "pedidos" && (
              <div className="space-y-3">
                <Seg
                  value={filtroPedido}
                  onChange={(v) => setFiltroPedido(v as typeof filtroPedido)}
                  items={[
                    { id: "andamento", label: `Ativos ${emAndamento.length}` },
                    { id: "risco", label: `SLA ${emRisco.length}` },
                    { id: "concluidos", label: "Concluídos" },
                    { id: "todos", label: "Todos" },
                  ]}
                />
                <MCard bodyClassName="p-0">
                  {pedidosFiltrados.length === 0 && (
                    <p className="px-4 py-5 text-center text-[12px] text-muted-foreground">Nenhum pedido aqui.</p>
                  )}
                  {pedidosFiltrados.map((p) => (
                    <Row
                      key={p.id}
                      title={`${p.protocolo} · ${p.cliente}`}
                      subtitle={`${p.tipo} · ${stageNome(p.stage)} · ${brl(p.valor)}`}
                      right={<SlaBadge horas={p.slaRestanteHoras} />}
                      onClick={() => setPedidoSel(p.protocolo)}
                    />
                  ))}
                </MCard>
                <button
                  type="button"
                  onClick={() => setSheet("pedido")}
                  className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground"
                >
                  Novo pedido de certificado
                </button>
              </div>
            )}

            {tab === "clientes" && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome ou documento"
                    className="w-full bg-transparent text-[13px] outline-none"
                  />
                </label>
                <MCard bodyClassName="p-0">
                  {carteiraFiltrada.map((c) => (
                    <Row
                      key={c.id}
                      title={c.nome}
                      subtitle={`${c.documento} · ${c.certificadosAtivos} certificados`}
                      right={<Chip tone={situacaoTone[c.situacao]}>{c.situacao}</Chip>}
                      onClick={() => setClienteSel(c.id)}
                    />
                  ))}
                  {carteiraFiltrada.length === 0 && (
                    <p className="px-4 py-5 text-center text-[12px] text-muted-foreground">Nada encontrado.</p>
                  )}
                </MCard>
                <button
                  type="button"
                  onClick={() => setSheet("cliente")}
                  className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground"
                >
                  Cadastrar novo cliente
                </button>
              </div>
            )}

            {tab === "chamados" && (
              <div className="space-y-3">
                <Seg
                  value={chFiltro}
                  onChange={(v) => setChFiltro(v as typeof chFiltro)}
                  items={[
                    { id: "todos", label: "Todos" },
                    { id: "abertos", label: `Abertos ${chamadosAbertos.length}` },
                    { id: "resolvidos", label: "Resolvidos" },
                  ]}
                />
                <MCard bodyClassName="p-0">
                  {chamadosFiltrados.map((c) => (
                    <Row
                      key={c.id}
                      title={`${c.numero} · ${c.assunto}`}
                      subtitle={`${c.cliente} · ${c.categoria} · ${c.atualizadoEm}`}
                      right={<Chip tone={chamadoTone[c.status]}>{c.status}</Chip>}
                      onClick={() => setChamadoSel(c.id)}
                    />
                  ))}
                </MCard>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSheet("chamado")}
                    className="rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground"
                  >
                    Abrir chamado
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet("kb")}
                    className="rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold"
                  >
                    Base de ajuda
                  </button>
                </div>
              </div>
            )}

            {tab === "comissoes" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="Comissão do mês" value={brl(contador.comissaoMes)} tone="primary" />
                  <StatTile label="Receita gerada (ano)" value={brl(contador.receitaAno)} />
                  <StatTile label="Ticket médio" value={brl(contador.ticketMedio)} />
                  <StatTile label="Percentual" value={`${contador.comissaoPercentual}%`} hint={contador.tabelaEspecial} />
                </div>
                <MCard title="Extrato de comissões" bodyClassName="p-0">
                  {contador.extrato.map((e) => (
                    <Row
                      key={e.id}
                      title={`${e.competencia} · ${brl(e.valor)}`}
                      subtitle={`${e.emissoes} emissões · base ${brl(e.base)} · ${e.percentual}% · ${e.pagamento}`}
                      right={<Chip tone={comissaoTone[e.status]}>{e.status}</Chip>}
                    />
                  ))}
                </MCard>
                <MCard title="Como sua comissão é calculada">
                  <p className="text-[12px] text-muted-foreground">
                    {contador.comissaoPercentual}% sobre a receita líquida das emissões faturadas no mês, apuradas
                    no dia 1º e pagas até o 10º dia útil. Pedidos cancelados ou estornados são retidos na
                    competência seguinte.
                  </p>
                </MCard>
              </div>
            )}
          </main>

          {/* FAB de ações rápidas */}
          <div className="absolute bottom-20 right-4 z-10 flex flex-col items-end gap-2">
            {fabAberto && (
              <>
                <FabItem label="Novo pedido" icon={FileSpreadsheet} onClick={() => { setSheet("pedido"); setFabAberto(false); }} />
                <FabItem label="Novo cliente" icon={Building2} onClick={() => { setSheet("cliente"); setFabAberto(false); }} />
                <FabItem label="Abrir chamado" icon={LifeBuoy} onClick={() => { setSheet("chamado"); setFabAberto(false); }} />
              </>
            )}
            <button
              type="button"
              onClick={() => setFabAberto((v) => !v)}
              aria-label="Ações rápidas"
              className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
            >
              {fabAberto ? <X className="size-5" /> : <Plus className="size-5" />}
            </button>
          </div>

          <nav className="absolute inset-x-0 bottom-0 grid grid-cols-5 border-t border-border bg-card/95 pb-2 pt-1.5 backdrop-blur lg:rounded-b-[2rem]">
            {tabs.map((t) => {
              const ativo = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setFabAberto(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
                    ativo ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className={cn("grid size-8 place-items-center rounded-full transition-colors", ativo && "bg-primary-soft")}>
                    <t.icon className="size-4" />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* ------- Sheets de ação ------- */}
          {sheet === "pedido" && (
            <Sheet titulo="Novo pedido" onFechar={() => setSheet(null)}>
              <div className="space-y-3">
                <Campo label="Cliente">
                  <select value={pCliente} onChange={(e) => setPCliente(e.target.value)} className={inputCls}>
                    {carteira.map((c) => (
                      <option key={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Tipo de certificado">
                  <select value={pTipo} onChange={(e) => setPTipo(e.target.value as CertType)} className={inputCls}>
                    {tabelaPrecos.map((t) => (
                      <option key={t.tipo}>{t.tipo}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Modalidade de validação">
                  <select value={pModalidade} onChange={(e) => setPModalidade(e.target.value)} className={inputCls}>
                    <option>Videoconferência</option>
                    <option>Presencial no escritório do contador</option>
                    <option>Presencial na AC</option>
                    <option>Renovação por videoconferência</option>
                  </select>
                </Campo>
                <Campo label="Observações">
                  <textarea
                    value={pObs}
                    onChange={(e) => setPObs(e.target.value)}
                    rows={3}
                    placeholder="Preferência de horário, contato do titular, etc."
                    className={inputCls}
                  />
                </Campo>
                <div className="rounded-xl bg-primary-soft px-3 py-2.5 text-[12px] text-primary-deep">
                  <p className="font-semibold">
                    {brl(preco.parceiro)} <span className="font-normal">preço parceiro</span>
                  </p>
                  <p className="text-[11px]">
                    Balcão {brl(preco.balcao)} · prazo {preco.prazo} · comissão estimada{" "}
                    {brl((preco.parceiro * contador.comissaoPercentual) / 100)}
                  </p>
                </div>
                <button type="button" onClick={enviarPedido} className={btnCls}>
                  Enviar pedido para a Certus AC
                </button>
              </div>
            </Sheet>
          )}

          {sheet === "cliente" && (
            <Sheet titulo="Novo cliente" onFechar={() => setSheet(null)}>
              <div className="space-y-3">
                <Campo label="Tipo de pessoa">
                  <Seg
                    value={cTipo}
                    onChange={(v) => setCTipo(v as "PF" | "PJ")}
                    items={[
                      { id: "PJ", label: "Pessoa jurídica" },
                      { id: "PF", label: "Pessoa física" },
                    ]}
                  />
                </Campo>
                <Campo label={cTipo === "PJ" ? "Razão social" : "Nome completo"}>
                  <input value={cNome} onChange={(e) => setCNome(e.target.value)} className={inputCls} placeholder="Nome do cliente" />
                </Campo>
                <Campo label={cTipo === "PJ" ? "CNPJ" : "CPF"}>
                  <input value={cDoc} onChange={(e) => setCDoc(e.target.value)} className={inputCls} placeholder="Somente números" />
                </Campo>
                <Campo label="E-mail">
                  <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} className={inputCls} placeholder="contato@empresa.com.br" />
                </Campo>
                <Campo label="Telefone">
                  <input value={cTel} onChange={(e) => setCTel(e.target.value)} className={inputCls} placeholder="(11) 90000-0000" />
                </Campo>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Paperclip className="size-3" /> Documentos podem ser anexados depois, na etapa de validação.
                </p>
                <button type="button" onClick={salvarCliente} className={btnCls}>
                  Cadastrar na minha carteira
                </button>
              </div>
            </Sheet>
          )}

          {sheet === "chamado" && (
            <Sheet titulo="Abrir chamado" onFechar={() => setSheet(null)}>
              <div className="space-y-3">
                <Campo label="Cliente">
                  <select value={chCliente} onChange={(e) => setChCliente(e.target.value)} className={inputCls}>
                    {carteira.map((c) => (
                      <option key={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Categoria">
                  <select
                    value={chCategoria}
                    onChange={(e) => {
                      const cat = e.target.value as TicketCategoria;
                      setChCategoria(cat);
                      setChSub(ticketCategorias.find((c) => c.nome === cat)?.sub[0] ?? "");
                    }}
                    className={inputCls}
                  >
                    {ticketCategorias.map((c) => (
                      <option key={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Subcategoria">
                  <select value={chSub} onChange={(e) => setChSub(e.target.value)} className={inputCls}>
                    {subsChamado.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Prioridade">
                  <Seg
                    value={chPrioridade}
                    onChange={(v) => setChPrioridade(v as (typeof prioridades)[number])}
                    items={prioridades.map((p) => ({ id: p, label: p }))}
                  />
                </Campo>
                <Campo label="Assunto">
                  <input value={chAssunto} onChange={(e) => setChAssunto(e.target.value)} className={inputCls} placeholder="Resumo do problema" />
                </Campo>
                <Campo label="Descrição">
                  <textarea value={chDescricao} onChange={(e) => setChDescricao(e.target.value)} rows={4} className={inputCls} placeholder="Detalhe o que aconteceu, mensagens de erro, etc." />
                </Campo>
                {sugestoesKb.length > 0 && (
                  <MCard title="Talvez resolva agora" bodyClassName="p-0">
                    {sugestoesKb.map((a) => (
                      <Row key={a.id} title={a.titulo} subtitle={`${a.views} visualizações`} />
                    ))}
                  </MCard>
                )}
                <button type="button" onClick={abrirChamado} className={btnCls}>
                  Abrir chamado
                </button>
              </div>
            </Sheet>
          )}

          {sheet === "kb" && (
            <Sheet titulo="Base de ajuda" onFechar={() => setSheet(null)}>
              <MCard bodyClassName="p-0">
                {baseConhecimento.map((a) => (
                  <Row
                    key={a.id}
                    title={a.titulo}
                    subtitle={`${a.categoria} · ${a.views} visualizações`}
                    right={<BookOpen className="size-4 text-muted-foreground" />}
                  />
                ))}
              </MCard>
            </Sheet>
          )}

          {/* ------- Detalhes ------- */}
          {pedidoAberto && (
            <Sheet titulo={pedidoAberto.protocolo} onFechar={() => setPedidoSel(null)}>
              <div className="space-y-3">
                <MCard>
                  <p className="font-display text-sm font-semibold">{pedidoAberto.cliente}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {pedidoAberto.tipo} · aberto em {pedidoAberto.abertoEm}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Chip tone="blue">{stageNome(pedidoAberto.stage)}</Chip>
                    <SlaBadge horas={pedidoAberto.slaRestanteHoras} />
                    <span className="ml-auto text-[13px] font-semibold tabular">{brl(pedidoAberto.valor)}</span>
                  </div>
                </MCard>
                <MCard title="Andamento" bodyClassName="p-0">
                  {stages.map((s, i) => {
                    const idx = stages.findIndex((x) => x.id === pedidoAberto.stage);
                    const feito = i < idx;
                    const atual = i === idx;
                    return (
                      <Row
                        key={s.id}
                        title={s.nome}
                        subtitle={feito ? "concluído" : atual ? "em andamento" : "aguardando"}
                        right={
                          <Chip tone={feito ? "neutral" : atual ? "blue" : "outline"}>
                            {feito ? "ok" : atual ? "agora" : "—"}
                          </Chip>
                        }
                      />
                    );
                  })}
                </MCard>
                <MCard title="Responsável na AC">
                  <p className="text-[12px] text-muted-foreground">{pedidoAberto.responsavel}</p>
                </MCard>
                <button
                  type="button"
                  onClick={() => {
                    setChCliente(pedidoAberto.cliente);
                    setPedidoSel(null);
                    setSheet("chamado");
                  }}
                  className="w-full rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold"
                >
                  Abrir chamado sobre este pedido
                </button>
              </div>
            </Sheet>
          )}

          {clienteAberto && (
            <Sheet titulo={clienteAberto.nome} onFechar={() => setClienteSel(null)}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="Certificados ativos" value={String(clienteAberto.certificadosAtivos)} />
                  <StatTile label="Receita no ano" value={brl(clienteAberto.receitaAno)} />
                  <StatTile label="Próx. vencimento" value={clienteAberto.proximoVencimento} tone="primary" />
                  <StatTile label="Última emissão" value={clienteAberto.ultimaEmissao} />
                </div>
                <MCard title="Cadastro">
                  <p className="text-[12px] text-muted-foreground">
                    {clienteAberto.documento} · {clienteAberto.tipoPessoa} · situação {clienteAberto.situacao}
                  </p>
                </MCard>
                <MCard title="Pedidos do cliente" bodyClassName="p-0">
                  {pedidos.filter((p) => p.cliente === clienteAberto.nome).length === 0 && (
                    <p className="px-4 py-4 text-[12px] text-muted-foreground">Nenhum pedido registrado.</p>
                  )}
                  {pedidos
                    .filter((p) => p.cliente === clienteAberto.nome)
                    .map((p) => (
                      <Row
                        key={p.id}
                        title={`${p.protocolo} · ${p.tipo}`}
                        subtitle={stageNome(p.stage)}
                        right={<SlaBadge horas={p.slaRestanteHoras} />}
                        onClick={() => {
                          setClienteSel(null);
                          setPedidoSel(p.protocolo);
                        }}
                      />
                    ))}
                </MCard>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPCliente(clienteAberto.nome);
                      setClienteSel(null);
                      setSheet("pedido");
                    }}
                    className={btnCls}
                  >
                    Fazer pedido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChCliente(clienteAberto.nome);
                      setClienteSel(null);
                      setSheet("chamado");
                    }}
                    className="rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold"
                  >
                    Abrir chamado
                  </button>
                </div>
              </div>
            </Sheet>
          )}

          {chamadoAberto && (
            <Sheet titulo={chamadoAberto.numero} onFechar={() => setChamadoSel(null)}>
              <div className="space-y-3">
                <MCard>
                  <p className="font-display text-sm font-semibold">{chamadoAberto.assunto}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {chamadoAberto.cliente} · {chamadoAberto.categoria} / {chamadoAberto.subcategoria}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Chip tone={chamadoTone[chamadoAberto.status]}>{chamadoAberto.status}</Chip>
                    <Chip tone="outline">prioridade {chamadoAberto.prioridade}</Chip>
                    <SlaBadge horas={chamadoAberto.slaRestanteHoras} />
                  </div>
                </MCard>
                <MCard title="Atendimento" bodyClassName="p-0">
                  <Row title="Responsável" subtitle={chamadoAberto.responsavel} />
                  <Row title="Aberto" subtitle={chamadoAberto.abertoEm} />
                  <Row title="Última atualização" subtitle={chamadoAberto.atualizadoEm} />
                </MCard>
                <MCard title="Responder">
                  <textarea rows={3} placeholder="Escreva uma resposta ao suporte" className={inputCls} />
                  <button
                    type="button"
                    onClick={() => notificar(`Resposta registrada no chamado ${chamadoAberto.numero}.`)}
                    className={cn(btnCls, "mt-2")}
                  >
                    Enviar resposta
                  </button>
                </MCard>
              </div>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-primary";
const btnCls = "w-full rounded-xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function FabItem({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[12px] font-medium shadow-md"
    >
      <Icon className="size-3.5 text-primary" />
      {label}
    </button>
  );
}

function Seg({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 rounded-full border border-border bg-card p-1">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onChange(i.id)}
          className={cn(
            "flex-1 truncate rounded-full px-2 py-1.5 text-[11px] font-medium capitalize transition-colors",
            value === i.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

function Sheet({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background lg:rounded-[2rem]">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button type="button" onClick={onFechar} className="grid size-8 place-items-center rounded-full bg-muted" aria-label="Voltar">
          <ArrowLeft className="size-4" />
        </button>
        <h2 className="truncate font-display text-sm font-semibold">{titulo}</h2>
        <CalendarClock className="size-4 text-muted-foreground" />
      </header>
      <div className="flex-1 overflow-y-auto bg-muted/40 px-3 py-3 pb-10">{children}</div>
    </div>
  );
}
