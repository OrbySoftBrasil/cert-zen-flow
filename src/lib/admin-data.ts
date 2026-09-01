// Admin Center — dados do plano de controle do SaaS (multi-tenant).
// Tudo determinístico (sem Math.random) para evitar divergência entre SSR e cliente.

export type StatusTenant = "ativo" | "trial" | "suspenso" | "onboarding" | "cancelado";
export type PlanoId = "starter" | "pro" | "scale" | "enterprise";
export type Regiao = "br-sp" | "br-rj" | "br-ne";

export interface Tenant {
  id: string;
  nome: string;
  slug: string;
  cnpj: string;
  responsavel: string;
  email: string;
  telefone: string;
  status: StatusTenant;
  plano: PlanoId;
  regiao: Regiao;
  desde: string;
  renovaEm: string;
  usuarios: number;
  usuariosLimite: number;
  emissoesMes: number;
  emissoesLimite: number;
  mrr: number;
  consumoIa: number; // R$ no mês
  mensagensWhats: number;
  emailsEnviados: number;
  storageGb: number;
  inadimplente: boolean;
  saudeScore: number; // 0-100
  nps: number;
  ultimoAcesso: string;
  dominio: string;
  serie: { mes: string; mrr: number; emissoes: number; ia: number }[];
  faturas: { id: string; competencia: string; valor: number; status: "paga" | "aberta" | "vencida"; vencimento: string }[];
}

export interface PlanoSaas {
  id: PlanoId;
  nome: string;
  preco: number;
  precoAnual: number;
  usuarios: number;
  emissoes: number;
  excedenteEmissao: number;
  storageGb: number;
  suporte: string;
  destaque: boolean;
  ativo: boolean;
  recursos: string[];
}

export interface Integracao {
  id: string;
  nome: string;
  categoria: "Mensageria" | "E-mail" | "IA" | "Pagamentos" | "Infra";
  provedor: string;
  status: "conectado" | "degradado" | "desconectado";
  chaveMascarada: string;
  endpoint: string;
  escopo: "global" | "por tenant";
  ultimoTeste: string;
  latenciaMs: number;
  sucesso30d: number;
  chamadas30d: number;
  custoMes: number;
  notas: string;
}

export interface Servico {
  id: string;
  nome: string;
  tipo: "API" | "Banco" | "Cache" | "Fila" | "Worker" | "Edge";
  status: "operacional" | "degradado" | "fora do ar";
  uptime30d: number;
  p95: number;
  erroPct: number;
  cpu: number;
  memoria: number;
  detalhe: string;
  serie: number[];
}

export interface Incidente {
  id: string;
  titulo: string;
  severidade: "SEV1" | "SEV2" | "SEV3";
  status: "aberto" | "mitigado" | "resolvido";
  abertoEm: string;
  duracaoMin: number;
  servico: string;
  tenantsAfetados: number;
  responsavel: string;
  resumo: string;
  timeline: { quando: string; texto: string }[];
}

export interface LogEntry {
  id: string;
  quando: string;
  nivel: "info" | "warn" | "error";
  origem: string;
  tenant: string;
  mensagem: string;
  latenciaMs: number;
  ator: string;
}

export interface FeatureFlag {
  id: string;
  chave: string;
  descricao: string;
  estado: "on" | "off" | "parcial";
  rollout: number;
  tenants: string[];
  atualizadoEm: string;
}

const MESES = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];

/** Ruído determinístico a partir de uma semente textual. */
function seed(txt: string, i: number) {
  let h = 0;
  for (let k = 0; k < txt.length; k++) h = (h * 31 + txt.charCodeAt(k)) % 9973;
  return ((h + i * 137) % 100) / 100;
}

function serie(nome: string, mrr: number, emissoes: number) {
  return MESES.map((mes, i) => {
    const f = 0.72 + i * 0.05 + seed(nome, i) * 0.08;
    return {
      mes,
      mrr: Math.round(mrr * f),
      emissoes: Math.round(emissoes * f),
      ia: Math.round(mrr * 0.06 * f),
    };
  });
}

function faturas(nome: string, valor: number, inadimplente: boolean) {
  const comps = ["Jun/26", "Jul/26", "Ago/26", "Set/26"];
  return comps.map((competencia, i) => ({
    id: `${nome.slice(0, 3).toLowerCase()}-f${i}`,
    competencia,
    valor: Math.round(valor * (0.9 + seed(nome, i) * 0.2)),
    status: (i === comps.length - 1
      ? inadimplente
        ? "vencida"
        : "aberta"
      : "paga") as "paga" | "aberta" | "vencida",
    vencimento: `0${(i % 9) + 1}/${i + 6}/2026`,
  }));
}

interface TenantSeed {
  nome: string;
  slug: string;
  cnpj: string;
  responsavel: string;
  email: string;
  cidade: string;
  status: StatusTenant;
  plano: PlanoId;
  regiao: Regiao;
  usuarios: number;
  emissoes: number;
  mrr: number;
  inadimplente: boolean;
  saude: number;
  nps: number;
}

const SEEDS: TenantSeed[] = [
  { nome: "Certus AC Matriz", slug: "certus", cnpj: "12.845.220/0001-08", responsavel: "Marina Duarte", email: "marina@certus.com.br", cidade: "São Paulo", status: "ativo", plano: "enterprise", regiao: "br-sp", usuarios: 42, emissoes: 3180, mrr: 18900, inadimplente: false, saude: 94, nps: 72 },
  { nome: "Válida Digital", slug: "valida", cnpj: "08.229.771/0001-42", responsavel: "Renato Prado", email: "renato@valida.com.br", cidade: "Campinas", status: "ativo", plano: "scale", regiao: "br-sp", usuarios: 24, emissoes: 1420, mrr: 8400, inadimplente: false, saude: 88, nps: 61 },
  { nome: "SafeSign Certificadora", slug: "safesign", cnpj: "31.554.902/0001-17", responsavel: "Cláudia Reis", email: "claudia@safesign.com.br", cidade: "Rio de Janeiro", status: "ativo", plano: "pro", regiao: "br-rj", usuarios: 15, emissoes: 760, mrr: 4200, inadimplente: true, saude: 61, nps: 34 },
  { nome: "NordesteCert", slug: "nordestecert", cnpj: "22.114.630/0001-73", responsavel: "Ivan Barros", email: "ivan@nordestecert.com.br", cidade: "Recife", status: "ativo", plano: "pro", regiao: "br-ne", usuarios: 12, emissoes: 640, mrr: 3900, inadimplente: false, saude: 82, nps: 55 },
  { nome: "AC Horizonte", slug: "horizonte", cnpj: "44.902.118/0001-55", responsavel: "Paula Menezes", email: "paula@achorizonte.com.br", cidade: "Belo Horizonte", status: "trial", plano: "starter", regiao: "br-sp", usuarios: 5, emissoes: 90, mrr: 0, inadimplente: false, saude: 70, nps: 40 },
  { nome: "Sigma Certificados", slug: "sigma", cnpj: "19.338.472/0001-90", responsavel: "Douglas Lemos", email: "douglas@sigmacert.com.br", cidade: "Curitiba", status: "ativo", plano: "scale", regiao: "br-sp", usuarios: 19, emissoes: 1180, mrr: 7600, inadimplente: false, saude: 90, nps: 66 },
  { nome: "Atlas Registro", slug: "atlas", cnpj: "27.610.884/0001-31", responsavel: "Beatriz Lima", email: "bia@atlasregistro.com.br", cidade: "Salvador", status: "onboarding", plano: "pro", regiao: "br-ne", usuarios: 7, emissoes: 40, mrr: 3900, inadimplente: false, saude: 74, nps: 0 },
  { nome: "CertBrasil Sul", slug: "certbrasil", cnpj: "35.771.208/0001-64", responsavel: "Otávio Ramos", email: "otavio@certbrasilsul.com.br", cidade: "Porto Alegre", status: "suspenso", plano: "pro", regiao: "br-sp", usuarios: 9, emissoes: 210, mrr: 3900, inadimplente: true, saude: 38, nps: 12 },
  { nome: "Prisma AR", slug: "prisma", cnpj: "40.228.913/0001-05", responsavel: "Helena Costa", email: "helena@prismaar.com.br", cidade: "Goiânia", status: "ativo", plano: "starter", regiao: "br-sp", usuarios: 4, emissoes: 180, mrr: 1490, inadimplente: false, saude: 79, nps: 48 },
  { nome: "Vetor Certificação", slug: "vetor", cnpj: "16.905.337/0001-28", responsavel: "Marcos Tavares", email: "marcos@vetorcert.com.br", cidade: "Fortaleza", status: "ativo", plano: "pro", regiao: "br-ne", usuarios: 11, emissoes: 520, mrr: 3900, inadimplente: false, saude: 85, nps: 58 },
  { nome: "Âncora Digital", slug: "ancora", cnpj: "51.884.026/0001-11", responsavel: "Sueli Andrade", email: "sueli@ancoradigital.com.br", cidade: "Santos", status: "trial", plano: "starter", regiao: "br-sp", usuarios: 3, emissoes: 32, mrr: 0, inadimplente: false, saude: 65, nps: 0 },
  { nome: "Órion Certificadora", slug: "orion", cnpj: "63.117.550/0001-49", responsavel: "Fábio Souto", email: "fabio@orioncert.com.br", cidade: "Niterói", status: "cancelado", plano: "starter", regiao: "br-rj", usuarios: 0, emissoes: 0, mrr: 0, inadimplente: false, saude: 20, nps: 8 },
];

const LIMITES: Record<PlanoId, { usuarios: number; emissoes: number; storage: number }> = {
  starter: { usuarios: 5, emissoes: 250, storage: 20 },
  pro: { usuarios: 15, emissoes: 800, storage: 80 },
  scale: { usuarios: 30, emissoes: 2000, storage: 250 },
  enterprise: { usuarios: 100, emissoes: 6000, storage: 1000 },
};

export const tenants: Tenant[] = SEEDS.map((s, i) => {
  const lim = LIMITES[s.plano];
  return {
    id: `t${i + 1}`,
    nome: s.nome,
    slug: s.slug,
    cnpj: s.cnpj,
    responsavel: s.responsavel,
    email: s.email,
    telefone: `(${11 + (i % 8)}) 9${8000 + i * 111}-${1000 + i * 37}`,
    status: s.status,
    plano: s.plano,
    regiao: s.regiao,
    desde: `${(i % 12) + 1}/2024`,
    renovaEm: `${(i % 28) + 1}/10/2026`,
    usuarios: s.usuarios,
    usuariosLimite: lim.usuarios,
    emissoesMes: s.emissoes,
    emissoesLimite: lim.emissoes,
    mrr: s.mrr,
    consumoIa: Math.round(s.mrr * 0.07 + s.emissoes * 0.4),
    mensagensWhats: Math.round(s.emissoes * 4.2 + 120),
    emailsEnviados: Math.round(s.emissoes * 6.1 + 300),
    storageGb: Math.round(lim.storage * (0.25 + seed(s.slug, 3) * 0.6)),
    inadimplente: s.inadimplente,
    saudeScore: s.saude,
    nps: s.nps,
    ultimoAcesso: `há ${1 + (i % 9)}h`,
    dominio: `${s.slug}.certus.app`,
    serie: serie(s.slug, s.mrr || 1200, s.emissoes || 60),
    faturas: faturas(s.slug, s.mrr || 1490, s.inadimplente),
  };
});

export const planosSaas: PlanoSaas[] = [
  {
    id: "starter", nome: "Starter", preco: 1490, precoAnual: 14900, usuarios: 5, emissoes: 250,
    excedenteEmissao: 7.9, storageGb: 20, suporte: "E-mail (24h)", destaque: false, ativo: true,
    recursos: ["Operação Kanban", "Chamados", "Agenda", "Portal público"],
  },
  {
    id: "pro", nome: "Pro", preco: 3900, precoAnual: 39000, usuarios: 15, emissoes: 800,
    excedenteEmissao: 6.5, storageGb: 80, suporte: "Chat + e-mail (8h)", destaque: true, ativo: true,
    recursos: ["Tudo do Starter", "Chat com IA", "Financeiro completo", "Portal do contador", "Relatórios XLSX"],
  },
  {
    id: "scale", nome: "Scale", preco: 8400, precoAnual: 84000, usuarios: 30, emissoes: 2000,
    excedenteEmissao: 5.2, storageGb: 250, suporte: "Prioritário (4h)", destaque: false, ativo: true,
    recursos: ["Tudo do Pro", "Fluxos personalizados", "SSO/SAML", "API pública", "Apps mobile"],
  },
  {
    id: "enterprise", nome: "Enterprise", preco: 18900, precoAnual: 189000, usuarios: 100, emissoes: 6000,
    excedenteEmissao: 3.9, storageGb: 1000, suporte: "CSM dedicado (1h)", destaque: false, ativo: true,
    recursos: ["Tudo do Scale", "Ambiente dedicado", "Contrato SLA 99,95%", "Auditoria ICP", "Onboarding assistido"],
  },
];

export const integracoes: Integracao[] = [
  { id: "i1", nome: "Evolution API", categoria: "Mensageria", provedor: "Evolution", status: "conectado", chaveMascarada: "evo_live_••••••4b21", endpoint: "https://evo.certus.app/v1", escopo: "por tenant", ultimoTeste: "há 6 min", latenciaMs: 218, sucesso30d: 99.2, chamadas30d: 184320, custoMes: 1290, notas: "Instâncias WhatsApp por tenant, QR e webhook de status." },
  { id: "i2", nome: "WhatsApp Cloud API", categoria: "Mensageria", provedor: "Meta", status: "degradado", chaveMascarada: "EAAG••••••9f0c", endpoint: "https://graph.facebook.com/v20.0", escopo: "global", ultimoTeste: "há 12 min", latenciaMs: 640, sucesso30d: 97.4, chamadas30d: 96210, custoMes: 3180, notas: "Templates HSM aguardando aprovação em 2 categorias." },
  { id: "i3", nome: "Resend", categoria: "E-mail", provedor: "Resend", status: "conectado", chaveMascarada: "re_••••••7ad9", endpoint: "https://api.resend.com", escopo: "global", ultimoTeste: "há 3 min", latenciaMs: 128, sucesso30d: 99.8, chamadas30d: 241880, custoMes: 890, notas: "Domínio verificado, DKIM e SPF ativos." },
  { id: "i4", nome: "OpenAI", categoria: "IA", provedor: "OpenAI", status: "conectado", chaveMascarada: "sk-proj-••••••1cf7", endpoint: "https://api.openai.com/v1", escopo: "global", ultimoTeste: "há 1 min", latenciaMs: 940, sucesso30d: 99.5, chamadas30d: 58210, custoMes: 6420, notas: "Resumo de conversas, intenção e sugestões do copiloto." },
  { id: "i5", nome: "Stripe", categoria: "Pagamentos", provedor: "Stripe", status: "conectado", chaveMascarada: "sk_live_••••••32aa", endpoint: "https://api.stripe.com/v1", escopo: "global", ultimoTeste: "há 22 min", latenciaMs: 310, sucesso30d: 99.9, chamadas30d: 12040, custoMes: 0, notas: "Cobrança recorrente dos tenants e faturas por excedente." },
  { id: "i6", nome: "Object Storage", categoria: "Infra", provedor: "Cloudflare R2", status: "conectado", chaveMascarada: "r2_••••••88de", endpoint: "https://r2.certus.app", escopo: "global", ultimoTeste: "há 9 min", latenciaMs: 84, sucesso30d: 99.99, chamadas30d: 512300, custoMes: 640, notas: "Documentos e evidências de validação." },
];

export const servicos: Servico[] = [
  { id: "s1", nome: "API pública", tipo: "API", status: "operacional", uptime30d: 99.98, p95: 212, erroPct: 0.12, cpu: 38, memoria: 54, detalhe: "12 réplicas · autoscaling", serie: [180, 195, 210, 205, 240, 212, 198, 220, 212] },
  { id: "s2", nome: "App backend (SSR)", tipo: "Edge", status: "operacional", uptime30d: 99.96, p95: 148, erroPct: 0.08, cpu: 42, memoria: 47, detalhe: "Workers em 3 regiões", serie: [130, 142, 150, 138, 160, 149, 145, 151, 148] },
  { id: "s3", nome: "PostgreSQL primário", tipo: "Banco", status: "degradado", uptime30d: 99.91, p95: 88, erroPct: 0.31, cpu: 76, memoria: 81, detalhe: "Conexões 412/500 · replicação 1.2s", serie: [52, 61, 70, 74, 88, 92, 84, 90, 88] },
  { id: "s4", nome: "Redis (cache/sessão)", tipo: "Cache", status: "operacional", uptime30d: 99.99, p95: 4, erroPct: 0.01, cpu: 22, memoria: 63, detalhe: "Hit ratio 96,4% · 2,1 GB", serie: [3, 4, 4, 5, 4, 4, 3, 4, 4] },
  { id: "s5", nome: "Fila de emissão", tipo: "Fila", status: "operacional", uptime30d: 99.94, p95: 1200, erroPct: 0.42, cpu: 31, memoria: 40, detalhe: "184 mensagens · 0 DLQ", serie: [900, 1100, 1180, 1010, 1400, 1250, 1190, 1220, 1200] },
  { id: "s6", nome: "Worker de notificações", tipo: "Worker", status: "operacional", uptime30d: 99.9, p95: 340, erroPct: 0.55, cpu: 27, memoria: 35, detalhe: "WhatsApp, e-mail e push", serie: [300, 320, 360, 330, 410, 355, 340, 350, 340] },
  { id: "s7", nome: "Gateway de IA", tipo: "API", status: "operacional", uptime30d: 99.87, p95: 960, erroPct: 0.9, cpu: 44, memoria: 52, detalhe: "Roteando OpenAI · fallback ativo", serie: [820, 900, 1010, 940, 1180, 990, 950, 970, 960] },
  { id: "s8", nome: "Backups & PITR", tipo: "Banco", status: "operacional", uptime30d: 100, p95: 0, erroPct: 0, cpu: 8, memoria: 12, detalhe: "Último backup há 42 min · retenção 30d", serie: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

export const incidentes: Incidente[] = [
  {
    id: "inc-104", titulo: "Latência elevada no PostgreSQL primário", severidade: "SEV2", status: "mitigado",
    abertoEm: "01/09/2026 18:12", duracaoMin: 74, servico: "PostgreSQL primário", tenantsAfetados: 7,
    responsavel: "Plantão SRE", resumo: "Consulta sem índice no relatório financeiro elevou o p95 e o uso de CPU acima de 75%.",
    timeline: [
      { quando: "18:12", texto: "Alerta de CPU > 75% por 5 min." },
      { quando: "18:20", texto: "Identificada query de agregação do DRE sem índice." },
      { quando: "18:44", texto: "Índice criado em produção; CPU cai para 58%." },
      { quando: "19:26", texto: "Serviço mitigado; monitorando por 24h." },
    ],
  },
  {
    id: "inc-103", titulo: "Falha parcial de entrega no WhatsApp Cloud", severidade: "SEV2", status: "aberto",
    abertoEm: "01/09/2026 21:05", duracaoMin: 155, servico: "WhatsApp Cloud API", tenantsAfetados: 4,
    responsavel: "Squad Mensageria", resumo: "Provedor retornando 500 intermitente em templates de notificação.",
    timeline: [
      { quando: "21:05", texto: "Taxa de erro sobe para 3,1%." },
      { quando: "21:18", texto: "Fallback para Evolution API habilitado nos tenants Pro." },
      { quando: "22:40", texto: "Status page do provedor confirma incidente." },
    ],
  },
  {
    id: "inc-102", titulo: "Timeout no gateway de IA", severidade: "SEV3", status: "resolvido",
    abertoEm: "28/08/2026 09:40", duracaoMin: 38, servico: "Gateway de IA", tenantsAfetados: 11,
    responsavel: "Squad IA", resumo: "Pico de requisições de resumo automático estourou o limite de concorrência.",
    timeline: [
      { quando: "09:40", texto: "Erros 504 em 6% das chamadas." },
      { quando: "09:52", texto: "Limite de concorrência ampliado de 40 para 120." },
      { quando: "10:18", texto: "Incidente resolvido." },
    ],
  },
  {
    id: "inc-101", titulo: "Indisponibilidade do portal público", severidade: "SEV1", status: "resolvido",
    abertoEm: "14/08/2026 07:02", duracaoMin: 21, servico: "App backend (SSR)", tenantsAfetados: 12,
    responsavel: "Plantão SRE", resumo: "Deploy com variável de ambiente ausente derrubou o SSR do portal.",
    timeline: [
      { quando: "07:02", texto: "Health check falha em 3 regiões." },
      { quando: "07:09", texto: "Rollback iniciado." },
      { quando: "07:23", texto: "Serviço restabelecido." },
    ],
  },
];

const NIVEIS: LogEntry["nivel"][] = ["info", "info", "info", "warn", "info", "error", "info", "warn"];
const ORIGENS = ["api.emissao", "auth.sessao", "webhook.evolution", "billing.stripe", "ia.resumo", "mail.resend", "job.renovacao", "admin.tenant"];
const MENSAGENS = [
  "Solicitação avançada para etapa de validação",
  "Login com MFA aprovado",
  "Webhook recebido e processado",
  "Fatura emitida para o tenant",
  "Resumo de conversa gerado pela IA",
  "E-mail transacional entregue",
  "Lote de renovações agendado",
  "Configuração de integração atualizada",
];

export const logs: LogEntry[] = Array.from({ length: 120 }, (_, i) => {
  const t = tenants[i % tenants.length]!;
  const min = String(59 - (i % 60)).padStart(2, "0");
  const hora = String(23 - Math.floor(i / 12) % 24).padStart(2, "0");
  return {
    id: `log-${1000 + i}`,
    quando: `01/09/2026 ${hora}:${min}`,
    nivel: NIVEIS[i % NIVEIS.length]!,
    origem: ORIGENS[i % ORIGENS.length]!,
    tenant: t.nome,
    mensagem: MENSAGENS[i % MENSAGENS.length]!,
    latenciaMs: 40 + Math.round(seed(t.slug, i) * 900),
    ator: i % 3 === 0 ? "sistema" : t.responsavel,
  };
});

export const flags: FeatureFlag[] = [
  { id: "f1", chave: "chat.copiloto_ia", descricao: "Copiloto de IA no chat de atendimento", estado: "parcial", rollout: 60, tenants: ["Certus AC Matriz", "Válida Digital", "Sigma Certificados"], atualizadoEm: "29/08/2026", },
  { id: "f2", chave: "financeiro.conciliacao_auto", descricao: "Conciliação bancária automática (OFX)", estado: "on", rollout: 100, tenants: [], atualizadoEm: "22/08/2026" },
  { id: "f3", chave: "portal.autoagendamento", descricao: "Autoagendamento público de validação", estado: "on", rollout: 100, tenants: [], atualizadoEm: "18/08/2026" },
  { id: "f4", chave: "mobile.push_executivo", descricao: "Push no app executivo", estado: "parcial", rollout: 35, tenants: ["Certus AC Matriz"], atualizadoEm: "31/08/2026" },
  { id: "f5", chave: "billing.cobranca_excedente", descricao: "Cobrança automática de excedente de emissão", estado: "off", rollout: 0, tenants: [], atualizadoEm: "12/08/2026" },
  { id: "f6", chave: "sso.saml", descricao: "Login SSO/SAML para planos Scale+", estado: "parcial", rollout: 20, tenants: ["Certus AC Matriz"], atualizadoEm: "05/08/2026" },
];

export const rotuloPlano: Record<PlanoId, string> = {
  starter: "Starter", pro: "Pro", scale: "Scale", enterprise: "Enterprise",
};

export const rotuloRegiao: Record<Regiao, string> = {
  "br-sp": "BR São Paulo", "br-rj": "BR Rio de Janeiro", "br-ne": "BR Nordeste",
};

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const numero = (v: number) => v.toLocaleString("pt-BR");
