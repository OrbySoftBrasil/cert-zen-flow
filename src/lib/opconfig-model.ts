// Modelo de "Operação & perfis": o administrador NÃO desenha workflows livres.
// Ele configura um perfil operacional dentro de limites definidos pelo produto:
// marcos canônicos fixos, subfluxos de um catálogo controlado, escopo com
// precedência declarada e publicação versionada.

/* ------------------------------------------------------------ Marcos fixos */

export type MarcoId = "captacao" | "preparacao" | "validacao" | "emissao" | "entrega" | "em-uso";

export interface MarcoCanonico {
  id: MarcoId;
  nome: string;
  proposito: string;
  invariante: string;
}

export const MARCOS: MarcoCanonico[] = [
  {
    id: "captacao",
    nome: "Captação",
    proposito: "Entrada do caso: origem, titular, produto e condição comercial.",
    invariante: "Todo caso nasce em Captação. O marco não pode ser removido nem reordenado.",
  },
  {
    id: "preparacao",
    nome: "Preparação",
    proposito: "Dossiê, agendamento e pré-requisitos antes da validação.",
    invariante: "Precede obrigatoriamente a Validação.",
  },
  {
    id: "validacao",
    nome: "Validação",
    proposito: "Conferência de identidade e do dossiê pelo AGR/verificadora.",
    invariante: "Nenhuma emissão ocorre sem validação aprovada e registrada.",
  },
  {
    id: "emissao",
    nome: "Emissão",
    proposito: "Solicitação e confirmação da emissão junto à AC.",
    invariante: "Depende de liberação comercial e validação da própria emissão.",
  },
  {
    id: "entrega",
    nome: "Entrega",
    proposito: "Envio, instalação e confirmação de recebimento pelo titular.",
    invariante: "Só inicia após emissão confirmada pela AC.",
  },
  {
    id: "em-uso",
    nome: "Em uso",
    proposito: "Pós-venda: suporte, renovação e revogação.",
    invariante: "Marco final do ciclo. Não pode ser desativado.",
  },
];

/* ---------------------------------------------------- Origem / precedência */

export type OrigemRegra = "plataforma" | "ac" | "tenant" | "unidade" | "indicador" | "excecao";

export const ORIGENS: Record<
  OrigemRegra,
  { label: string; hint: string; editavel: boolean; peso: number }
> = {
  plataforma: {
    label: "Plataforma",
    hint: "Regra legal ou de segurança. Prevalece sobre qualquer configuração.",
    editavel: false,
    peso: 6,
  },
  ac: {
    label: "AC / produto",
    hint: "Capability homologada pela Autoridade Certificadora. Não pode ser ligada manualmente.",
    editavel: false,
    peso: 5,
  },
  tenant: { label: "Tenant", hint: "Padrão desta Autoridade de Registro.", editavel: true, peso: 4 },
  unidade: { label: "Unidade", hint: "Ajuste de uma filial específica.", editavel: true, peso: 3 },
  indicador: {
    label: "Indicador",
    hint: "Ajuste comercial de um parceiro/contabilidade. Nunca remove requisito regulatório.",
    editavel: true,
    peso: 2,
  },
  excecao: { label: "Exceção do caso", hint: "Autorizada pontualmente, com registro.", editavel: true, peso: 1 },
};

export type EscopoTipo = "tenant" | "produto" | "unidade" | "indicador";

export interface EscopoConfig {
  tipo: EscopoTipo;
  alvo: string;
}

export const ESCOPOS: { tipo: EscopoTipo; label: string; hint: string; alvos: string[] }[] = [
  { tipo: "tenant", label: "Padrão do tenant", hint: "Vale para toda a AR quando não houver override.", alvos: ["Certus AR"] },
  { tipo: "produto", label: "Produto", hint: "Override por produto certificado.", alvos: ["e-CPF A1", "e-CPF A3", "e-CNPJ A1", "e-CNPJ A3", "BIRD ID"] },
  { tipo: "unidade", label: "Unidade", hint: "Override por filial/posto de atendimento.", alvos: ["Matriz — São Paulo", "Filial — Campinas", "Filial — Curitiba"] },
  { tipo: "indicador", label: "Indicador / contabilidade", hint: "Override comercial por parceiro.", alvos: ["Contabilidade Prisma", "Escritório Nova Era", "Contax Assessoria"] },
];

/* ------------------------------------------------------------------ Etapas */

export type Canal = "email" | "push" | "whatsapp";

export interface ItemChecklist {
  id: string;
  label: string;
  obrigatorio: boolean;
}

export interface PortaoEtapa {
  exige: string;
  autorizador: string;
}

export interface EtapaConfig {
  id: string;
  marco: MarcoId;
  nome: string;
  papel: string;
  slaHoras: number;
  checklist: ItemChecklist[];
  canais: Canal[];
  avisarPapel: boolean;
  avisarCliente: boolean;
  criterioEntrada: string;
  criterioSaida: string;
  aplicabilidade: string[];
  instrucoes: string;
  origem: OrigemRegra;
  obrigatoria: boolean;
  segregacaoObrigatoria: boolean;
  papelVerificador: string;
  portao: PortaoEtapa | null;
  ativa: boolean;
  removivel: boolean;
}

/* --------------------------------------------------------------- Subfluxos */

export interface SubfluxoConfig {
  id: string;
  nome: string;
  descricao: string;
  gatilho: string;
  ativo: boolean;
  responsavel: string;
  slaHoras: number;
  checklist: ItemChecklist[];
  canais: Canal[];
  dependeHomologacao: boolean;
  homologado: boolean;
  origem: OrigemRegra;
}

export const PAPEIS_OPERACAO = [
  "VD — Vendas direta",
  "VI — Vendas indireta",
  "AGR — Agente de registro",
  "Montadora de dossiê",
  "Verificadora",
  "Financeiro",
  "Suporte de entrega",
  "Compliance",
] as const;

export const APLICABILIDADES = [
  "Todos os produtos",
  "e-CPF",
  "e-CNPJ",
  "A1 (arquivo)",
  "A3 (mídia)",
  "Nuvem",
  "Renovação",
  "Videoconferência",
  "Presencial",
] as const;

let seq = 0;
const uid = (p: string) => `${p}-${(seq += 1).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function ck(label: string, obrigatorio = true): ItemChecklist {
  return { id: uid("ck"), label, obrigatorio };
}

function etapa(e: Partial<EtapaConfig> & Pick<EtapaConfig, "marco" | "nome" | "papel">): EtapaConfig {
  return {
    id: uid("et"),
    slaHoras: 8,
    checklist: [],
    canais: ["email", "push"],
    avisarPapel: true,
    avisarCliente: false,
    criterioEntrada: "Marco anterior concluído.",
    criterioSaida: "Checklist obrigatório concluído.",
    aplicabilidade: ["Todos os produtos"],
    instrucoes: "",
    origem: "tenant",
    obrigatoria: false,
    segregacaoObrigatoria: false,
    papelVerificador: "",
    portao: null,
    ativa: true,
    removivel: true,
    ...e,
  };
}

export function novaEtapaConfig(marco: MarcoId, nome: string, papel: string): EtapaConfig {
  return etapa({ marco, nome, papel, instrucoes: "Descreva o que o operador deve fazer nesta etapa." });
}

export function novoItemChecklist(label: string): ItemChecklist {
  return ck(label, false);
}

function seedEtapas(): EtapaConfig[] {
  return [
    etapa({
      marco: "captacao",
      nome: "Qualificação do pedido",
      papel: "VD — Vendas direta",
      slaHoras: 4,
      obrigatoria: true,
      removivel: false,
      criterioEntrada: "Pedido criado por portal, indicador, chat ou importação.",
      criterioSaida: "Titular, produto e condição comercial definidos.",
      instrucoes: "Confirme quem é o titular, quem paga e quem acompanha o caso.",
      checklist: [ck("Titular e representante identificados"), ck("Produto e modalidade escolhidos"), ck("Origem do pedido registrada", false)],
    }),
    etapa({
      marco: "captacao",
      nome: "Liberação comercial",
      papel: "Financeiro",
      slaHoras: 6,
      obrigatoria: true,
      removivel: false,
      origem: "plataforma",
      portao: { exige: "Pagamento confirmado, dispensa ou exceção aprovada", autorizador: "Financeiro" },
      criterioSaida: "Pagamento confirmado, dispensa registrada ou exceção aprovada.",
      instrucoes: "Cada emissão precisa da própria liberação. Nunca reaproveite o pagamento de outra emissão do mesmo caso.",
      checklist: [ck("Condição comercial aplicada"), ck("Pagamento, dispensa ou exceção registrada")],
      canais: ["email", "push", "whatsapp"],
    }),
    etapa({
      marco: "preparacao",
      nome: "Montagem do dossiê",
      papel: "Montadora de dossiê",
      slaHoras: 12,
      obrigatoria: true,
      removivel: false,
      criterioEntrada: "Liberação comercial concluída.",
      criterioSaida: "Todos os itens obrigatórios do produto anexados.",
      instrucoes: "Anexe cada documento na versão mais recente e registre a origem do arquivo.",
      checklist: [ck("Documento de identidade"), ck("Comprovante de vínculo (PJ)"), ck("Selfie / prova de vida", false)],
    }),
    etapa({
      marco: "preparacao",
      nome: "Agendamento do atendimento",
      papel: "VI — Vendas indireta",
      slaHoras: 8,
      criterioSaida: "Horário confirmado pelo titular.",
      instrucoes: "Confirme o horário por WhatsApp e registre a confirmação.",
      checklist: [ck("Horário escolhido"), ck("Confirmação enviada ao titular", false)],
      canais: ["email", "whatsapp"],
      avisarCliente: true,
    }),
    etapa({
      marco: "validacao",
      nome: "Conferência do dossiê",
      papel: "Verificadora",
      slaHoras: 6,
      obrigatoria: true,
      removivel: false,
      origem: "plataforma",
      segregacaoObrigatoria: true,
      papelVerificador: "AGR — Agente de registro",
      criterioEntrada: "Dossiê enviado para verificação.",
      criterioSaida: "Dossiê aprovado sem divergência aberta.",
      instrucoes: "Quem montou o dossiê não pode conferir o mesmo dossiê.",
      checklist: [ck("Itens obrigatórios presentes"), ck("Legibilidade e validade conferidas"), ck("Divergências tratadas")],
    }),
    etapa({
      marco: "validacao",
      nome: "Validação de identidade",
      papel: "AGR — Agente de registro",
      slaHoras: 6,
      obrigatoria: true,
      removivel: false,
      origem: "plataforma",
      portao: { exige: "Biometria e gravação arquivadas", autorizador: "AGR — Agente de registro" },
      criterioSaida: "Validação aprovada e evidência arquivada.",
      instrucoes: "Registre o método usado (videoconferência, presencial ou base biométrica).",
      checklist: [ck("Identidade confirmada"), ck("Gravação/evidência arquivada"), ck("Termo assinado")],
    }),
    etapa({
      marco: "emissao",
      nome: "Solicitação à AC",
      papel: "AGR — Agente de registro",
      slaHoras: 4,
      obrigatoria: true,
      removivel: false,
      origem: "ac",
      criterioEntrada: "Validação aprovada desta emissão.",
      criterioSaida: "Protocolo de emissão retornado pela AC.",
      instrucoes: "Confira produto, titular e responsável técnico antes de enviar.",
      checklist: [ck("Dados conferidos"), ck("Protocolo registrado")],
    }),
    etapa({
      marco: "entrega",
      nome: "Envio e instalação",
      papel: "Suporte de entrega",
      slaHoras: 24,
      obrigatoria: true,
      removivel: false,
      criterioSaida: "Recebimento confirmado pelo titular.",
      instrucoes: "Envie o passo a passo de instalação e confirme o uso.",
      checklist: [ck("Envio realizado"), ck("Instalação confirmada", false)],
      avisarCliente: true,
      canais: ["email", "whatsapp"],
    }),
    etapa({
      marco: "em-uso",
      nome: "Acompanhamento e renovação",
      papel: "Suporte de entrega",
      slaHoras: 48,
      obrigatoria: true,
      removivel: false,
      criterioSaida: "Certificado renovado, revogado ou expirado.",
      instrucoes: "Abra a renovação 45 dias antes do vencimento.",
      checklist: [ck("Aviso de vencimento enviado", false)],
    }),
  ];
}

function seedSubfluxos(): SubfluxoConfig[] {
  const base = (
    nome: string,
    descricao: string,
    gatilho: string,
    responsavel: string,
    slaHoras: number,
    itens: string[],
    extra: Partial<SubfluxoConfig> = {},
  ): SubfluxoConfig => ({
    id: uid("sf"),
    nome,
    descricao,
    gatilho,
    ativo: true,
    responsavel,
    slaHoras,
    checklist: itens.map((i) => ck(i)),
    canais: ["email", "push"],
    dependeHomologacao: false,
    homologado: true,
    origem: "tenant",
    ...extra,
  });

  return [
    base("Reagendamento", "Reabre o agendamento quando o titular não comparece ou pede outro horário.", "No-show ou pedido do titular", "VI — Vendas indireta", 8, ["Novo horário confirmado", "Titular avisado"]),
    base("Pendência de dossiê", "Devolve o dossiê ao cliente quando falta um item obrigatório.", "Item obrigatório ausente", "Montadora de dossiê", 12, ["Pendência descrita", "Cliente notificado"]),
    base("Divergência de dossiê", "Trata documento ilegível, vencido ou inconsistente apontado na conferência.", "Reprovação da verificadora", "Verificadora", 8, ["Motivo da divergência registrado", "Reenvio conferido"]),
    base("Exceção comercial", "Permite avançar sem pagamento mediante autorização registrada.", "Solicitação do VD/indicador", "Financeiro", 4, ["Justificativa registrada", "Autorizador identificado"], { origem: "tenant" }),
    base("Emissão manual", "Emissão conduzida fora do fluxo automático da AC.", "Falha ou indisponibilidade da AC", "AGR — Agente de registro", 6, ["Motivo registrado", "Protocolo manual anexado"], { origem: "ac" }),
    base("Envio manual", "Reenvio do certificado quando a entrega automática falha.", "Falha de envio automático", "Suporte de entrega", 6, ["Canal alternativo usado", "Recebimento confirmado"]),
    base("Revogação", "Revoga o certificado por perda, comprometimento ou desligamento.", "Pedido do titular ou compliance", "Compliance", 4, ["Motivo classificado", "Revogação confirmada pela AC"], { origem: "plataforma" }),
    base("Suspeita de fraude", "Congela o caso e escala para compliance.", "Sinal de fraude detectado", "Compliance", 2, ["Caso congelado", "Análise registrada"], { origem: "plataforma" }),
    base("Emissão relacionada / BIRD", "Segunda emissão aproveitando validação já realizada, quando a AC permitir.", "Novo produto no mesmo caso", "AGR — Agente de registro", 6, ["Elegibilidade conferida", "Liberação comercial própria"], {
      ativo: false,
      dependeHomologacao: true,
      homologado: false,
      origem: "ac",
    }),
    base("Atendimento presencial / voucher", "Validação em posto físico com voucher, quando homologado pela AC.", "Titular sem videoconferência", "AGR — Agente de registro", 12, ["Posto e horário definidos", "Voucher emitido"], {
      ativo: false,
      dependeHomologacao: true,
      homologado: false,
      origem: "ac",
    }),
  ];
}

/* ------------------------------------------------------------- Versionamento */

export interface PerfilOperacional {
  escopo: EscopoConfig;
  etapas: EtapaConfig[];
  subfluxos: SubfluxoConfig[];
}

export interface VersaoPerfil extends PerfilOperacional {
  id: string;
  numero: string;
  autor: string;
  data: string;
  nota: string;
  casos: number;
}

export function seedPublicada(): VersaoPerfil {
  return {
    id: "v-12",
    numero: "v12",
    autor: "Helena Prado",
    data: "2026-08-21T14:20:00",
    nota: "Segregação obrigatória entre montagem e conferência do dossiê.",
    casos: 184,
    escopo: { tipo: "tenant", alvo: "Certus AR" },
    etapas: seedEtapas(),
    subfluxos: seedSubfluxos(),
  };
}

export function seedHistorico(): VersaoPerfil[] {
  const p = seedPublicada();
  return [
    { ...p, id: "v-11", numero: "v11", autor: "Rafael Lima", data: "2026-07-02T09:10:00", nota: "SLA de entrega ampliado para 24h.", casos: 41 },
    { ...p, id: "v-10", numero: "v10", autor: "Helena Prado", data: "2026-05-14T16:45:00", nota: "Subfluxo de divergência de dossiê ativado.", casos: 12 },
  ];
}

/* -------------------------------------------------------------- Validações */

export interface AchadoPublicacao {
  id: string;
  tipo: "erro" | "aviso";
  titulo: string;
  detalhe: string;
  comoResolver: string;
}

export function validarPublicacao(perfil: PerfilOperacional): AchadoPublicacao[] {
  const achados: AchadoPublicacao[] = [];
  const ativas = perfil.etapas.filter((e) => e.ativa);

  for (const e of ativas) {
    if (!e.papel.trim()) {
      achados.push({
        id: `papel-${e.id}`,
        tipo: "erro",
        titulo: `Etapa “${e.nome}” sem responsável`,
        detalhe: "Etapa obrigatória precisa de um papel responsável definido.",
        comoResolver: "Escolha o papel responsável na configuração da etapa.",
      });
    }
    if (e.segregacaoObrigatoria && e.papelVerificador && e.papelVerificador === e.papel) {
      achados.push({
        id: `segregacao-${e.id}`,
        tipo: "erro",
        titulo: `Segregação violada em “${e.nome}”`,
        detalhe: "A verificação está atribuída ao mesmo papel que executa a etapa.",
        comoResolver: "Atribua a verificação a um papel diferente do executor.",
      });
    }
    if (e.portao && !e.portao.autorizador.trim()) {
      achados.push({
        id: `portao-${e.id}`,
        tipo: "erro",
        titulo: `Portão sem autorizador em “${e.nome}”`,
        detalhe: `O portão exige “${e.portao.exige}” mas ninguém pode liberá-lo.`,
        comoResolver: "Defina o papel autorizador do portão.",
      });
    }
    if (e.slaHoras <= 0) {
      achados.push({
        id: `sla-${e.id}`,
        tipo: "aviso",
        titulo: `Etapa “${e.nome}” sem SLA`,
        detalhe: "Sem SLA a etapa não entra nos alertas de atraso.",
        comoResolver: "Informe o prazo em horas.",
      });
    }
    if (perfil.escopo.tipo === "indicador" && !ORIGENS[e.origem].editavel && e.origem !== "tenant") {
      achados.push({
        id: `indicador-${e.id}`,
        tipo: "erro",
        titulo: `Indicador não pode alterar “${e.nome}”`,
        detalhe: `Regra de origem ${ORIGENS[e.origem].label}: regra comercial não remove requisito regulatório.`,
        comoResolver: "Volte o escopo para Padrão do tenant ou desfaça a alteração desta etapa.",
      });
    }
  }

  for (const m of MARCOS) {
    if (!ativas.some((e) => e.marco === m.id)) {
      achados.push({
        id: `marco-${m.id}`,
        tipo: "erro",
        titulo: `Marco “${m.nome}” sem etapa ativa`,
        detalhe: `Invariante do produto: ${m.invariante}`,
        comoResolver: "Ative uma etapa existente ou crie uma etapa dentro deste marco.",
      });
    }
  }

  for (const s of perfil.subfluxos) {
    if (s.ativo && s.dependeHomologacao && !s.homologado) {
      achados.push({
        id: `cap-${s.id}`,
        tipo: "erro",
        titulo: `“${s.nome}” não é suportado pela AC`,
        detalhe: "Capability dependente de homologação da AC. Não pode ser ligada manualmente.",
        comoResolver: "Desative o subfluxo e solicite a homologação à AC.",
      });
    }
    if (s.ativo && !s.responsavel.trim()) {
      achados.push({
        id: `sfresp-${s.id}`,
        tipo: "erro",
        titulo: `Subfluxo “${s.nome}” sem responsável`,
        detalhe: "Todo subfluxo ativo precisa de um papel responsável.",
        comoResolver: "Defina o responsável do subfluxo.",
      });
    }
  }

  return achados;
}

/* ------------------------------------------------------------------- Diff */

export interface DiffLinha {
  chave: string;
  titulo: string;
  publicada: string;
  rascunho: string;
}

export function compararVersoes(pub: PerfilOperacional, dra: PerfilOperacional): DiffLinha[] {
  const linhas: DiffLinha[] = [];
  const mapPub = new Map(pub.etapas.map((e) => [e.id, e]));
  const mapDra = new Map(dra.etapas.map((e) => [e.id, e]));

  if (pub.escopo.tipo !== dra.escopo.tipo || pub.escopo.alvo !== dra.escopo.alvo) {
    linhas.push({
      chave: "escopo",
      titulo: "Escopo da configuração",
      publicada: `${pub.escopo.tipo} · ${pub.escopo.alvo}`,
      rascunho: `${dra.escopo.tipo} · ${dra.escopo.alvo}`,
    });
  }

  for (const e of dra.etapas) {
    const antes = mapPub.get(e.id);
    if (!antes) {
      linhas.push({ chave: e.id, titulo: `Etapa “${e.nome}”`, publicada: "—", rascunho: "Nova etapa" });
      continue;
    }
    const campos: [string, string, string][] = [
      ["Nome", antes.nome, e.nome],
      ["Responsável", antes.papel, e.papel],
      ["SLA", `${antes.slaHoras}h`, `${e.slaHoras}h`],
      ["Ativa", antes.ativa ? "sim" : "não", e.ativa ? "sim" : "não"],
      ["Checklist", `${antes.checklist.length} itens`, `${e.checklist.length} itens`],
      ["Notificações", antes.canais.join(", ") || "—", e.canais.join(", ") || "—"],
      ["Critério de saída", antes.criterioSaida, e.criterioSaida],
      ["Aplicabilidade", antes.aplicabilidade.join(", "), e.aplicabilidade.join(", ")],
    ];
    for (const [campo, a, b] of campos) {
      if (a !== b) {
        linhas.push({ chave: `${e.id}-${campo}`, titulo: `${e.nome} · ${campo}`, publicada: a, rascunho: b });
      }
    }
  }

  for (const e of pub.etapas) {
    if (!mapDra.has(e.id)) {
      linhas.push({ chave: `rm-${e.id}`, titulo: `Etapa “${e.nome}”`, publicada: "Existia", rascunho: "Removida" });
    }
  }

  const subPub = new Map(pub.subfluxos.map((s) => [s.id, s]));
  for (const s of dra.subfluxos) {
    const antes = subPub.get(s.id);
    if (!antes) continue;
    if (antes.ativo !== s.ativo) {
      linhas.push({
        chave: `sf-${s.id}`,
        titulo: `Subfluxo ${s.nome}`,
        publicada: antes.ativo ? "Ativo" : "Inativo",
        rascunho: s.ativo ? "Ativo" : "Inativo",
      });
    }
    if (antes.responsavel !== s.responsavel || antes.slaHoras !== s.slaHoras) {
      linhas.push({
        chave: `sfc-${s.id}`,
        titulo: `Subfluxo ${s.nome} · responsável e SLA`,
        publicada: `${antes.responsavel} · ${antes.slaHoras}h`,
        rascunho: `${s.responsavel} · ${s.slaHoras}h`,
      });
    }
  }

  return linhas;
}

/* --------------------------------------------------------------- Simulador */

export interface Cenario {
  id: string;
  nome: string;
  descricao: string;
  subfluxos: string[];
  pulaValidacaoDossie?: boolean;
  bloqueio?: { titulo: string; regra: string; origem: OrigemRegra };
  proximaAcao: string;
}

export const CENARIOS: Cenario[] = [
  { id: "pago", nome: "Pago e aprovado diretamente", descricao: "Pagamento confirmado no ato e validação aprovada na primeira tentativa.", subfluxos: [], pulaValidacaoDossie: true, proximaAcao: "Solicitar emissão à AC" },
  { id: "pendente", nome: "Atendimento realizado com pagamento pendente", descricao: "Validação concluída, mas sem liberação comercial.", subfluxos: ["Exceção comercial"], bloqueio: { titulo: "Emissão bloqueada por liberação comercial", regra: "Cada emissão exige pagamento, dispensa ou exceção próprios.", origem: "plataforma" }, proximaAcao: "Registrar pagamento ou aprovar exceção comercial" },
  { id: "dossie", nome: "Validação que exige dossiê", descricao: "Produto PJ com dossiê obrigatório antes da validação.", subfluxos: ["Pendência de dossiê"], proximaAcao: "Enviar dossiê para verificação" },
  { id: "divergente", nome: "Dossiê divergente", descricao: "Verificadora reprova um documento.", subfluxos: ["Divergência de dossiê", "Pendência de dossiê"], bloqueio: { titulo: "Validação travada por divergência aberta", regra: "Dossiê com divergência não avança para validação de identidade.", origem: "plataforma" }, proximaAcao: "Devolver ao cliente com o motivo da divergência" },
  { id: "noshow", nome: "No-show e reagendamento", descricao: "Titular não comparece à videoconferência.", subfluxos: ["Reagendamento"], proximaAcao: "Reagendar atendimento e avisar o titular" },
  { id: "envio", nome: "Falha de envio automático", descricao: "Emissão concluída, entrega automática falhou.", subfluxos: ["Envio manual"], proximaAcao: "Reenviar manualmente e confirmar recebimento" },
  { id: "bird", nome: "BIRD seguido de outro produto", descricao: "Primeira emissão BIRD concluída, segunda emissão no mesmo caso.", subfluxos: ["Emissão relacionada / BIRD"], bloqueio: { titulo: "Segunda emissão aguarda liberação comercial própria", regra: "Uma emissão nunca é liberada pelo pagamento ou validação de outra.", origem: "plataforma" }, proximaAcao: "Aplicar condição comercial da segunda emissão" },
  { id: "presencial", nome: "Atendimento presencial, ainda não homologado", descricao: "Titular pede validação em posto físico.", subfluxos: ["Atendimento presencial / voucher"], bloqueio: { titulo: "Capability não homologada pela AC", regra: "Atendimento presencial/voucher depende de homologação da AC e não pode ser ligado manualmente.", origem: "ac" }, proximaAcao: "Oferecer videoconferência ou solicitar homologação à AC" },
];

export interface ResultadoSimulacao {
  etapas: { marco: string; nome: string; papel: string; sla: number; portao: string | null; origem: OrigemRegra }[];
  tarefas: { papel: string; quantidade: number }[];
  portoes: { etapa: string; exige: string; autorizador: string }[];
  notificacoes: { etapa: string; canais: string; alvo: string }[];
  bloqueios: { titulo: string; regra: string; origem: OrigemRegra }[];
  subfluxos: { nome: string; estado: string; responsavel: string; sla: number }[];
  regraEfetiva: { regra: string; origem: OrigemRegra };
  proximaAcao: string;
}

export function simular(perfil: PerfilOperacional, cenario: Cenario): ResultadoSimulacao {
  const ativas = perfil.etapas
    .filter((e) => e.ativa)
    .filter((e) => !(cenario.pulaValidacaoDossie && e.nome === "Conferência do dossiê"))
    .sort((a, b) => MARCOS.findIndex((m) => m.id === a.marco) - MARCOS.findIndex((m) => m.id === b.marco));

  const tarefas = new Map<string, number>();
  for (const e of ativas) tarefas.set(e.papel, (tarefas.get(e.papel) ?? 0) + 1);

  const subfluxos = cenario.subfluxos.map((nome) => {
    const s = perfil.subfluxos.find((x) => x.nome === nome);
    if (!s) return { nome, estado: "Não catalogado", responsavel: "—", sla: 0 };
    const estado = s.dependeHomologacao && !s.homologado ? "Dependente de homologação da AC" : s.ativo ? "Ativo" : "Desativado nesta configuração";
    return { nome: s.nome, estado, responsavel: s.responsavel, sla: s.slaHoras };
  });

  const bloqueios = [...(cenario.bloqueio ? [cenario.bloqueio] : [])];
  for (const s of subfluxos) {
    if (s.estado === "Dependente de homologação da AC" && !bloqueios.some((b) => b.origem === "ac")) {
      bloqueios.push({ titulo: `${s.nome} indisponível`, regra: "Capability precisa ser homologada pela AC.", origem: "ac" });
    }
  }

  return {
    etapas: ativas.map((e) => ({
      marco: MARCOS.find((m) => m.id === e.marco)?.nome ?? e.marco,
      nome: e.nome,
      papel: e.papel,
      sla: e.slaHoras,
      portao: e.portao ? e.portao.exige : null,
      origem: e.origem,
    })),
    tarefas: [...tarefas.entries()].map(([papel, quantidade]) => ({ papel, quantidade })),
    portoes: ativas.filter((e) => e.portao).map((e) => ({ etapa: e.nome, exige: e.portao!.exige, autorizador: e.portao!.autorizador })),
    notificacoes: ativas
      .filter((e) => e.canais.length > 0 && (e.avisarPapel || e.avisarCliente))
      .map((e) => ({
        etapa: e.nome,
        canais: e.canais.join(", "),
        alvo: [e.avisarPapel ? e.papel : null, e.avisarCliente ? "Titular" : null].filter(Boolean).join(" + "),
      })),
    bloqueios,
    subfluxos,
    regraEfetiva: bloqueios[0]
      ? { regra: bloqueios[0].regra, origem: bloqueios[0].origem }
      : { regra: `Perfil ${perfil.escopo.alvo} aplicado sem exceções.`, origem: perfil.escopo.tipo === "tenant" ? "tenant" : (perfil.escopo.tipo as OrigemRegra) },
    proximaAcao: cenario.proximaAcao,
  };
}
