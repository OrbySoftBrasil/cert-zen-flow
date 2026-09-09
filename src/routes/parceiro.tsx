import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  LayoutDashboard,
  LifeBuoy,
  Paperclip,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
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
import { useStore } from "@/lib/store";
import type { DocumentFile } from "@/lib/mock-data";
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
        content:
          "Pedidos, carteira de clientes, novos pedidos e extrato de comissões do parceiro contábil.",
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
  { id: "chamados", label: "Chamados", icon: LifeBuoy },
  { id: "comissoes", label: "Comissões", icon: Percent },
] as const;

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
  const [chamados, setChamados] = useState<ChamadoParceiro[]>(chamadosIniciais);

  // form: novo chamado
  const [chCliente, setChCliente] = useState(contador.carteira[0]?.nome ?? "");
  const [chCategoria, setChCategoria] = useState<TicketCategoria>("Instalação e uso");
  const [chSub, setChSub] = useState(ticketCategorias[0]!.sub[0]!);
  const [chPrioridade, setChPrioridade] = useState<(typeof prioridades)[number]>("normal");
  const [chAssunto, setChAssunto] = useState("");
  const [chDescricao, setChDescricao] = useState("");
  const [chFiltro, setChFiltro] = useState<"todos" | "abertos" | "resolvidos">("todos");

  // documentos por cliente (chave: documento do cliente)
  const { clients, addDocument: addDocumentoGlobal } = useStore();
  const [docs, setDocs] = useState<Record<string, DocumentFile[]>>({});
  const [docsDe, setDocsDe] = useState<CarteiraItem | null>(null);
  const [cDocsNovos, setCDocsNovos] = useState<{ nome: string; tipo: string }[]>([]);
  const tiposDocumento = [
    "Contrato social",
    "Documento de identidade",
    "CPF do responsável",
    "Comprovante de endereço",
    "Procuração",
    "Cartão CNPJ",
    "Selfie de validação",
  ];

  function anexarDocumento(cliente: CarteiraItem, nome: string, tipo: string) {
    const doc: DocumentFile = {
      id: `pd${Math.random().toString(36).slice(2, 8)}`,
      nome,
      tipo,
      enviadoEm: new Date().toISOString().slice(0, 10),
      status: "em análise",
    };
    setDocs((atual) => ({
      ...atual,
      [cliente.documento]: [doc, ...(atual[cliente.documento] ?? [])],
    }));
    const global = clients.find((c) => c.documento === cliente.documento);
    if (global)
      addDocumentoGlobal(global.id, { nome, tipo, enviadoEm: doc.enviadoEm, status: "em análise" });
  }

  function removerDocumento(documentoCliente: string, docId: string) {
    setDocs((atual) => ({
      ...atual,
      [documentoCliente]: (atual[documentoCliente] ?? []).filter((d) => d.id !== docId),
    }));
  }

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
        (c) => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.documento.includes(busca),
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
    if (cDocsNovos.length) {
      setDocs((atual) => ({
        ...atual,
        [cDoc.trim()]: cDocsNovos.map((d, i) => ({
          id: `pd${i}${Math.random().toString(36).slice(2, 6)}`,
          nome: d.nome,
          tipo: d.tipo,
          enviadoEm: new Date().toISOString().slice(0, 10),
          status: "em análise" as const,
        })),
      }));
    }
    setAviso(
      `Cliente ${cNome.trim()} cadastrado na sua carteira${cDocsNovos.length ? ` com ${cDocsNovos.length} documento(s) anexado(s)` : ""}.`,
    );
    setCDocsNovos([]);
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
    setAviso(`Chamado ${numero} aberto. Primeira resposta prevista em até 2 horas úteis.`);
    setChAssunto("");
    setChDescricao("");
    setTimeout(() => setAviso(null), 6000);
  }

  const chamadosAbertos = chamados.filter(
    (c) => c.status !== "resolvido" && c.status !== "fechado",
  );
  const chamadosFiltrados = chamados.filter((c) =>
    chFiltro === "todos"
      ? true
      : chFiltro === "abertos"
        ? c.status !== "resolvido" && c.status !== "fechado"
        : c.status === "resolvido" || c.status === "fechado",
  );
  const subsChamado = ticketCategorias.find((c) => c.nome === chCategoria)?.sub ?? [];
  const sugestoesKb = baseConhecimento.filter((a) => a.categoria === chCategoria);

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
      nome: "Chamados",
      linhas: chamados.map((c) => ({
        Protocolo: c.numero,
        Cliente: c.cliente,
        Assunto: c.assunto,
        Categoria: c.categoria,
        Subcategoria: c.subcategoria,
        Prioridade: c.prioridade,
        Status: c.status,
        "SLA (h)": c.slaRestanteHoras,
        Atualizado: c.atualizadoEm,
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
            <h1 className="font-display text-sm font-semibold">Certus AC · Portal do parceiro</h1>
            <p className="text-[11px] text-muted-foreground">
              {contador.nome} · {contador.crc}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Chip tone="blue">Tier {contador.tier}</Chip>
            <Chip tone="outline">Comissão {contador.comissaoPercentual}%</Chip>
            <Link
              to="/mobile-contador"
              className="hidden text-xs text-primary hover:underline sm:block"
            >
              Ver no app
            </Link>
            <Link
              to="/contadores/$id"
              params={{ id: contador.id }}
              className="hidden text-xs text-primary hover:underline sm:block"
            >
              Visão interna
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                aba === a.id
                  ? "border-primary font-medium text-primary-deep"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <a.icon className="size-4" />
              {a.label}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 py-2">
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
                {
                  label: "Pedidos em andamento",
                  valor: String(emAndamento.length),
                  hint: `${emRisco.length} com SLA crítico`,
                },
                {
                  label: "Emissões no mês",
                  valor: String(contador.emissoesMes),
                  hint: `meta ${contador.metaMes}`,
                },
                {
                  label: "Comissão a receber",
                  valor: brl(contador.comissaoAberta),
                  hint: `acumulado ${brl(contador.comissaoAcumulada)}`,
                },
                {
                  label: "Clientes na carteira",
                  valor: String(carteira.length),
                  hint: `${vencendo.length} vencendo em 30 dias`,
                },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
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
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
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
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / {contador.metaMes}
                    </span>
                  </p>
                  <div className="mt-2">
                    <Bar value={metaPct} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {metaPct}% da meta · faltam{" "}
                    {Math.max(0, contador.metaMes - contador.emissoesMes)} emissões para o bônus do
                    tier.
                  </p>
                </Panel>

                <Panel title="Renovações a vender" hint="clientes vencendo em 30 dias">
                  <ul className="space-y-2">
                    {vencendo.slice(0, 5).map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">{c.nome}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular">
                          {c.proximoVencimento}
                        </span>
                      </li>
                    ))}
                    {vencendo.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        Nenhuma renovação nos próximos 30 dias.
                      </li>
                    )}
                  </ul>
                </Panel>
              </div>
            </div>

            <Panel
              title="Pedidos recentes"
              actions={
                <button
                  onClick={() => setAba("pedidos")}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
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
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{m.valor}</p>
                </div>
              ))}
            </div>
            <Panel
              title="Todos os pedidos"
              hint="status em tempo real na operação da Certus AC"
              bodyClassName="p-0"
            >
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
                    <th className="px-4 py-2.5 font-medium">Documentos</th>
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
                      <td className="px-4 py-3 text-muted-foreground tabular">
                        {c.proximoVencimento}
                      </td>
                      <td className="px-4 py-3 tabular">{brl(c.receitaAno)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDocsDe(c)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-primary hover:text-primary-deep"
                        >
                          <Paperclip className="size-3" />
                          {(docs[c.documento] ?? []).length} arquivo(s)
                        </button>
                      </td>
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
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {aba === "chamados" && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Chamados abertos", valor: chamadosAbertos.length },
                {
                  label: "SLA crítico",
                  valor: chamadosAbertos.filter((c) => c.slaRestanteHoras <= 4).length,
                },
                {
                  label: "Resolvidos (30d)",
                  valor: chamados.filter((c) => c.status === "resolvido" || c.status === "fechado")
                    .length,
                },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{m.valor}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <Panel title="Abrir chamado para um cliente" hint="suporte 8h às 20h em dias úteis">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Cliente da carteira</span>
                      <select
                        value={chCliente}
                        onChange={(e) => setChCliente(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                      >
                        {carteira.map((c) => (
                          <option key={c.id} value={c.nome}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Urgência</span>
                      <select
                        value={chPrioridade}
                        onChange={(e) =>
                          setChPrioridade(e.target.value as (typeof prioridades)[number])
                        }
                        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm capitalize outline-none focus:border-primary"
                      >
                        {prioridades.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Categoria</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ticketCategorias.map((c) => (
                        <button
                          key={c.nome}
                          onClick={() => {
                            setChCategoria(c.nome);
                            setChSub(c.sub[0]!);
                          }}
                          className={cn(
                            "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                            chCategoria === c.nome
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-muted-foreground hover:border-primary",
                          )}
                        >
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Assunto específico</span>
                      <select
                        value={chSub}
                        onChange={(e) => setChSub(e.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                      >
                        {subsChamado.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Título do chamado</span>
                      <input
                        value={chAssunto}
                        maxLength={120}
                        onChange={(e) => setChAssunto(e.target.value)}
                        placeholder="Ex.: certificado não aparece no e-CAC"
                        className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs text-muted-foreground">Descrição</span>
                    <textarea
                      value={chDescricao}
                      maxLength={2000}
                      rows={4}
                      onChange={(e) => setChDescricao(e.target.value)}
                      placeholder="Descreva o que aconteceu, mensagens de erro e o que já foi tentado."
                      className="mt-1 w-full resize-none rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                    />
                    <span className="text-[11px] text-muted-foreground tabular">
                      {chDescricao.length}/2000
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary">
                      <Paperclip className="size-3.5" /> Anexar print ou documento
                    </button>
                    <button
                      onClick={abrirChamado}
                      disabled={!chAssunto.trim() || !chDescricao.trim()}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Abrir chamado
                    </button>
                  </div>
                </div>
              </Panel>

              <Panel title="Talvez resolva agora" hint="base de conhecimento">
                <ul className="space-y-2.5 text-sm">
                  {(sugestoesKb.length ? sugestoesKb : baseConhecimento.slice(0, 3)).map((a) => (
                    <li key={a.id} className="flex items-start gap-2">
                      <LifeBuoy className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="leading-snug">{a.titulo}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  Chamados abertos pelo portal do parceiro entram na mesma fila da operação, com SLA
                  de primeira resposta de 2 horas úteis.
                </p>
              </Panel>
            </div>

            <Panel
              title="Chamados dos meus clientes"
              hint={`${chamados.length} protocolos`}
              actions={
                <div className="flex gap-1.5">
                  {(["todos", "abertos", "resolvidos"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setChFiltro(f)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-xs capitalize transition-colors",
                        chFiltro === f
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:border-primary",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              }
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Protocolo</th>
                      <th className="px-4 py-2.5 font-medium">Cliente / assunto</th>
                      <th className="px-4 py-2.5 font-medium">Categoria</th>
                      <th className="px-4 py-2.5 font-medium">Prioridade</th>
                      <th className="px-4 py-2.5 font-medium">SLA</th>
                      <th className="px-4 py-2.5 font-medium">Atualizado</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {chamadosFiltrados.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium tabular whitespace-nowrap">
                          {c.numero}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium leading-snug">{c.assunto}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.cliente} · {c.responsavel}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <p className="whitespace-nowrap">{c.categoria}</p>
                          <p className="text-[11px]">{c.subcategoria}</p>
                        </td>
                        <td className="px-4 py-3 capitalize">{c.prioridade}</td>
                        <td className="px-4 py-3">
                          {c.status === "resolvido" || c.status === "fechado" ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <SlaBadge horas={c.slaRestanteHoras} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {c.atualizadoEm}
                        </td>
                        <td className="px-4 py-3">
                          <Chip tone={chamadoTone[c.status]}>{c.status}</Chip>
                        </td>
                      </tr>
                    ))}
                    {chamadosFiltrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          Nenhum chamado neste filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}

        {aba === "comissoes" && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "A receber",
                  valor: brl(contador.comissaoAberta),
                  hint: "competência atual",
                },
                {
                  label: "Comissão do mês",
                  valor: brl(contador.comissaoMes),
                  hint: `${contador.comissaoPercentual}% sobre a base`,
                },
                {
                  label: "Acumulado no ano",
                  valor: brl(contador.comissaoAcumulada),
                  hint: `${contador.emissoesAno} emissões`,
                },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
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

            <Panel
              title="Sua tabela de preços"
              hint="valores parceiro já com desconto do tier"
              bodyClassName="p-0"
            >
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
                        <td className="px-4 py-3 text-muted-foreground tabular line-through">
                          {brl(t.balcao)}
                        </td>
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
            <Campo
              label={cTipo === "PJ" ? "Razão social" : "Nome completo"}
              value={cNome}
              onChange={setCNome}
            />
            <Campo label={cTipo === "PJ" ? "CNPJ" : "CPF"} value={cDoc} onChange={setCDoc} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="E-mail do responsável" value={cEmail} onChange={setCEmail} />
              <Campo label="Telefone" value={cTel} onChange={setCTel} />
            </div>
            <div className="rounded-md border border-dashed border-border p-3">
              <p className="text-xs font-medium">Documentos do cliente</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Anexe aqui os documentos exigidos na validação — eles ficam visíveis no cockpit do
                cliente na Certus AC.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tiposDocumento.map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setCDocsNovos((atual) =>
                        atual.some((d) => d.tipo === t)
                          ? atual.filter((d) => d.tipo !== t)
                          : [
                              ...atual,
                              { tipo: t, nome: `${t.toLowerCase().replace(/\s+/g, "-")}.pdf` },
                            ],
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
                      cDocsNovos.some((d) => d.tipo === t)
                        ? "border-primary bg-primary-soft text-primary-deep"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    <Upload className="size-3" /> {t}
                  </button>
                ))}
              </div>
              {cDocsNovos.length > 0 && (
                <p className="mt-2 text-[11px] text-primary-deep">
                  {cDocsNovos.length} documento(s) prontos para envio · entram como “em análise”.
                </p>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              O cliente entra na sua carteira e a comissão de todas as emissões dele é atribuída a
              você automaticamente.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setNovoCliente(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
              >
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

      {docsDe && (
        <Modal titulo={`Documentos · ${docsDe.nome}`} onClose={() => setDocsDe(null)}>
          <div className="space-y-3">
            <div className="rounded-md border border-dashed border-border p-3">
              <p className="text-xs font-medium">Anexar novo documento</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tiposDocumento.map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      anexarDocumento(docsDe, `${t.toLowerCase().replace(/\s+/g, "-")}.pdf`, t)
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary-deep"
                  >
                    <Upload className="size-3" /> {t}
                  </button>
                ))}
              </div>
            </div>

            <ul className="divide-y divide-border rounded-md border border-border">
              {(docs[docsDe.documento] ?? []).map((d) => (
                <li key={d.id} className="flex items-center gap-2 px-3 py-2">
                  <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{d.nome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.tipo} · enviado em {d.enviadoEm}
                    </p>
                  </div>
                  <Chip
                    tone={
                      d.status === "aprovado"
                        ? "blue"
                        : d.status === "reprovado"
                          ? "alert"
                          : "neutral"
                    }
                  >
                    {d.status}
                  </Chip>
                  <button
                    onClick={() => removerDocumento(docsDe.documento, d.id)}
                    aria-label={`Remover ${d.nome}`}
                    className="grid size-6 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-alert hover:text-alert"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </li>
              ))}
              {(docs[docsDe.documento] ?? []).length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhum documento anexado para este cliente.
                </li>
              )}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              Documentos anexados aqui aparecem para a equipe de validação da Certus AC e podem ser
              aprovados ou reprovados durante a esteira.
            </p>
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
                {["Videoconferência", "Presencial no escritório", "Renovação por vínculo"].map(
                  (m) => (
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
                  ),
                )}
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
              <button
                onClick={() => setNovoPedido(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
              >
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
                <Chip
                  tone={
                    p.stage === "concluido" ? "blue" : p.stage === "bloqueado" ? "alert" : "neutral"
                  }
                >
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"
      onClick={onClose}
    >
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
