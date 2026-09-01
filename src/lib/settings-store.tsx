// Configurações da aplicação — cada AC opera com uma esteira própria, então
// etapas, checklists, requisitos de avanço, SLA, catálogo, segurança e
// integrações são parametrizáveis. Persistido em localStorage.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { stages, type StageId } from "@/lib/mock-data";

const STORAGE_KEY = "certus-ac-config-v1";

export interface ChecklistRule {
  id: string;
  label: string;
  obrigatorio: boolean;
  evidencia: "nenhuma" | "arquivo" | "assinatura" | "foto";
}

export interface StageGates {
  checklistObrigatorio: boolean;
  documentosAprovados: boolean;
  pagamentoConfirmado: boolean;
  duplaConferencia: boolean;
  biometriaValidada: boolean;
  gravacaoArquivada: boolean;
}

export interface StageRule {
  id: StageId;
  nome: string;
  descricao: string;
  ativo: boolean;
  slaHoras: number;
  papelResponsavel: string;
  checklist: ChecklistRule[];
  documentos: string[];
  gates: StageGates;
  automacoes: {
    notificarCliente: boolean;
    atribuirAutomatico: boolean;
    escalarSlaEstourado: boolean;
  };
}

export interface ProdutoRule {
  id: string;
  nome: string;
  validadeMeses: number;
  preco: number;
  exigeVideoconferencia: boolean;
  ativo: boolean;
}

export interface PapelRule {
  id: string;
  nome: string;
  descricao: string;
  permissoes: string[];
  usuarios: number;
}

export type StatusUsuario = "ativo" | "convidado" | "suspenso";

export interface UsuarioRule {
  id: string;
  nome: string;
  email: string;
  iniciais: string;
  papelId: string;
  unidade: string;
  telefone: string;
  status: StatusUsuario;
  mfa: boolean;
  limiteWip: number;
  criadoEm: string;
  ultimoAcesso: string;
  observacao: string;
}


export interface SessaoAtiva {
  id: string;
  dispositivo: string;
  navegador: string;
  local: string;
  ip: string;
  quando: string;
  atual: boolean;
}

export interface AcessoLog {
  id: string;
  usuario: string;
  quando: string;
  local: string;
  ip: string;
  metodo: string;
  resultado: "sucesso" | "falha" | "bloqueado";
}

export interface ChaveApi {
  id: string;
  nome: string;
  prefixo: string;
  escopo: string;
  criadaEm: string;
  ultimoUso: string;
  ativa: boolean;
}

export interface Webhook {
  id: string;
  evento: string;
  url: string;
  ativo: boolean;
  ultimaEntrega: string;
  status: "ok" | "falha";
}

export type NotifEvento = {
  id: string;
  label: string;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
};

export interface Settings {
  org: {
    nome: string;
    razaoSocial: string;
    cnpj: string;
    acRaiz: string;
    email: string;
    telefone: string;
    site: string;
    endereco: string;
    fuso: string;
    moeda: string;
    idioma: string;
    expedienteInicio: string;
    expedienteFim: string;
    diasUteis: string[];
    contaSlaEmDiasUteis: boolean;
  };
  fluxo: {
    etapas: StageRule[];
    permitirPularEtapa: boolean;
    exigirJustificativaRetorno: boolean;
    bloquearAposSlaEstourado: boolean;
    reatribuirAutomatico: boolean;
    limiteWipPorAgente: number;
  };
  produtos: ProdutoRule[];
  sla: {
    porPrioridade: { prioridade: string; primeiraRespostaH: number; resolucaoH: number; alertaEmPercent: number }[];
    horarioComercialApenas: boolean;
    pausarAguardandoCliente: boolean;
  };
  papeis: PapelRule[];
  usuarios: UsuarioRule[];

  seguranca: {
    mfaObrigatorio: boolean;
    metodosMfa: string[];
    mfaParaAcoesCriticas: boolean;
    senhaMinima: number;
    senhaExpiraDias: number;
    exigirSimbolos: boolean;
    bloquearAposTentativas: number;
    sessaoExpiraMin: number;
    sessaoUnica: boolean;
    ipAllowlist: string[];
    exigirVpn: boolean;
    alertarLoginNovoDispositivo: boolean;
    trilhaImutavel: boolean;
    retencaoLogsMeses: number;
    sessoes: SessaoAtiva[];
    acessos: AcessoLog[];
  };
  notificacoes: {
    eventos: NotifEvento[];
    remetente: string;
    assinatura: string;
    silencioInicio: string;
    silencioFim: string;
    resumoDiario: boolean;
  };
  integracoes: {
    chaves: ChaveApi[];
    webhooks: Webhook[];
    conectores: { id: string; nome: string; descricao: string; conectado: boolean }[];
  };
  financeiro: {
    diasVencimentoPadrao: number;
    jurosMesPercent: number;
    multaPercent: number;
    comissaoPadraoPercent: number;
    fechamentoComissaoDia: number;
    emitirNfeAutomatico: boolean;
    impostoPercent: number;
    metodosPagamento: string[];
  };
  aparencia: {
    densidade: "confortavel" | "compacta";
    corPrimaria: string;
    exibirLogoPortal: boolean;
    mensagemPortal: string;
    formatoData: string;
  };
  dados: {
    retencaoDocumentosMeses: number;
    anonimizarAposEncerrar: boolean;
    consentimentoLgpd: boolean;
    backupDiario: boolean;
    encarregadoLgpd: string;
  };
}

const checklistBase: Record<StageId, string[]> = {
  novo: ["Confirmar dados do titular", "Validar forma de pagamento"],
  documentacao: ["Documento de identidade", "Comprovante de endereço", "Contrato social / procuração"],
  validacao: ["Conferência biométrica", "Checagem em bases públicas", "Parecer do agente de registro"],
  agendamento: ["Enviar convite de videoconferência", "Confirmar disponibilidade do titular"],
  videoconferencia: ["Gravação arquivada", "Termo de titularidade assinado"],
  emissao: ["Gerar par de chaves", "Entregar mídia ao titular"],
  concluido: ["Pesquisa de satisfação enviada"],
  bloqueado: ["Registrar impedimento"],
};

const slaBase: Record<StageId, number> = {
  novo: 4,
  documentacao: 24,
  validacao: 12,
  agendamento: 8,
  videoconferencia: 6,
  emissao: 4,
  concluido: 24,
  bloqueado: 48,
};

const papelBase: Record<StageId, string> = {
  novo: "Atendimento",
  documentacao: "Validação Documental",
  validacao: "Agente de Registro",
  agendamento: "Atendimento",
  videoconferencia: "Agente de Registro",
  emissao: "Agente de Registro",
  concluido: "Atendimento",
  bloqueado: "Compliance",
};

function id(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

function seedEtapas(): StageRule[] {
  return stages.map((s) => ({
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    ativo: true,
    slaHoras: slaBase[s.id],
    papelResponsavel: papelBase[s.id],
    checklist: (checklistBase[s.id] ?? []).map((label, i) => ({
      id: id("ck"),
      label,
      obrigatorio: i === 0,
      evidencia: s.id === "documentacao" ? "arquivo" : "nenhuma",
    })),
    documentos:
      s.id === "documentacao" ? ["RG ou CNH", "Comprovante de endereço", "Contrato social"] : [],
    gates: {
      checklistObrigatorio: true,
      documentosAprovados: s.id === "documentacao" || s.id === "validacao",
      pagamentoConfirmado: s.id === "emissao",
      duplaConferencia: s.id === "validacao",
      biometriaValidada: s.id === "videoconferencia",
      gravacaoArquivada: s.id === "videoconferencia",
    },
    automacoes: {
      notificarCliente: s.id !== "bloqueado",
      atribuirAutomatico: true,
      escalarSlaEstourado: true,
    },
  }));
}

export function seedSettings(): Settings {
  return {
    org: {
      nome: "Certus AC",
      razaoSocial: "Certus Certificação Digital Ltda.",
      cnpj: "18.442.907/0001-33",
      acRaiz: "ICP-Brasil · AC Raiz v10",
      email: "operacao@certus.com.br",
      telefone: "(11) 4002-8922",
      site: "https://certus.com.br",
      endereco: "Av. Paulista, 1000 — São Paulo/SP",
      fuso: "America/Sao_Paulo",
      moeda: "BRL",
      idioma: "pt-BR",
      expedienteInicio: "08:00",
      expedienteFim: "18:00",
      diasUteis: ["seg", "ter", "qua", "qui", "sex"],
      contaSlaEmDiasUteis: true,
    },
    fluxo: {
      etapas: seedEtapas(),
      permitirPularEtapa: false,
      exigirJustificativaRetorno: true,
      bloquearAposSlaEstourado: false,
      reatribuirAutomatico: true,
      limiteWipPorAgente: 12,
    },
    produtos: [
      { id: "p1", nome: "e-CPF A1", validadeMeses: 12, preco: 189, exigeVideoconferencia: true, ativo: true },
      { id: "p2", nome: "e-CPF A3", validadeMeses: 36, preco: 289, exigeVideoconferencia: true, ativo: true },
      { id: "p3", nome: "e-CNPJ A1", validadeMeses: 12, preco: 249, exigeVideoconferencia: true, ativo: true },
      { id: "p4", nome: "e-CNPJ A3", validadeMeses: 36, preco: 389, exigeVideoconferencia: true, ativo: true },
      { id: "p5", nome: "Nuvem PJ", validadeMeses: 12, preco: 329, exigeVideoconferencia: false, ativo: true },
    ],
    sla: {
      porPrioridade: [
        { prioridade: "critica", primeiraRespostaH: 1, resolucaoH: 4, alertaEmPercent: 60 },
        { prioridade: "alta", primeiraRespostaH: 2, resolucaoH: 8, alertaEmPercent: 70 },
        { prioridade: "normal", primeiraRespostaH: 4, resolucaoH: 24, alertaEmPercent: 80 },
        { prioridade: "baixa", primeiraRespostaH: 8, resolucaoH: 48, alertaEmPercent: 85 },
      ],
      horarioComercialApenas: true,
      pausarAguardandoCliente: true,
    },
    papeis: [
      {
        id: "r1",
        nome: "Administrador",
        descricao: "Acesso total, inclusive configurações e financeiro.",
        permissoes: ["config", "financeiro", "emitir", "revogar", "clientes", "relatorios", "parceiros"],
        usuarios: 2,
      },
      {
        id: "r2",
        nome: "Agente de Registro",
        descricao: "Conduz validação, videoconferência e emissão.",
        permissoes: ["emitir", "clientes", "relatorios"],
        usuarios: 6,
      },
      {
        id: "r3",
        nome: "Atendimento",
        descricao: "Chamados, chat e agendamentos.",
        permissoes: ["clientes"],
        usuarios: 5,
      },
      {
        id: "r4",
        nome: "Compliance",
        descricao: "Auditoria, revogações e conformidade.",
        permissoes: ["revogar", "relatorios", "config"],
        usuarios: 2,
      },
      {
        id: "r5",
        nome: "Parceiro contábil",
        descricao: "Portal externo: pedidos, clientes e comissões.",
        permissoes: ["clientes"],
        usuarios: 38,
      },
    ],
    seguranca: {
      mfaObrigatorio: true,
      metodosMfa: ["app", "sms"],
      mfaParaAcoesCriticas: true,
      senhaMinima: 12,
      senhaExpiraDias: 90,
      exigirSimbolos: true,
      bloquearAposTentativas: 5,
      sessaoExpiraMin: 60,
      sessaoUnica: false,
      ipAllowlist: ["200.155.30.0/24", "189.4.77.12"],
      exigirVpn: false,
      alertarLoginNovoDispositivo: true,
      trilhaImutavel: true,
      retencaoLogsMeses: 60,
      sessoes: [
        {
          id: "s1",
          dispositivo: "MacBook Pro",
          navegador: "Chrome 128",
          local: "São Paulo/SP",
          ip: "200.155.30.14",
          quando: "agora",
          atual: true,
        },
        {
          id: "s2",
          dispositivo: "iPhone 14",
          navegador: "App Certus",
          local: "São Paulo/SP",
          ip: "179.108.22.90",
          quando: "há 3 h",
          atual: false,
        },
        {
          id: "s3",
          dispositivo: "Windows 11",
          navegador: "Edge 127",
          local: "Campinas/SP",
          ip: "189.4.77.12",
          quando: "ontem, 18:42",
          atual: false,
        },
      ],
      acessos: [
        { id: "l1", usuario: "Marina Duarte", quando: "hoje, 08:12", local: "São Paulo/SP", ip: "200.155.30.14", metodo: "Senha + app", resultado: "sucesso" },
        { id: "l2", usuario: "Rafael Bastos", quando: "hoje, 07:58", local: "São Paulo/SP", ip: "200.155.30.22", metodo: "SSO Google", resultado: "sucesso" },
        { id: "l3", usuario: "Desconhecido", quando: "ontem, 23:41", local: "Hanói, VN", ip: "45.62.11.7", metodo: "Senha", resultado: "bloqueado" },
        { id: "l4", usuario: "Carolina Ito", quando: "ontem, 19:03", local: "Campinas/SP", ip: "189.4.77.12", metodo: "Senha + SMS", resultado: "sucesso" },
        { id: "l5", usuario: "Diego Nunes", quando: "ontem, 18:20", local: "Recife/PE", ip: "177.92.3.44", metodo: "Senha", resultado: "falha" },
      ],
    },
    notificacoes: {
      eventos: [
        { id: "n1", label: "Solicitação criada", email: true, whatsapp: true, sms: false, push: true },
        { id: "n2", label: "Documento reprovado", email: true, whatsapp: true, sms: true, push: true },
        { id: "n3", label: "Videoconferência agendada", email: true, whatsapp: true, sms: true, push: false },
        { id: "n4", label: "Certificado emitido", email: true, whatsapp: true, sms: false, push: true },
        { id: "n5", label: "SLA em risco", email: false, whatsapp: false, sms: false, push: true },
        { id: "n6", label: "Renovação em 30 dias", email: true, whatsapp: true, sms: false, push: false },
        { id: "n7", label: "Fatura vencida", email: true, whatsapp: false, sms: false, push: false },
        { id: "n8", label: "Novo chamado no portal", email: true, whatsapp: false, sms: false, push: true },
      ],
      remetente: "operacao@certus.com.br",
      assinatura: "Equipe Certus AC · suporte 24/7",
      silencioInicio: "21:00",
      silencioFim: "07:00",
      resumoDiario: true,
    },
    integracoes: {
      chaves: [
        { id: "k1", nome: "Portal do parceiro", prefixo: "cts_live_9f2a", escopo: "pedidos:rw", criadaEm: "2026-02-10", ultimoUso: "hoje, 09:12", ativa: true },
        { id: "k2", nome: "ERP financeiro", prefixo: "cts_live_41bd", escopo: "financeiro:ro", criadaEm: "2025-11-02", ultimoUso: "hoje, 06:00", ativa: true },
        { id: "k3", nome: "Integração legada", prefixo: "cts_test_77c0", escopo: "clientes:ro", criadaEm: "2025-04-18", ultimoUso: "há 4 meses", ativa: false },
      ],
      webhooks: [
        { id: "w1", evento: "certificado.emitido", url: "https://erp.certus.com.br/hooks/emissao", ativo: true, ultimaEntrega: "hoje, 09:40", status: "ok" },
        { id: "w2", evento: "chamado.criado", url: "https://crm.certus.com.br/hooks/ticket", ativo: true, ultimaEntrega: "hoje, 08:55", status: "ok" },
        { id: "w3", evento: "fatura.vencida", url: "https://erp.certus.com.br/hooks/cobranca", ativo: false, ultimaEntrega: "há 2 dias", status: "falha" },
      ],
      conectores: [
        { id: "c1", nome: "WhatsApp Business", descricao: "Atendimento e notificações no chat.", conectado: true },
        { id: "c2", nome: "Gateway de pagamento", descricao: "Pix, boleto e cartão nas cobranças.", conectado: true },
        { id: "c3", nome: "Assinador ICP-Brasil", descricao: "Emissão e revogação de certificados.", conectado: true },
        { id: "c4", nome: "Receita Federal / Serpro", descricao: "Consulta de CPF, CNPJ e situação cadastral.", conectado: true },
        { id: "c5", nome: "Biometria facial", descricao: "Prova de vida na videoconferência.", conectado: false },
        { id: "c6", nome: "Google Agenda", descricao: "Sincronização dos atendimentos.", conectado: false },
      ],
    },
    financeiro: {
      diasVencimentoPadrao: 15,
      jurosMesPercent: 1,
      multaPercent: 2,
      comissaoPadraoPercent: 15,
      fechamentoComissaoDia: 5,
      emitirNfeAutomatico: true,
      impostoPercent: 8.65,
      metodosPagamento: ["Pix", "Boleto", "Cartão"],
    },
    aparencia: {
      densidade: "confortavel",
      corPrimaria: "#1d4ed8",
      exibirLogoPortal: true,
      mensagemPortal: "Precisa de ajuda com seu certificado? Abra um chamado — respondemos em até 4 horas úteis.",
      formatoData: "dd/MM/yyyy",
    },
    dados: {
      retencaoDocumentosMeses: 72,
      anonimizarAposEncerrar: false,
      consentimentoLgpd: true,
      backupDiario: true,
      encarregadoLgpd: "Helena Prado — dpo@certus.com.br",
    },
  };
}

type Patch<T> = (atual: T) => T;

interface SettingsCtx {
  settings: Settings;
  update: <K extends keyof Settings>(chave: K, patch: Partial<Settings[K]>) => void;
  replace: <K extends keyof Settings>(chave: K, valor: Settings[K]) => void;
  updateEtapa: (etapaId: StageId, patch: Partial<StageRule>) => void;
  patchEtapas: (fn: Patch<StageRule[]>) => void;
  resetSettings: () => void;
  dirty: boolean;
  marcarSalvo: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(seedSettings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...seedSettings(), ...(JSON.parse(raw) as Settings) });
    } catch {
      /* mantém seed */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* cota indisponível */
    }
  }, [settings]);

  const update = useCallback<SettingsCtx["update"]>((chave, patch) => {
    setSettings((s) => ({ ...s, [chave]: { ...s[chave], ...patch } }));
    setDirty(true);
  }, []);

  const replace = useCallback<SettingsCtx["replace"]>((chave, valor) => {
    setSettings((s) => ({ ...s, [chave]: valor }));
    setDirty(true);
  }, []);

  const patchEtapas = useCallback((fn: Patch<StageRule[]>) => {
    setSettings((s) => ({ ...s, fluxo: { ...s.fluxo, etapas: fn(s.fluxo.etapas) } }));
    setDirty(true);
  }, []);

  const updateEtapa = useCallback<SettingsCtx["updateEtapa"]>(
    (etapaId, patch) => {
      patchEtapas((etapas) => etapas.map((e) => (e.id === etapaId ? { ...e, ...patch } : e)));
    },
    [patchEtapas],
  );

  const resetSettings = useCallback(() => {
    setSettings(seedSettings());
    setDirty(false);
  }, []);

  const value = useMemo<SettingsCtx>(
    () => ({ settings, update, replace, updateEtapa, patchEtapas, resetSettings, dirty, marcarSalvo: () => setDirty(false) }),
    [settings, update, replace, updateEtapa, patchEtapas, resetSettings, dirty],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings precisa estar dentro de <SettingsProvider>");
  return ctx;
}

export function novoChecklistItem(label: string): ChecklistRule {
  return { id: id("ck"), label, obrigatorio: false, evidencia: "nenhuma" };
}

export const permissoesDisponiveis = [
  { id: "config", label: "Configurações" },
  { id: "financeiro", label: "Financeiro" },
  { id: "emitir", label: "Emitir certificado" },
  { id: "revogar", label: "Revogar certificado" },
  { id: "clientes", label: "Clientes e chamados" },
  { id: "relatorios", label: "Relatórios" },
  { id: "parceiros", label: "Parceiros" },
];
