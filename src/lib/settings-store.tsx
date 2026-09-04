// Configurações da aplicação — cada AC opera com uma esteira própria, então
// etapas, checklists, requisitos de avanço, SLA, catálogo, segurança e
// integrações são parametrizáveis. Persistido em localStorage.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { stages, type StageId } from "@/lib/mock-data";
import { PAPEIS_OPERACAO } from "@/lib/opconfig-model";

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

export type CanalNotificacao = "email" | "push" | "whatsapp";

export interface StageRule {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  removivel?: boolean;
  slaHoras: number;
  papelResponsavel: string;
  checklist: ChecklistRule[];
  documentos: string[];
  gates: StageGates;
  automacoes: {
    notificarCliente: boolean;
    atribuirAutomatico: boolean;
    escalarSlaEstourado: boolean;
    /** Notifica as pessoas do papel responsável quando a solicitação entra nesta etapa. */
    notificarPapelResponsavel: boolean;
  };
  /** Papéis adicionais avisados na chegada da solicitação (ids de PapelRule). */
  papeisNotificados: string[];
  canaisNotificacao: CanalNotificacao[];
}

export interface ProdutoRule {
  id: string;
  nome: string;
  validadeMeses: number;
  preco: number;
  exigeVideoconferencia: boolean;
  ativo: boolean;
}

/** Até onde o usuário enxerga a fila de solicitações. */
export type EscopoVisibilidade = "proprias" | "unidade" | "todas";

export const escoposVisibilidade: { id: EscopoVisibilidade; label: string; hint: string }[] = [
  { id: "proprias", label: "Somente as suas", hint: "Vê apenas solicitações atribuídas a ela." },
  { id: "unidade", label: "Da unidade", hint: "Vê as solicitações da própria unidade/filial." },
  { id: "todas", label: "Todas", hint: "Vê a fila completa da AC." },
];

export interface PapelRule {
  id: string;
  nome: string;
  descricao: string;
  permissoes: string[];
  usuarios: number;
  escopoVisibilidade: EscopoVisibilidade;
  /** Papéis operacionais aparecem como "Papel responsável" das etapas da esteira. */
  operacional: boolean;
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
  /** "herdado" usa o escopo do papel. */
  escopoVisibilidade: EscopoVisibilidade | "herdado";
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

export type PrioridadeChamado = "baixa" | "normal" | "alta" | "critica";

/** Classificação (categoria) de chamado — configurável por AC. */
export interface ClassificacaoChamado {
  id: string;
  nome: string;
  descricao: string;
  subcategorias: string[];
  prioridadePadrao: PrioridadeChamado;
  slaRespostaHoras: number;
  slaResolucaoHoras: number;
  papelResponsavel: string;
  visivelPortal: boolean;
  ativo: boolean;
}

/** Documento da base de conhecimento (upload simples de arquivo pronto). */
export interface DocumentoConhecimento {
  id: string;
  titulo: string;
  classificacao: string;
  arquivo: string;
  formato: string;
  tamanhoKb: number;
  atualizadoEm: string;
  autor: string;
  publicadoNoPortal: boolean;
  downloads: number;
}

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
    porPrioridade: {
      prioridade: string;
      primeiraRespostaH: number;
      resolucaoH: number;
      alertaEmPercent: number;
    }[];
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
  classificacoes: ClassificacaoChamado[];
  conhecimento: DocumentoConhecimento[];
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
  documentacao: [
    "Documento de identidade",
    "Comprovante de endereço",
    "Contrato social / procuração",
  ],
  validacao: [
    "Conferência biométrica",
    "Checagem em bases públicas",
    "Parecer do agente de registro",
  ],
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
      notificarPapelResponsavel: true,
    },
    papeisNotificados: s.id === "bloqueado" ? ["r4"] : s.id === "emissao" ? ["r1"] : [],
    canaisNotificacao: ["email", "push"],
  }));
}

function seedClassificacoes(): ClassificacaoChamado[] {
  const base: Omit<ClassificacaoChamado, "id">[] = [
    {
      nome: "Instalação e uso",
      descricao: "Dúvidas de instalação de driver, uso do token e assinatura de documentos.",
      subcategorias: [
        "Driver do token",
        "Assinatura em PDF",
        "Navegador / Java",
        "Acesso na nuvem",
      ],
      prioridadePadrao: "normal",
      slaRespostaHoras: 4,
      slaResolucaoHoras: 24,
      papelResponsavel: "Atendimento",
      visivelPortal: true,
      ativo: true,
    },
    {
      nome: "Documentação",
      descricao: "Reenvio, reprovação e conferência de documentos do titular.",
      subcategorias: ["Documento reprovado", "Reenvio de arquivo", "Procuração"],
      prioridadePadrao: "normal",
      slaRespostaHoras: 4,
      slaResolucaoHoras: 24,
      papelResponsavel: "Validação Documental",
      visivelPortal: true,
      ativo: true,
    },
    {
      nome: "Agendamento",
      descricao: "Remarcações e problemas na videoconferência de validação.",
      subcategorias: [
        "Remarcar videoconferência",
        "Não consegui entrar na sala",
        "Confirmar horário",
      ],
      prioridadePadrao: "alta",
      slaRespostaHoras: 2,
      slaResolucaoHoras: 8,
      papelResponsavel: "Atendimento",
      visivelPortal: true,
      ativo: true,
    },
    {
      nome: "Financeiro",
      descricao: "Boletos, notas fiscais, reembolsos e cobranças.",
      subcategorias: ["2ª via de boleto", "Nota fiscal", "Reembolso", "Cobrança indevida"],
      prioridadePadrao: "normal",
      slaRespostaHoras: 8,
      slaResolucaoHoras: 48,
      papelResponsavel: "Financeiro",
      visivelPortal: true,
      ativo: true,
    },
    {
      nome: "Revogação",
      descricao: "Perda, comprometimento ou desligamento do titular.",
      subcategorias: ["Perda do token", "Suspeita de comprometimento", "Desligamento do titular"],
      prioridadePadrao: "critica",
      slaRespostaHoras: 1,
      slaResolucaoHoras: 4,
      papelResponsavel: "Compliance",
      visivelPortal: true,
      ativo: true,
    },
    {
      nome: "Erro no certificado",
      descricao: "Certificado com dados incorretos ou não reconhecido pelos sistemas.",
      subcategorias: ["Dados incorretos", "Certificado não reconhecido", "Expirado antes do prazo"],
      prioridadePadrao: "alta",
      slaRespostaHoras: 2,
      slaResolucaoHoras: 12,
      papelResponsavel: "Agente de Registro",
      visivelPortal: true,
      ativo: true,
    },
    {
      nome: "Outros",
      descricao: "Assuntos gerais, sugestões e reclamações.",
      subcategorias: ["Dúvida geral", "Sugestão", "Reclamação"],
      prioridadePadrao: "baixa",
      slaRespostaHoras: 8,
      slaResolucaoHoras: 72,
      papelResponsavel: "Atendimento",
      visivelPortal: true,
      ativo: true,
    },
  ];
  return base.map((c) => ({ ...c, id: id("cl") }));
}

function seedConhecimento(): DocumentoConhecimento[] {
  const base: Omit<DocumentoConhecimento, "id">[] = [
    {
      titulo: "Como instalar o driver do token A3",
      classificacao: "Instalação e uso",
      arquivo: "guia-driver-token-a3.pdf",
      formato: "PDF",
      tamanhoKb: 842,
      atualizadoEm: "2026-06-18",
      autor: "Marina Duarte",
      publicadoNoPortal: true,
      downloads: 3120,
    },
    {
      titulo: "Certificado não aparece no e-CAC — checklist",
      classificacao: "Erro no certificado",
      arquivo: "checklist-ecac.pdf",
      formato: "PDF",
      tamanhoKb: 512,
      atualizadoEm: "2026-05-02",
      autor: "Diego Nunes",
      publicadoNoPortal: true,
      downloads: 2410,
    },
    {
      titulo: "Documentos aceitos para e-CNPJ",
      classificacao: "Documentação",
      arquivo: "documentos-ecnpj.pdf",
      formato: "PDF",
      tamanhoKb: 388,
      atualizadoEm: "2026-07-09",
      autor: "Compliance",
      publicadoNoPortal: true,
      downloads: 1980,
    },
    {
      titulo: "Roteiro de atendimento — revogação emergencial",
      classificacao: "Revogação",
      arquivo: "roteiro-revogacao.docx",
      formato: "DOCX",
      tamanhoKb: 96,
      atualizadoEm: "2026-07-22",
      autor: "Helena Prado",
      publicadoNoPortal: false,
      downloads: 74,
    },
    {
      titulo: "Emitir 2ª via de boleto e nota fiscal",
      classificacao: "Financeiro",
      arquivo: "segunda-via-boleto.pdf",
      formato: "PDF",
      tamanhoKb: 265,
      atualizadoEm: "2026-04-11",
      autor: "Financeiro",
      publicadoNoPortal: true,
      downloads: 1201,
    },
  ];
  return base.map((d) => ({ ...d, id: id("kb") }));
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
      {
        id: "p1",
        nome: "e-CPF A1",
        validadeMeses: 12,
        preco: 189,
        exigeVideoconferencia: true,
        ativo: true,
      },
      {
        id: "p2",
        nome: "e-CPF A3",
        validadeMeses: 36,
        preco: 289,
        exigeVideoconferencia: true,
        ativo: true,
      },
      {
        id: "p3",
        nome: "e-CNPJ A1",
        validadeMeses: 12,
        preco: 249,
        exigeVideoconferencia: true,
        ativo: true,
      },
      {
        id: "p4",
        nome: "e-CNPJ A3",
        validadeMeses: 36,
        preco: 389,
        exigeVideoconferencia: true,
        ativo: true,
      },
      {
        id: "p5",
        nome: "Nuvem PJ",
        validadeMeses: 12,
        preco: 329,
        exigeVideoconferencia: false,
        ativo: true,
      },
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
        descricao: "Acesso total, inclusive configuração da esteira e publicação de versões.",
        permissoes: [
          "op.ver.todas",
          "op.assumir",
          "op.mover",
          "op.reatribuir",
          "dossie.montar",
          "dossie.verificar",
          "dossie.devolver",
          "emissao.emitir",
          "emissao.revogar",
          "entrega.instalar",
          "comercial.excecao",
          "comercial.desconto",
          "financeiro.baixa",
          "financeiro.dispensa",
          "clientes",
          "relatorios",
          "parceiros",
          "config.editar",
          "config.publicar",
          "restrito.ver",
        ],
        usuarios: 2,
        escopoVisibilidade: "todas",
        operacional: false,
      },
      {
        id: "r2",
        nome: "AGR — Agente de registro",
        descricao: "Conduz validação presencial ou por videoconferência e emite o certificado.",
        permissoes: [
          "op.ver.todas",
          "op.assumir",
          "op.mover",
          "emissao.emitir",
          "clientes",
          "relatorios",
        ],
        usuarios: 6,
        escopoVisibilidade: "proprias",
        operacional: true,
      },
      {
        id: "r6",
        nome: "Montadora de dossiê",
        descricao: "Reúne documentos, monta o dossiê e envia para verificação.",
        permissoes: ["op.ver.todas", "op.assumir", "op.mover", "dossie.montar", "clientes"],
        usuarios: 4,
        escopoVisibilidade: "unidade",
        operacional: true,
      },
      {
        id: "r7",
        nome: "Verificadora",
        descricao: "Confere o dossiê montado por outra pessoa, aprova ou devolve com divergência.",
        permissoes: [
          "op.ver.todas",
          "op.assumir",
          "dossie.verificar",
          "dossie.devolver",
          "relatorios",
        ],
        usuarios: 3,
        escopoVisibilidade: "todas",
        operacional: true,
      },
      {
        id: "r8",
        nome: "VD — Vendas direta",
        descricao: "Capta o cliente, define condição comercial e acompanha até a emissão.",
        permissoes: ["op.ver.todas", "op.assumir", "comercial.desconto", "clientes", "relatorios"],
        usuarios: 7,
        escopoVisibilidade: "proprias",
        operacional: true,
      },
      {
        id: "r9",
        nome: "VI — Vendas indireta",
        descricao: "Atende pedidos vindos de contabilidades e indicadores.",
        permissoes: ["op.ver.todas", "op.assumir", "clientes", "parceiros", "relatorios"],
        usuarios: 5,
        escopoVisibilidade: "unidade",
        operacional: true,
      },
      {
        id: "r10",
        nome: "Financeiro",
        descricao: "Baixa pagamentos, concede dispensa e libera a frente financeira do caso.",
        permissoes: ["op.ver.todas", "financeiro.baixa", "financeiro.dispensa", "relatorios"],
        usuarios: 3,
        escopoVisibilidade: "todas",
        operacional: true,
      },
      {
        id: "r11",
        nome: "Suporte de entrega",
        descricao: "Acompanha instalação, reenvio de mídia e suporte pós-emissão.",
        permissoes: ["op.ver.todas", "op.assumir", "entrega.instalar", "clientes"],
        usuarios: 4,
        escopoVisibilidade: "unidade",
        operacional: true,
      },
      {
        id: "r3",
        nome: "Atendimento",
        descricao: "Chamados, chat e agendamentos. Não move etapas regulatórias.",
        permissoes: ["op.ver.todas", "clientes"],
        usuarios: 5,
        escopoVisibilidade: "todas",
        operacional: false,
      },
      {
        id: "r4",
        nome: "Compliance",
        descricao: "Auditoria, revogações, casos restritos e conformidade regulatória.",
        permissoes: [
          "op.ver.todas",
          "dossie.verificar",
          "emissao.revogar",
          "relatorios",
          "config.editar",
          "restrito.ver",
        ],
        usuarios: 2,
        escopoVisibilidade: "todas",
        operacional: true,
      },
      {
        id: "r5",
        nome: "Parceiro contábil",
        descricao: "Portal externo: pedidos, clientes e comissões.",
        permissoes: ["clientes"],
        usuarios: 38,
        escopoVisibilidade: "proprias",
        operacional: false,
      },
    ],
    usuarios: [
      {
        id: "u1",
        nome: "Marina Duarte",
        email: "marina.duarte@certus.com.br",
        iniciais: "MD",
        papelId: "r2",
        unidade: "Matriz — São Paulo",
        telefone: "(11) 98812-4410",
        status: "ativo",
        mfa: true,
        limiteWip: 12,
        escopoVisibilidade: "herdado",
        criadoEm: "12/03/2024",
        ultimoAcesso: "hoje, 08:42",
        observacao: "AR sênior, habilitada para videoconferência.",
      },
      {
        id: "u2",
        nome: "Rafael Bastos",
        email: "rafael.bastos@certus.com.br",
        iniciais: "RB",
        papelId: "r6",
        unidade: "Matriz — São Paulo",
        telefone: "(11) 99120-7781",
        status: "ativo",
        mfa: true,
        limiteWip: 10,
        escopoVisibilidade: "herdado",
        criadoEm: "02/07/2024",
        ultimoAcesso: "hoje, 09:15",
        observacao: "",
      },
      {
        id: "u3",
        nome: "Carolina Ito",
        email: "carolina.ito@certus.com.br",
        iniciais: "CI",
        papelId: "r7",
        unidade: "Filial — Campinas",
        telefone: "(19) 99871-3320",
        status: "ativo",
        mfa: false,
        limiteWip: 14,
        escopoVisibilidade: "herdado",
        criadoEm: "19/09/2024",
        ultimoAcesso: "ontem, 18:03",
        observacao: "Foco em validação documental.",
      },
      {
        id: "u4",
        nome: "Diego Nunes",
        email: "diego.nunes@certus.com.br",
        iniciais: "DN",
        papelId: "r3",
        unidade: "Matriz — São Paulo",
        telefone: "(11) 98450-2214",
        status: "ativo",
        mfa: true,
        limiteWip: 20,
        escopoVisibilidade: "herdado",
        criadoEm: "05/01/2025",
        ultimoAcesso: "hoje, 07:58",
        observacao: "",
      },
      {
        id: "u5",
        nome: "Helena Prado",
        email: "helena.prado@certus.com.br",
        iniciais: "HP",
        papelId: "r4",
        unidade: "Matriz — São Paulo",
        telefone: "(11) 97731-9002",
        status: "ativo",
        mfa: true,
        limiteWip: 8,
        escopoVisibilidade: "herdado",
        criadoEm: "22/02/2024",
        ultimoAcesso: "hoje, 09:31",
        observacao: "Encarregada de dados (DPO).",
      },
      {
        id: "u6",
        nome: "Bruno Tavares",
        email: "bruno.tavares@certus.com.br",
        iniciais: "BT",
        papelId: "r1",
        unidade: "Matriz — São Paulo",
        telefone: "(11) 98003-4471",
        status: "ativo",
        mfa: true,
        limiteWip: 6,
        escopoVisibilidade: "herdado",
        criadoEm: "10/01/2024",
        ultimoAcesso: "hoje, 06:40",
        observacao: "Administrador da conta.",
      },
      {
        id: "u7",
        nome: "Letícia Amaral",
        email: "leticia.amaral@certus.com.br",
        iniciais: "LA",
        papelId: "r3",
        unidade: "Filial — Campinas",
        telefone: "(19) 98220-5514",
        status: "convidado",
        mfa: false,
        limiteWip: 15,
        escopoVisibilidade: "herdado",
        criadoEm: "28/08/2026",
        ultimoAcesso: "convite pendente",
        observacao: "Convite enviado, aguardando primeiro acesso.",
      },
      {
        id: "u8",
        nome: "Otávio Lins",
        email: "otavio.lins@certus.com.br",
        iniciais: "OL",
        papelId: "r8",
        unidade: "Filial — Recife",
        telefone: "(81) 99614-2287",
        status: "suspenso",
        mfa: false,
        limiteWip: 10,
        escopoVisibilidade: "herdado",
        criadoEm: "14/05/2025",
        ultimoAcesso: "11/07/2026, 16:22",
        observacao: "Acesso suspenso durante afastamento.",
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
        {
          id: "l1",
          usuario: "Marina Duarte",
          quando: "hoje, 08:12",
          local: "São Paulo/SP",
          ip: "200.155.30.14",
          metodo: "Senha + app",
          resultado: "sucesso",
        },
        {
          id: "l2",
          usuario: "Rafael Bastos",
          quando: "hoje, 07:58",
          local: "São Paulo/SP",
          ip: "200.155.30.22",
          metodo: "SSO Google",
          resultado: "sucesso",
        },
        {
          id: "l3",
          usuario: "Desconhecido",
          quando: "ontem, 23:41",
          local: "Hanói, VN",
          ip: "45.62.11.7",
          metodo: "Senha",
          resultado: "bloqueado",
        },
        {
          id: "l4",
          usuario: "Carolina Ito",
          quando: "ontem, 19:03",
          local: "Campinas/SP",
          ip: "189.4.77.12",
          metodo: "Senha + SMS",
          resultado: "sucesso",
        },
        {
          id: "l5",
          usuario: "Diego Nunes",
          quando: "ontem, 18:20",
          local: "Recife/PE",
          ip: "177.92.3.44",
          metodo: "Senha",
          resultado: "falha",
        },
      ],
    },
    notificacoes: {
      eventos: [
        {
          id: "n1",
          label: "Solicitação criada",
          email: true,
          whatsapp: true,
          sms: false,
          push: true,
        },
        {
          id: "n2",
          label: "Documento reprovado",
          email: true,
          whatsapp: true,
          sms: true,
          push: true,
        },
        {
          id: "n3",
          label: "Videoconferência agendada",
          email: true,
          whatsapp: true,
          sms: true,
          push: false,
        },
        {
          id: "n4",
          label: "Certificado emitido",
          email: true,
          whatsapp: true,
          sms: false,
          push: true,
        },
        { id: "n5", label: "SLA em risco", email: false, whatsapp: false, sms: false, push: true },
        {
          id: "n6",
          label: "Renovação em 30 dias",
          email: true,
          whatsapp: true,
          sms: false,
          push: false,
        },
        {
          id: "n7",
          label: "Fatura vencida",
          email: true,
          whatsapp: false,
          sms: false,
          push: false,
        },
        {
          id: "n8",
          label: "Novo chamado no portal",
          email: true,
          whatsapp: false,
          sms: false,
          push: true,
        },
      ],
      remetente: "operacao@certus.com.br",
      assinatura: "Equipe Certus AC · suporte 24/7",
      silencioInicio: "21:00",
      silencioFim: "07:00",
      resumoDiario: true,
    },
    integracoes: {
      chaves: [
        {
          id: "k1",
          nome: "Portal do parceiro",
          prefixo: "cts_live_9f2a",
          escopo: "pedidos:rw",
          criadaEm: "2026-02-10",
          ultimoUso: "hoje, 09:12",
          ativa: true,
        },
        {
          id: "k2",
          nome: "ERP financeiro",
          prefixo: "cts_live_41bd",
          escopo: "financeiro:ro",
          criadaEm: "2025-11-02",
          ultimoUso: "hoje, 06:00",
          ativa: true,
        },
        {
          id: "k3",
          nome: "Integração legada",
          prefixo: "cts_test_77c0",
          escopo: "clientes:ro",
          criadaEm: "2025-04-18",
          ultimoUso: "há 4 meses",
          ativa: false,
        },
      ],
      webhooks: [
        {
          id: "w1",
          evento: "certificado.emitido",
          url: "https://erp.certus.com.br/hooks/emissao",
          ativo: true,
          ultimaEntrega: "hoje, 09:40",
          status: "ok",
        },
        {
          id: "w2",
          evento: "chamado.criado",
          url: "https://crm.certus.com.br/hooks/ticket",
          ativo: true,
          ultimaEntrega: "hoje, 08:55",
          status: "ok",
        },
        {
          id: "w3",
          evento: "fatura.vencida",
          url: "https://erp.certus.com.br/hooks/cobranca",
          ativo: false,
          ultimaEntrega: "há 2 dias",
          status: "falha",
        },
      ],
      conectores: [
        {
          id: "c1",
          nome: "WhatsApp Business",
          descricao: "Atendimento e notificações no chat.",
          conectado: true,
        },
        {
          id: "c2",
          nome: "Gateway de pagamento",
          descricao: "Pix, boleto e cartão nas cobranças.",
          conectado: true,
        },
        {
          id: "c3",
          nome: "Assinador ICP-Brasil",
          descricao: "Emissão e revogação de certificados.",
          conectado: true,
        },
        {
          id: "c4",
          nome: "Receita Federal / Serpro",
          descricao: "Consulta de CPF, CNPJ e situação cadastral.",
          conectado: true,
        },
        {
          id: "c5",
          nome: "Biometria facial",
          descricao: "Prova de vida na videoconferência.",
          conectado: false,
        },
        {
          id: "c6",
          nome: "Google Agenda",
          descricao: "Sincronização dos atendimentos.",
          conectado: false,
        },
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
      mensagemPortal:
        "Precisa de ajuda com seu certificado? Abra um chamado — respondemos em até 4 horas úteis.",
      formatoData: "dd/MM/yyyy",
    },
    classificacoes: seedClassificacoes(),
    conhecimento: seedConhecimento(),
    dados: {
      retencaoDocumentosMeses: 72,
      anonimizarAposEncerrar: false,
      consentimentoLgpd: true,
      backupDiario: true,
      encarregadoLgpd: "Helena Prado — dpo@certus.com.br",
    },
  };
}

/** Cria uma etapa personalizada para a esteira da AC. */
export function novaEtapa(nome: string, papelResponsavel: string): StageRule {
  return {
    id: id("st"),
    nome,
    descricao: "Etapa personalizada da esteira.",
    ativo: true,
    removivel: true,
    slaHoras: 8,
    papelResponsavel,
    checklist: [],
    documentos: [],
    gates: {
      checklistObrigatorio: true,
      documentosAprovados: false,
      pagamentoConfirmado: false,
      duplaConferencia: false,
      biometriaValidada: false,
      gravacaoArquivada: false,
    },
    automacoes: {
      notificarCliente: false,
      atribuirAutomatico: true,
      escalarSlaEstourado: true,
      notificarPapelResponsavel: true,
    },
    papeisNotificados: [],
    canaisNotificacao: ["email", "push"],
  };
}

/** Garante que configurações salvas antes de novos campos continuem válidas. */
function normalizar(s: Settings): Settings {
  const base = seedSettings();
  return {
    ...base,
    ...s,
    fluxo: {
      ...base.fluxo,
      ...s.fluxo,
      etapas: (s.fluxo?.etapas ?? base.fluxo.etapas).map((e) => ({
        ...e,
        papeisNotificados: e.papeisNotificados ?? [],
        canaisNotificacao: e.canaisNotificacao ?? ["email", "push"],
        automacoes: {
          ...e.automacoes,
          notificarPapelResponsavel: e.automacoes?.notificarPapelResponsavel ?? true,
        },
      })),
    },
    // Papéis anteriores ao modelo unificado (perfis separados) voltam ao seed novo.
    papeis: (s.papeis ?? base.papeis).some((p) => typeof p.operacional !== "boolean")
      ? base.papeis
      : s.papeis.map((p) => ({ ...p, escopoVisibilidade: p.escopoVisibilidade ?? "todas" })),

    usuarios: (s.usuarios ?? base.usuarios).map((u) => ({
      ...u,
      escopoVisibilidade: u.escopoVisibilidade ?? "herdado",
    })),
  };
}

/** Escopo efetivo de um usuário considerando a herança do papel. */
export function escopoEfetivo(usuario: UsuarioRule, papel?: PapelRule): EscopoVisibilidade {
  return usuario.escopoVisibilidade === "herdado"
    ? (papel?.escopoVisibilidade ?? "todas")
    : usuario.escopoVisibilidade;
}

type Patch<T> = (atual: T) => T;

interface SettingsCtx {
  settings: Settings;
  update: <K extends keyof Settings>(chave: K, patch: Partial<Settings[K]>) => void;
  replace: <K extends keyof Settings>(chave: K, valor: Settings[K]) => void;
  updateEtapa: (etapaId: string, patch: Partial<StageRule>) => void;
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
      if (raw) setSettings(normalizar(JSON.parse(raw) as Settings));
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
    () => ({
      settings,
      update,
      replace,
      updateEtapa,
      patchEtapas,
      resetSettings,
      dirty,
      marcarSalvo: () => setDirty(false),
    }),
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

export function iniciaisDe(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "??";
  const primeira = partes[0]![0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]![0] ?? "") : (partes[0]![1] ?? "");
  return (primeira + ultima).toUpperCase();
}

export function novoUsuario(dados: {
  nome: string;
  email: string;
  papelId: string;
  unidade: string;
  telefone: string;
  status: StatusUsuario;
  mfa: boolean;
  limiteWip: number;
  escopoVisibilidade: EscopoVisibilidade | "herdado";
  observacao: string;
}): UsuarioRule {
  const agora = new Date().toLocaleDateString("pt-BR");
  return {
    id: id("u"),
    iniciais: iniciaisDe(dados.nome),
    criadoEm: agora,
    ultimoAcesso: dados.status === "convidado" ? "convite pendente" : "—",
    ...dados,
  };
}

export const unidadesDisponiveis = [
  "Matriz — São Paulo",
  "Filial — Campinas",
  "Filial — Recife",
  "Remoto",
];

/** Permissões agrupadas pelas frentes do caso (mesma linguagem da esteira). */
export const gruposPermissoes: {
  id: string;
  label: string;
  hint: string;
  itens: { id: string; label: string; hint: string }[];
}[] = [
  {
    id: "operacao",
    label: "Operação",
    hint: "Fila, atribuição e avanço de etapas.",
    itens: [
      {
        id: "op.ver.todas",
        label: "Ver a esteira",
        hint: "Abrir Visão geral, Minha fila e Todos os casos.",
      },
      { id: "op.assumir", label: "Assumir caso", hint: "Puxar um caso não atribuído para si." },
      {
        id: "op.reatribuir",
        label: "Reatribuir",
        hint: "Passar um caso para outra pessoa ou perfil.",
      },
    ],
  },
  {
    id: "dossie",
    label: "Dossiê",
    hint: "Segregação de funções: montar e verificar não deveriam ficar na mesma pessoa.",
    itens: [
      {
        id: "dossie.montar",
        label: "Montar dossiê",
        hint: "Anexar documentos e enviar para verificação.",
      },
      {
        id: "dossie.verificar",
        label: "Verificar dossiê",
        hint: "Aprovar a conferência documental.",
      },
      {
        id: "dossie.devolver",
        label: "Devolver com divergência",
        hint: "Retornar o dossiê apontando o que falta.",
      },
    ],
  },
  {
    id: "emissao",
    label: "Emissão e entrega",
    hint: "Atos regulatórios do certificado.",
    itens: [
      { id: "emissao.emitir", label: "Emitir certificado", hint: "Concluir a emissão junto à AC." },
      { id: "emissao.revogar", label: "Revogar certificado", hint: "Revogar emissão já entregue." },
      {
        id: "entrega.instalar",
        label: "Entrega e instalação",
        hint: "Registrar entrega, instalação e reenvio.",
      },
    ],
  },
  {
    id: "comercial",
    label: "Comercial e financeiro",
    hint: "Liberações que afetam o pagamento de cada emissão.",
    itens: [
      {
        id: "comercial.desconto",
        label: "Aplicar condição comercial",
        hint: "Definir preço, desconto e cortesia.",
      },
      {
        id: "comercial.excecao",
        label: "Conceder exceção comercial",
        hint: "Liberar emissão antes do pagamento.",
      },
      {
        id: "financeiro.baixa",
        label: "Baixar pagamento",
        hint: "Confirmar recebimento da emissão.",
      },
      {
        id: "financeiro.dispensa",
        label: "Dispensar cobrança",
        hint: "Registrar dispensa com motivo.",
      },
    ],
  },
  {
    id: "geral",
    label: "Módulos",
    hint: "Acesso às demais áreas do sistema.",
    itens: [
      {
        id: "clientes",
        label: "Clientes e chamados",
        hint: "Dossiê do cliente, chat, agenda e helpdesk.",
      },
      { id: "relatorios", label: "Relatórios", hint: "Painéis e exportações CSV/XLSX/PDF." },
      { id: "parceiros", label: "Parceiros", hint: "Contadores, indicadores e comissões." },
      {
        id: "restrito.ver",
        label: "Ver casos restritos",
        hint: "Casos com suspeita de fraude e visibilidade limitada.",
      },
    ],
  },
  {
    id: "config",
    label: "Configuração",
    hint: "Quem desenha e quem publica a esteira.",
    itens: [
      {
        id: "config.editar",
        label: "Editar rascunho da esteira",
        hint: "Alterar marcos, etapas e subfluxos.",
      },
      {
        id: "config.publicar",
        label: "Publicar versão",
        hint: "Colocar o rascunho em vigor para casos novos.",
      },
    ],
  },
];

export const permissoesDisponiveis = gruposPermissoes.flatMap((g) => g.itens);

/** Papéis que acumulam montagem e verificação do mesmo dossiê. */
export function conflitoSegregacao(papel: PapelRule) {
  return (
    papel.permissoes.includes("dossie.montar") && papel.permissoes.includes("dossie.verificar")
  );
}
