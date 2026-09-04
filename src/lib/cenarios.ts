// Casos demonstrativos do novo modelo (caso → emissões independentes).
// Cada cenário traz um Request próprio + sobreposições determinísticas de
// emissões, dossiê, prontidão e tarefa de fila, para que o protótipo possa ser
// percorrido de ponta a ponta sem depender de dados aleatórios.
import type { Appointment, CertType, ChecklistItem, Request, TimelineEvent } from "@/lib/mock-data";
import type { DetalheProntidao, Dossie, EmissaoCaso, TrilhaCaso } from "@/lib/caso-model";
import type { PerfilId, TipoPendencia } from "@/lib/operacao-model";
import type { CicloEmissao, RegistroEmissao } from "@/lib/emissao-model";

const hoje = new Date();

function dia(n: number) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function ck(items: [string, boolean][]): ChecklistItem[] {
  return items.map(([label, done], i) => ({ id: `dck${i}`, label, done }));
}

function ev(id: string, quando: string, autor: string, titulo: string, tipo: TimelineEvent["tipo"], detalhe?: string): TimelineEvent {
  return { id, quando, autor, titulo, tipo, ...(detalhe ? { detalhe } : {}) };
}

export interface TarefaCenario {
  acao: string;
  papel: PerfilId;
  tipo: TipoPendencia;
  motivo: string;
  aguardando: string;
  proximoResponsavel: string;
}

export interface Cenario {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  observar: string[];
  request: Request;
  emissoes: EmissaoCaso[];
  prontidao?: Partial<Record<TrilhaCaso, Partial<DetalheProntidao>>>;
  dossie?: Partial<Dossie>;
  tarefa?: TarefaCenario;
  proximaAcao?: string;
  bloqueio?: string;
  /** Bloqueio absoluto: nenhuma exceção comercial libera o caso. */
  bloqueioAbsoluto?: string;
  visibilidadeRestrita?: string;
  evidencias?: { id: string; quando: string; por: string; texto: string }[];
  agendamentos?: Appointment[];
  /** Registros de emissão manual já existentes (carregados no estado inicial). */
  registros?: RegistroEmissao[];
}

const semRevogacao = { estado: "na" as const, detalhe: "Sem pedido de revogação" };

// --------------------------------------------------------------- 1. direto

const c1: Cenario = {
  id: "d1",
  slug: "fluxo-direto",
  titulo: "1 · Fluxo direto",
  resumo: "Pagamento confirmado, validação concluída e aprovação direta na mesma janela de atendimento.",
  observar: [
    "Todas as frentes de prontidão em verde, sem exceções aplicadas",
    "Emissão única com pagamento próprio confirmado",
    "Histórico mostra aprovação direta com justificativa",
  ],
  request: {
    id: "d1",
    protocolo: "DEMO-9001",
    clienteId: "c2",
    cliente: "Ana Beatriz Cardoso",
    documento: "342.118.907-30",
    tipo: "e-CPF A1",
    valor: 159,
    stage: "concluido",
    responsavelId: "a1",
    canal: "Site",
    prioridade: "normal",
    abertoEm: dia(-2),
    slaHoras: 24,
    slaRestanteHoras: 14,
    tags: ["demonstração", "fluxo direto"],
    checklist: ck([
      ["Pagamento confirmado", true],
      ["Documentos conferidos", true],
      ["Identificação por videoconferência", true],
      ["Instalação e funcionamento confirmados", true],
    ]),
    timeline: [
      ev("d1t1", dia(-2) + " 09:04", "Sistema", "Pedido criado pelo site", "sistema"),
      ev("d1t2", dia(-2) + " 09:11", "Financeiro", "Pagamento Pix confirmado", "sistema", "R$ 159,00 · conciliado automaticamente"),
      ev("d1t3", dia(-2) + " 10:32", "Marina Duarte", "Validação concluída", "humano", "Videoconferência de 12 min, biometria aprovada"),
      ev("d1t4", dia(-2) + " 10:40", "Marina Duarte", "Aprovação direta", "humano", "Dossiê suficiente, sem nova coleta"),
      ev("d1t5", dia(-2) + " 10:52", "Sistema", "Emissão confirmada e instruções enviadas", "sistema", "Série S-448120 · instruções de acesso enviadas pela AC"),
    ],
  },
  emissoes: [
    {
      id: "d1-e1",
      produto: "e-CPF A1",
      titular: "Ana Beatriz Cardoso",
      papelTitular: "Titular",
      ac: "AC Certus RFB",
      modalidade: "A1 · arquivo",
      condicaoComercial: "Tabela balcão · R$ 159,00",
      valor: 159,
      pagamento: { estado: "concluido", detalhe: "Pix confirmado antes da validação" },
      validacao: "concluido",
      dossie: "concluido",
      emissao: "concluido",
      entrega: "concluido",
      instalacao: "concluido",
      revogacao: semRevogacao,
      principal: true,
    },
  ],
  proximaAcao: "Confirmar instalação e funcionamento",
};

// ------------------------------------------------------ 2. pagamento pendente

const c2: Cenario = {
  id: "d2",
  slug: "pagamento-pendente",
  titulo: "2 · Pagamento pendente",
  resumo: "Atendimento e videoconferência concluídos, mas a aprovação está travada aguardando liberação comercial.",
  observar: [
    "Prontidão de atendimento e regulatória concluídas",
    "Prontidão financeira pendente bloqueia a emissão",
    "Ação “Registrar emissão manual” aparece bloqueada com o motivo",
  ],
  request: {
    id: "d2",
    protocolo: "DEMO-9002",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    documento: "12.884.301/0001-45",
    tipo: "e-CNPJ A1",
    valor: 289,
    stage: "emissao",
    responsavelId: "a5",
    canal: "WhatsApp",
    prioridade: "alta",
    abertoEm: dia(-3),
    slaHoras: 24,
    slaRestanteHoras: 4,
    tags: ["demonstração", "aguardando pagamento"],
    checklist: ck([
      ["Contato inicial registrado", true],
      ["Documentos conferidos", true],
      ["Videoconferência concluída", true],
      ["Boleto compensado", false],
    ]),
    timeline: [
      ev("d2t1", dia(-3) + " 08:15", "Diego Nunes", "Atendimento iniciado", "humano"),
      ev("d2t2", dia(-2) + " 15:00", "Marina Duarte", "Videoconferência concluída", "humano", "Titular identificado, ata arquivada"),
      ev("d2t3", dia(-1) + " 09:00", "Sistema", "Emissão retida", "alerta", "Boleto da própria emissão ainda não compensado"),
    ],
  },
  emissoes: [
    {
      id: "d2-e1",
      produto: "e-CNPJ A1",
      titular: "Construtora Vale Norte LTDA",
      papelTitular: "Representante legal",
      ac: "AC Soluti Multipla",
      modalidade: "A1 · arquivo",
      condicaoComercial: "Faturado · boleto 3 dias",
      valor: 289,
      pagamento: { estado: "pendente", detalhe: "Boleto emitido, aguardando compensação" },
      validacao: "concluido",
      dossie: "concluido",
      emissao: "bloqueado",
      entrega: "na",
      instalacao: "na",
      revogacao: semRevogacao,
      bloqueio: "Pagamento desta emissão não compensado",
      principal: true,
    },
  ],
  prontidao: {
    emissao: {
      estado: "bloqueado",
      concluido: ["Validação concluída", "Dossiê aprovado"],
      falta: ["Compensação do boleto desta emissão"],
    },
    financeira: {
      estado: "pendente",
      falta: ["e-CNPJ A1 · boleto em aberto"],
    },
  },
  tarefa: {
    acao: "Confirmar pagamento",
    papel: "financeiro",
    tipo: "pagamento",
    motivo: "Boleto da emissão ainda não compensado",
    aguardando: "Financeiro aguarda a conciliação bancária",
    proximoResponsavel: "Helena Prado",
  },
  proximaAcao: "Confirmar pagamento",
  bloqueio: "Aprovação bloqueada até a liberação comercial desta emissão",
};

// -------------------------------------------------------- 3. dossiê divergente

const c3: Cenario = {
  id: "d3",
  slug: "dossie-divergente",
  titulo: "3 · Dossiê divergente",
  resumo: "Validação concluída, dossiê enviado e devolvido pela verificadora com motivo estruturado.",
  observar: [
    "Aba Dossiê mostra o item divergente, a versão e a origem",
    "Histórico de devoluções com autor, data e motivo estruturado",
    "“Enviar para verificação” bloqueada até substituir o documento",
  ],
  request: {
    id: "d3",
    protocolo: "DEMO-9003",
    clienteId: "c3",
    cliente: "Clínica Bem Viver ME",
    documento: "29.771.554/0001-08",
    tipo: "e-CNPJ A1",
    valor: 289,
    stage: "documentacao",
    responsavelId: "a3",
    canal: "Parceiro",
    prioridade: "alta",
    abertoEm: dia(-4),
    slaHoras: 48,
    slaRestanteHoras: -6,
    tags: ["demonstração", "devolvido"],
    checklist: ck([
      ["Identificação do representante", true],
      ["Contrato social consolidado", true],
      ["Comprovante de endereço legível", false],
    ]),
    timeline: [
      ev("d3t1", dia(-4) + " 10:00", "Parceiro Cert+", "Caso encaminhado pela contabilidade", "sistema"),
      ev("d3t2", dia(-2) + " 11:20", "Marina Duarte", "Validação concluída", "humano"),
      ev("d3t3", dia(-2) + " 11:35", "Carolina Ito", "Dossiê enviado para verificação", "sistema"),
      ev("d3t4", dia(-1) + " 08:45", "Rafael Bastos", "Dossiê devolvido pela verificadora", "alerta", "Motivo: comprovante de endereço com data superior a 90 dias"),
    ],
  },
  emissoes: [
    {
      id: "d3-e1",
      produto: "e-CNPJ A1",
      titular: "Clínica Bem Viver ME",
      papelTitular: "Representante legal",
      ac: "AC Certus RFB",
      modalidade: "A1 · arquivo",
      condicaoComercial: "Tabela parceiro · R$ 289,00",
      valor: 289,
      pagamento: { estado: "concluido", detalhe: "Pago pela contabilidade parceira" },
      validacao: "concluido",
      dossie: "bloqueado",
      emissao: "bloqueado",
      entrega: "na",
      instalacao: "na",
      revogacao: semRevogacao,
      bloqueio: "Dossiê devolvido pela verificadora",
      principal: true,
    },
  ],
  dossie: {
    montadora: "Carolina Ito",
    verificadora: "Rafael Bastos",
    itens: [
      { id: "d3-i1", nome: "Contrato social consolidado", obrigatorio: true, versao: 2, origem: "Contabilidade parceira", status: "aprovado" },
      { id: "d3-i2", nome: "Documento de identidade do representante", obrigatorio: true, versao: 1, origem: "Portal do cliente", status: "aprovado" },
      { id: "d3-i3", nome: "CPF do representante", obrigatorio: true, versao: 1, origem: "Portal do cliente", status: "aprovado" },
      {
        id: "d3-i4",
        nome: "Comprovante de endereço",
        obrigatorio: true,
        versao: 3,
        origem: "WhatsApp",
        status: "divergente",
        divergencia: "Documento com emissão superior a 90 dias — exigência da política de validação",
      },
      { id: "d3-i5", nome: "Procuração (se aplicável)", obrigatorio: false, versao: 1, origem: "Balcão", status: "aprovado" },
    ],
    devolucoes: [
      { id: "d3-dev1", quando: dia(-1) + " 08:45", por: "Rafael Bastos (verificadora)", motivo: "Comprovante de endereço vencido — reenviar documento com até 90 dias" },
      { id: "d3-dev2", quando: dia(-3) + " 16:10", por: "Rafael Bastos (verificadora)", motivo: "Contrato social sem a última alteração registrada" },
    ],
    segregacaoOk: true,
  },
  tarefa: {
    acao: "Substituir documento divergente",
    papel: "montadora",
    tipo: "documento",
    motivo: "Comprovante de endereço devolvido pela verificadora",
    aguardando: "Montadora aguarda novo arquivo do titular",
    proximoResponsavel: "Carolina Ito",
  },
  proximaAcao: "Abrir montagem de dossiê",
  bloqueio: "1 item obrigatório divergente: Comprovante de endereço",
};

// --------------------------------------------------------- 4. BIRD + produto

const c4: Cenario = {
  id: "d4",
  slug: "bird-mais-produto",
  titulo: "4 · BIRD + produto final",
  resumo: "BIRD ID concluído e gratuito; o e-CNPJ relacionado continua em preparação, com pagamento próprio.",
  observar: [
    "Duas emissões no mesmo caso, com ciclos totalmente separados",
    "O valor zero do BIRD não libera nada na segunda emissão",
    "A segunda emissão espera pagamento e dossiê próprios",
  ],
  request: {
    id: "d4",
    protocolo: "DEMO-9004",
    clienteId: "c4",
    cliente: "Transportes Aurora S/A",
    documento: "08.552.119/0001-77",
    tipo: "e-CNPJ A1",
    valor: 289,
    stage: "documentacao",
    responsavelId: "a3",
    canal: "Telefone",
    prioridade: "normal",
    abertoEm: dia(-2),
    slaHoras: 48,
    slaRestanteHoras: 20,
    tags: ["demonstração", "duas emissões"],
    checklist: ck([
      ["BIRD ID ativado para o titular", true],
      ["Contrato social do e-CNPJ", true],
      ["Pagamento do e-CNPJ", false],
      ["Procuração do responsável técnico", false],
    ]),
    timeline: [
      ev("d4t1", dia(-2) + " 14:10", "Diego Nunes", "Caso aberto com dois produtos", "humano", "BIRD ID cortesia + e-CNPJ A1 faturado"),
      ev("d4t2", dia(-2) + " 15:02", "Sistema", "BIRD ID emitido", "sistema", "Cortesia autorizada · R$ 0,00"),
      ev("d4t3", dia(-1) + " 09:30", "Sistema", "e-CNPJ aguardando pagamento próprio", "alerta", "Cortesia do BIRD não se aplica a esta emissão"),
    ],
  },
  emissoes: [
    {
      id: "d4-e1",
      produto: "BIRD ID (assinatura em nuvem)",
      titular: "Transportes Aurora S/A",
      papelTitular: "Representante legal",
      ac: "AC Certus RFB",
      modalidade: "Nuvem · app autorizador",
      condicaoComercial: "Cortesia vinculada ao contrato · R$ 0,00",
      valor: 0,
      pagamento: { estado: "concluido", detalhe: "Valor zero — cortesia autorizada pela VD" },
      validacao: "concluido",
      dossie: "concluido",
      emissao: "concluido",
      entrega: "concluido",
      instalacao: "concluido",
      revogacao: semRevogacao,
    },
    {
      id: "d4-e2",
      produto: "e-CNPJ A1",
      titular: "Transportes Aurora S/A",
      papelTitular: "Responsável técnico",
      ac: "AC Soluti Multipla",
      modalidade: "A1 · arquivo",
      condicaoComercial: "Proposta comercial em aprovação · R$ 289,00",
      valor: 289,
      pagamento: { estado: "pendente", detalhe: "Pagamento próprio — não herda a cortesia do BIRD" },
      validacao: "pendente",
      dossie: "pendente",
      emissao: "bloqueado",
      entrega: "na",
      instalacao: "na",
      revogacao: { estado: "na", detalhe: "—" },
      bloqueio: "Liberação comercial e dossiê próprios ainda pendentes",
      principal: true,
    },
  ],
  prontidao: {
    comercial: { estado: "pendente", falta: ["Liberação comercial da emissão e-CNPJ A1"] },
    financeira: {
      estado: "pendente",
      concluido: ["BIRD ID · cortesia autorizada"],
      falta: ["e-CNPJ A1 · pagamento próprio pendente"],
    },
  },
  tarefa: {
    acao: "Liberar condição comercial do e-CNPJ",
    papel: "vd",
    tipo: "contato",
    motivo: "Segunda emissão sem condição comercial aprovada",
    aguardando: "Vendas Diretas aguarda aprovação da proposta",
    proximoResponsavel: "Diego Nunes",
  },
  proximaAcao: "Autorizar exceção comercial",
  bloqueio: "e-CNPJ A1 aguarda liberação comercial própria",
};

// ------------------------------------------------------------------ 5. no-show

const c5: Cenario = {
  id: "d5",
  slug: "no-show",
  titulo: "5 · No-show",
  resumo: "Atendimento não realizado; tarefa de reagendamento atribuída à VI.",
  observar: [
    "Agendamento com status no-show na aba Atendimento e agenda",
    "Fila da VI recebe a tarefa de reagendar",
    "Validação continua bloqueada até o novo atendimento",
  ],
  request: {
    id: "d5",
    protocolo: "DEMO-9005",
    clienteId: "c5",
    cliente: "Paulo Sérgio Almeida",
    documento: "877.402.115-90",
    tipo: "e-CPF A3",
    valor: 318,
    stage: "agendamento",
    responsavelId: "a4",
    canal: "Parceiro",
    prioridade: "alta",
    abertoEm: dia(-3),
    slaHoras: 24,
    slaRestanteHoras: -2,
    tags: ["demonstração", "no-show"],
    checklist: ck([
      ["Documentos conferidos", true],
      ["Pagamento confirmado", true],
      ["Titular presente na videoconferência", false],
    ]),
    timeline: [
      ev("d5t1", dia(-3) + " 10:00", "Sistema", "Videoconferência agendada", "sistema", dia(-1) + " às 15:00"),
      ev("d5t2", dia(-1) + " 15:15", "Marina Duarte", "No-show registrado", "alerta", "Titular ausente após 15 min de tolerância"),
      ev("d5t3", dia(-1) + " 15:16", "Sistema", "Tarefa de reagendamento criada para a VI", "sistema"),
    ],
  },
  emissoes: [
    {
      id: "d5-e1",
      produto: "e-CPF A3",
      titular: "Paulo Sérgio Almeida",
      papelTitular: "Titular",
      ac: "AC Serasa RFB",
      modalidade: "A3 · token/cartão",
      condicaoComercial: "Tabela parceiro · R$ 318,00",
      valor: 318,
      pagamento: { estado: "concluido", detalhe: "Cartão aprovado na abertura" },
      validacao: "bloqueado",
      dossie: "concluido",
      emissao: "bloqueado",
      entrega: "na",
      instalacao: "na",
      revogacao: semRevogacao,
      bloqueio: "Identificação não realizada — titular ausente",
      principal: true,
    },
  ],
  prontidao: {
    atendimento: {
      estado: "bloqueado",
      concluido: ["Agendamento realizado", "Lembrete enviado 24h antes"],
      falta: ["Reagendar a videoconferência com o titular"],
      quemAge: "Vendas Indiretas (VI)",
    },
    regulatoria: { estado: "bloqueado", falta: ["Identificação do titular não realizada (no-show)"] },
  },
  tarefa: {
    acao: "Reagendar videoconferência",
    papel: "vi",
    tipo: "contato",
    motivo: "No-show registrado no atendimento anterior",
    aguardando: "VI aguarda retorno do titular para novo horário",
    proximoResponsavel: "Diego Nunes",
  },
  proximaAcao: "Reagendar",
  bloqueio: "Identificação pendente — titular ausente no horário marcado",
  agendamentos: [
    {
      id: "d5-ag1",
      clienteId: "c5",
      cliente: "Paulo Sérgio Almeida",
      tipo: "e-CPF A3",
      agenteId: "a1",
      dia: dia(-1),
      hora: "15:00",
      duracaoMin: 30,
      sala: "Sala virtual 1",
      status: "no-show",
    },
  ],
};

// ----------------------------------------------------------- 6. falha de envio

const c6: Cenario = {
  id: "d6",
  slug: "falha-de-envio",
  titulo: "6 · Falha de envio",
  resumo: "Certificado emitido, envio automático falhou e existe tarefa de envio manual em aberto.",
  observar: [
    "Emissão concluída convivendo com entrega bloqueada",
    "Tarefa de envio manual na fila do Suporte de entrega",
    "Histórico guarda o código de erro da integração",
  ],
  request: {
    id: "d6",
    protocolo: "DEMO-9006",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    documento: "12.884.301/0001-45",
    tipo: "Nuvem PJ",
    valor: 429,
    stage: "concluido",
    responsavelId: "a2",
    canal: "E-mail",
    prioridade: "alta",
    abertoEm: dia(-5),
    slaHoras: 48,
    slaRestanteHoras: 3,
    tags: ["demonstração", "entrega manual"],
    checklist: ck([
      ["Validação concluída", true],
      ["Certificado emitido", true],
      ["Entrega confirmada pelo titular", false],
    ]),
    timeline: [
      ev("d6t1", dia(-2) + " 11:00", "Marina Duarte", "Certificado emitido", "humano", "Série S-771043"),
      ev("d6t2", dia(-2) + " 11:02", "Sistema", "Falha no envio automático", "alerta", "Integração de e-mail retornou 550 — o endereço do titular recusou a mensagem de instruções"),
      ev("d6t3", dia(-2) + " 11:05", "Sistema", "Tarefa de envio manual criada", "sistema", "Atribuída ao suporte de entrega"),
    ],
  },
  emissoes: [
    {
      id: "d6-e1",
      produto: "Nuvem PJ",
      titular: "Construtora Vale Norte LTDA",
      papelTitular: "Representante legal",
      ac: "AC Certus RFB",
      modalidade: "Nuvem (assinatura remota)",
      condicaoComercial: "Contrato mensal · R$ 429,00",
      valor: 429,
      pagamento: { estado: "concluido", detalhe: "Faturado no contrato mensal" },
      validacao: "concluido",
      dossie: "concluido",
      emissao: "concluido",
      entrega: "bloqueado",
      instalacao: "pendente",
      revogacao: semRevogacao,
      bloqueio: "Envio automático falhou (erro 550) — entrega manual em aberto",
      principal: true,
    },
  ],
  prontidao: {
    entrega: {
      estado: "bloqueado",
      concluido: ["Emissão confirmada na conferência"],
      falta: ["Envio manual do certificado ao titular"],
      quemAge: "Suporte de entrega",
    },
  },
  tarefa: {
    acao: "Executar envio manual",
    papel: "entrega",
    tipo: "entrega",
    motivo: "Falha na integração de envio automático (erro 550)",
    aguardando: "Suporte de entrega aguarda canal alternativo do titular",
    proximoResponsavel: "Rafael Bastos",
  },
  proximaAcao: "Abrir envio manual",
  bloqueio: "Entrega automática falhou — envio manual pendente",
};

// ------------------------------------------------------- 7. revogação posterior

const c7: Cenario = {
  id: "d7",
  slug: "revogacao-posterior",
  titulo: "7 · Revogação posterior",
  resumo: "Caso operacionalmente concluído; a revogação foi aberta depois, sem apagar nem reabrir a conclusão original.",
  observar: [
    "A conclusão original permanece registrada e datada",
    "A revogação aparece como ciclo próprio da emissão",
    "Nenhuma etapa anterior é reaberta artificialmente",
  ],
  request: {
    id: "d7",
    protocolo: "DEMO-9007",
    clienteId: "c4",
    cliente: "Transportes Aurora S/A",
    documento: "08.552.119/0001-77",
    tipo: "e-CNPJ A3",
    valor: 389,
    stage: "concluido",
    responsavelId: "a5",
    canal: "Parceiro",
    prioridade: "normal",
    abertoEm: dia(-30),
    slaHoras: 48,
    slaRestanteHoras: 24,
    tags: ["demonstração", "revogação"],
    checklist: ck([
      ["Validação concluída", true],
      ["Certificado emitido", true],
      ["Entrega confirmada pelo titular", true],
    ]),
    timeline: [
      ev("d7t1", dia(-28) + " 16:20", "Marina Duarte", "Certificado emitido e entregue", "humano", "Série S-330912 · válido por 3 anos"),
      ev("d7t2", dia(-28) + " 16:45", "Cliente", "Funcionamento confirmado pelo titular", "cliente"),
      ev("d7t3", dia(-1) + " 09:10", "Helena Prado", "Pedido de revogação aberto", "alerta", "Desligamento do responsável técnico — solicitação formal da empresa"),
      ev("d7t4", dia(-1) + " 09:12", "Sistema", "Conclusão original preservada", "sistema", "A revogação é um ciclo novo da mesma emissão"),
    ],
  },
  emissoes: [
    {
      id: "d7-e1",
      produto: "e-CNPJ A3",
      titular: "Transportes Aurora S/A",
      papelTitular: "Responsável técnico",
      ac: "AC Serasa RFB",
      modalidade: "A3 · token/cartão",
      condicaoComercial: "Tabela parceiro · R$ 389,00",
      valor: 389,
      pagamento: { estado: "concluido", detalhe: "Pago na abertura" },
      validacao: "concluido",
      dossie: "concluido",
      emissao: "concluido",
      entrega: "concluido",
      instalacao: "concluido",
      revogacao: { estado: "pendente", detalhe: "Pedido aberto em " + dia(-1) + " — aguardando autorização da conformidade" },
      principal: true,
    },
  ],
  prontidao: {
    entrega: { estado: "concluido", concluido: ["Certificado entregue e confirmado pelo titular"], falta: [] },
  },
  tarefa: {
    acao: "Autorizar revogação",
    papel: "financeiro",
    tipo: "conferencia",
    motivo: "Pedido de revogação aberto após a conclusão do caso",
    aguardando: "Conformidade aguarda validação do solicitante",
    proximoResponsavel: "Helena Prado",
  },
  proximaAcao: "Autorizar revogação",
  bloqueio: "Revogação em análise — conclusão original mantida",
};

// ---------------------------------------------------------- 8. suspeita de fraude

const c8: Cenario = {
  id: "d8",
  slug: "suspeita-de-fraude",
  titulo: "8 · Suspeita de fraude",
  resumo: "Emissão bloqueada, visibilidade restrita, evidências registradas — nenhuma exceção comercial libera o caso.",
  observar: [
    "Bloqueio absoluto: a exceção comercial aparece indisponível",
    "Visibilidade restrita à conformidade, com aviso explícito",
    "Evidências registradas com autor, horário e descrição",
  ],
  request: {
    id: "d8",
    protocolo: "DEMO-9008",
    clienteId: "c3",
    cliente: "Clínica Bem Viver ME",
    documento: "29.771.554/0001-08",
    tipo: "e-CNPJ A1",
    valor: 289,
    stage: "bloqueado",
    responsavelId: "a5",
    canal: "Site",
    prioridade: "critica",
    abertoEm: dia(-2),
    slaHoras: 24,
    slaRestanteHoras: -18,
    tags: ["demonstração", "conformidade"],
    checklist: ck([
      ["Documentos recebidos", true],
      ["Conferência antifraude aprovada", false],
      ["Parecer da conformidade", false],
    ]),
    timeline: [
      ev("d8t1", dia(-2) + " 13:40", "Sistema", "Divergência biométrica detectada", "alerta", "Score de similaridade 0,42 — abaixo do mínimo de 0,80"),
      ev("d8t2", dia(-2) + " 14:05", "Helena Prado", "Suspeita de fraude escalada", "alerta", "Caso congelado e visibilidade restrita à conformidade"),
      ev("d8t3", dia(-1) + " 10:00", "Helena Prado", "Exceção comercial recusada pelo sistema", "alerta", "Bloqueio de conformidade não pode ser superado por alçada comercial"),
    ],
  },
  emissoes: [
    {
      id: "d8-e1",
      produto: "e-CNPJ A1",
      titular: "Clínica Bem Viver ME",
      papelTitular: "Representante legal",
      ac: "AC Certus RFB",
      modalidade: "A1 · arquivo",
      condicaoComercial: "Tabela balcão · R$ 289,00",
      valor: 289,
      pagamento: { estado: "bloqueado", detalhe: "Cobrança suspensa durante a apuração" },
      validacao: "bloqueado",
      dossie: "bloqueado",
      emissao: "bloqueado",
      entrega: "na",
      instalacao: "na",
      revogacao: { estado: "na", detalhe: "Nenhum certificado emitido" },
      bloqueio: "Emissão congelada por suspeita de fraude",
      principal: true,
    },
  ],
  prontidao: {
    comercial: {
      estado: "bloqueado",
      falta: ["Bloqueio de conformidade — exceção comercial indisponível"],
      regra: "Bloqueios de conformidade não podem ser superados por alçada comercial.",
      regraObrigatoria: true,
    },
    regulatoria: { estado: "bloqueado", falta: ["Apuração de fraude em andamento"] },
    emissao: { estado: "bloqueado", falta: ["Caso congelado pela conformidade"] },
  },
  tarefa: {
    acao: "Concluir apuração de fraude",
    papel: "financeiro",
    tipo: "conferencia",
    motivo: "Divergência biométrica com score 0,42",
    aguardando: "Conformidade aguarda parecer da apuração",
    proximoResponsavel: "Helena Prado",
  },
  proximaAcao: "Concluir apuração de fraude",
  bloqueioAbsoluto:
    "Caso congelado por suspeita de fraude. Nenhuma exceção comercial, desconto ou alçada libera a emissão — só o parecer da conformidade.",
  visibilidadeRestrita: "Visível apenas para Conformidade e Direção. Demais perfis veem apenas o número do caso.",
  evidencias: [
    { id: "d8-ev1", quando: dia(-2) + " 13:40", por: "Motor antifraude", texto: "Selfie e documento com score de similaridade 0,42 (mínimo 0,80)." },
    { id: "d8-ev2", quando: dia(-2) + " 13:55", por: "Helena Prado", texto: "Contrato social apresenta assinatura divergente da base pública." },
    { id: "d8-ev3", quando: dia(-1) + " 10:00", por: "Sistema", texto: "Tentativa de exceção comercial registrada e recusada automaticamente." },
  ],
};


// --------------------------------- 9 a 15 · ciclo da emissão ponto a ponto

interface DemoInput {
  n: number;
  slug: string;
  titulo: string;
  resumo: string;
  observar: string[];
  clienteId: string;
  cliente: string;
  documento: string;
  produto: CertType;
  valor: number;
  responsavelId: string;
  ciclo: CicloEmissao;
  proximaAcao: string;
  bloqueio?: string;
  registro?: Partial<RegistroEmissao>;
  tarefa: TarefaCenario;
  historico: [string, string, string, TimelineEvent["tipo"], string][];
  extra?: EmissaoCaso[];
}

const autor = (id: string, nome: string, h: string) => ({ id, nome, quando: dia(-1) + " " + h });

function demo(d: DemoInput): Cenario {
  const id = `d${d.n}`;
  const emissaoId = `${id}-e1`;
  const entregue = ["entregue", "instalacao-confirmada", "em-uso"].includes(d.ciclo);
  const confirmada = entregue || ["emitida-confirmada", "entrega-pendente"].includes(d.ciclo);
  const emissao: EmissaoCaso = {
    id: emissaoId,
    produto: d.produto,
    titular: d.cliente,
    papelTitular: d.produto.includes("CNPJ") || d.produto.includes("PJ") ? "Representante legal" : "Titular",
    ac: "AC Certus RFB",
    modalidade: d.produto.endsWith("A3") ? "A3 · mídia criptográfica" : "A1 · arquivo",
    condicaoComercial: `Tabela balcão · ${d.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    valor: d.valor,
    pagamento: { estado: "concluido", detalhe: "Pagamento próprio desta emissão confirmado" },
    validacao: "concluido",
    dossie: "concluido",
    emissao: confirmada ? "concluido" : "pendente",
    entrega: d.ciclo === "em-uso" ? "concluido" : entregue ? "pronto" : "pendente",
    instalacao: d.ciclo === "em-uso" ? "concluido" : "pendente",
    revogacao: semRevogacao,
    ciclo: d.ciclo,
    principal: true,
    ...(d.bloqueio ? { bloqueio: d.bloqueio } : {}),
  };
  const registro: RegistroEmissao | undefined = d.registro
    ? ({
        emissaoId,
        requestId: id,
        resultado: "emitida",
        ac: "AC Certus RFB",
        protocoloExterno: `AC-${9000 + d.n}`,
        numeroSerie: `S-90${d.n}442`,
        dataEmissao: dia(-1),
        validade: dia(365),
        comprovante: `comprovante-emissao-${id}.pdf`,
        registradoPor: autor("a1", "Marina Duarte", "09:20"),
        ...d.registro,
      } as RegistroEmissao)
    : undefined;

  return {
    id,
    slug: d.slug,
    titulo: `${d.n} · ${d.titulo}`,
    resumo: d.resumo,
    observar: d.observar,
    request: {
      id,
      protocolo: `DEMO-90${d.n}`,
      clienteId: d.clienteId,
      cliente: d.cliente,
      documento: d.documento,
      tipo: d.produto,
      valor: d.valor,
      stage: "emissao",
      responsavelId: d.responsavelId,
      canal: "Telefone",
      prioridade: "normal",
      abertoEm: dia(-4),
      slaHoras: 48,
      slaRestanteHoras: 9,
      tags: ["demonstração", "ciclo da emissão"],
      checklist: ck([
        ["Pagamento confirmado", true],
        ["Documentos conferidos", true],
        ["Identificação concluída", true],
        ["Instalação e funcionamento confirmados", d.ciclo === "em-uso"],
      ]),
      timeline: d.historico.map(([tid, quando, a, tipo, detalhe]) =>
        ev(`${id}${tid}`, dia(-1) + " " + quando, a, detalhe.split(" — ")[0]!, tipo, detalhe),
      ),
    },
    emissoes: [emissao, ...(d.extra ?? [])],
    tarefa: d.tarefa,
    proximaAcao: d.proximaAcao,
    ...(d.bloqueio ? { bloqueio: d.bloqueio } : {}),
    ...(registro ? { registros: [registro] } : {}),
  };
}

const c9 = demo({
  n: 9,
  slug: "aguardando-conferencia",
  titulo: "Emissão manual aguardando conferência",
  resumo: "Registro feito no portal da AC e salvo para conferência. A entrega continua bloqueada.",
  observar: [
    "Estado da emissão: Aguardando conferência",
    "Quem registrou não consegue confirmar — troque o operador no topo da aba Emissões",
    "Nenhuma ação de entrega fica disponível",
  ],
  clienteId: "c2",
  cliente: "Ana Beatriz Cardoso",
  documento: "342.118.907-30",
  produto: "e-CPF A1",
  valor: 159,
  responsavelId: "a1",
  ciclo: "aguardando-conferencia",
  proximaAcao: "Conferir emissão manual",
  bloqueio: "Emissão aguardando conferência de um segundo operador",
  registro: {},
  tarefa: {
    acao: "Conferir emissão manual",
    papel: "verificadora",
    tipo: "conferencia",
    motivo: "Registro manual pendente de conferência independente",
    aguardando: "Segundo operador precisa conferir os dados e o comprovante",
    proximoResponsavel: "Carolina Ito",
  },
  historico: [["t1", "09:20", "Marina Duarte", "humano", "Emissão manual registrada — protocolo AC-9009, série S-909442, aguardando conferência"]],
});

const c10 = demo({
  n: 10,
  slug: "emissao-devolvida",
  titulo: "Emissão devolvida pelo segundo operador",
  resumo: "A conferência apontou divergência entre o número de série e o comprovante e devolveu o registro.",
  observar: [
    "Motivo da devolução visível no registro e na trilha",
    "Entrega continua bloqueada",
    "Quem registrou precisa corrigir e registrar de novo",
  ],
  clienteId: "c1",
  cliente: "Construtora Vale Norte LTDA",
  documento: "12.884.301/0001-45",
  produto: "e-CNPJ A1",
  valor: 289,
  responsavelId: "a1",
  ciclo: "devolvida",
  proximaAcao: "Registrar emissão manual",
  bloqueio: "Registro devolvido na conferência — corrigir série e comprovante",
  registro: {
    conferencia: {
      decisao: "devolvida",
      motivo: "Série informada não confere com o comprovante anexado.",
      por: autor("a3", "Carolina Ito", "10:05"),
    },
  },
  tarefa: {
    acao: "Corrigir e registrar novamente",
    papel: "agr",
    tipo: "conferencia",
    motivo: "Série divergente do comprovante",
    aguardando: "Agente de registro precisa refazer o registro",
    proximoResponsavel: "Marina Duarte",
  },
  historico: [
    ["t1", "09:20", "Marina Duarte", "humano", "Emissão manual registrada — série S-9010442"],
    ["t2", "10:05", "Carolina Ito", "alerta", "Emissão devolvida na conferência — série não confere com o comprovante"],
  ],
});

const c11 = demo({
  n: 11,
  slug: "entrega-pela-ac",
  titulo: "AC responsável pelo envio",
  resumo: "Emissão confirmada e entrega definida como responsabilidade da AC, que comunica o titular pelos canais dela.",
  observar: [
    "Forma de entrega registrada: a AC enviará as instruções",
    "A AR acompanha a confirmação, sem transportar o certificado",
    "Instalação ainda não confirmada",
  ],
  clienteId: "c4",
  cliente: "Transportes Aurora S/A",
  documento: "08.552.119/0001-77",
  produto: "Nuvem PJ",
  valor: 429,
  responsavelId: "a2",
  ciclo: "entrega-pendente",
  proximaAcao: "Confirmar instalação e funcionamento",
  registro: {
    conferencia: { decisao: "confirmada", por: autor("a3", "Carolina Ito", "10:10") },
    entrega: { modo: "ac-envia", referencia: "AC-ENV-3391", por: autor("a2", "Rafael Bastos", "10:20") },
  },
  tarefa: {
    acao: "Acompanhar comunicação da AC",
    papel: "entrega",
    tipo: "entrega",
    motivo: "AC assumiu o envio das instruções ao titular",
    aguardando: "Titular precisa acessar as instruções enviadas pela AC",
    proximoResponsavel: "Rafael Bastos",
  },
  historico: [
    ["t1", "09:20", "Marina Duarte", "humano", "Emissão manual registrada — protocolo AC-9011"],
    ["t2", "10:10", "Carolina Ito", "humano", "Emissão conferida e confirmada — entrega liberada"],
    ["t3", "10:20", "Rafael Bastos", "humano", "Entrega definida — a AC enviará as instruções ao titular"],
  ],
});

const c12 = demo({
  n: 12,
  slug: "entrega-link-certus",
  titulo: "Instruções por link seguro da Certus",
  resumo: "Entrega pelo canal homologado da Certus: apenas instruções e link seguro, nunca o arquivo do certificado.",
  observar: [
    "Forma de entrega: Certus envia instruções e link seguro aprovado",
    "Nenhum campo pede senha, PIN ou arquivo do certificado",
    "Entrega registrada, instalação pendente",
  ],
  clienteId: "c3",
  cliente: "Mercado Ponto Certo ME",
  documento: "27.441.882/0001-02",
  produto: "e-CNPJ A1",
  valor: 289,
  responsavelId: "a2",
  ciclo: "entrega-pendente",
  proximaAcao: "Confirmar entrega ao titular",
  registro: {
    conferencia: { decisao: "confirmada", por: autor("a3", "Carolina Ito", "11:02") },
    entrega: { modo: "certus-link", referencia: "ENV-2026-4471", por: autor("a2", "Rafael Bastos", "11:14") },
  },
  tarefa: {
    acao: "Confirmar recebimento com o titular",
    papel: "entrega",
    tipo: "entrega",
    motivo: "Link seguro enviado, sem confirmação de acesso",
    aguardando: "Titular precisa acessar o link e confirmar",
    proximoResponsavel: "Rafael Bastos",
  },
  historico: [
    ["t1", "09:20", "Marina Duarte", "humano", "Emissão manual registrada — protocolo AC-9012"],
    ["t2", "11:02", "Carolina Ito", "humano", "Emissão conferida e confirmada"],
    ["t3", "11:14", "Rafael Bastos", "humano", "Instruções e link seguro enviados pelo canal Certus"],
  ],
});

const c13 = demo({
  n: 13,
  slug: "falha-envio-tarefa-manual",
  titulo: "Falha de envio com tarefa manual",
  resumo: "O disparo no portal da AC falhou e a operação abriu tarefa manual de reenvio para o suporte.",
  observar: [
    "Falha registrada dentro do ciclo da emissão",
    "Emissão segue confirmada; apenas a entrega está pendente",
    "Tarefa manual visível na fila do Suporte de entrega",
  ],
  clienteId: "c1",
  cliente: "Construtora Vale Norte LTDA",
  documento: "12.884.301/0001-45",
  produto: "e-CNPJ A3",
  valor: 389,
  responsavelId: "a2",
  ciclo: "entrega-pendente",
  proximaAcao: "Confirmar entrega ao titular",
  bloqueio: "Disparo de instruções falhou — reenvio manual pendente",
  registro: {
    conferencia: { decisao: "confirmada", por: autor("a3", "Carolina Ito", "08:40") },
    entrega: {
      modo: "portal-ac-manual",
      referencia: "AC-DISP-7712",
      por: autor("a2", "Rafael Bastos", "08:55"),
      falha: "Portal da AC retornou erro 550 no disparo das instruções.",
    },
  },
  tarefa: {
    acao: "Reenviar instruções manualmente",
    papel: "entrega",
    tipo: "entrega",
    motivo: "Erro 550 no disparo do portal da AC",
    aguardando: "Suporte precisa de canal alternativo do titular",
    proximoResponsavel: "Rafael Bastos",
  },
  historico: [
    ["t1", "08:20", "Marina Duarte", "humano", "Emissão manual registrada — protocolo AC-9013"],
    ["t2", "08:40", "Carolina Ito", "humano", "Emissão conferida e confirmada"],
    ["t3", "08:55", "Sistema", "alerta", "Falha no disparo das instruções — erro 550 no portal da AC"],
  ],
});

const c14 = demo({
  n: 14,
  slug: "emitido-nao-instalado",
  titulo: "Emitido, entregue e ainda não instalado",
  resumo: "O titular recebeu as instruções, mas ainda não confirmou instalação e funcionamento. O caso não conclui.",
  observar: [
    "Estado da emissão: Entregue",
    "Caso permanece aberto — conclusão exige todas as emissões em uso",
    "Ação disponível: confirmar instalação e funcionamento",
  ],
  clienteId: "c2",
  cliente: "Ana Beatriz Cardoso",
  documento: "342.118.907-30",
  produto: "e-CPF A1",
  valor: 159,
  responsavelId: "a2",
  ciclo: "entregue",
  proximaAcao: "Confirmar instalação e funcionamento",
  registro: {
    conferencia: { decisao: "confirmada", por: autor("a3", "Carolina Ito", "14:05") },
    entrega: { modo: "certus-link", referencia: "ENV-2026-4480", por: autor("a2", "Rafael Bastos", "14:20") },
    entregue: autor("a2", "Rafael Bastos", "15:02"),
  },
  tarefa: {
    acao: "Confirmar instalação e funcionamento",
    papel: "entrega",
    tipo: "entrega",
    motivo: "Titular ainda não fez o teste de assinatura",
    aguardando: "Suporte aguarda janela do titular para o teste",
    proximoResponsavel: "Rafael Bastos",
  },
  historico: [
    ["t1", "13:40", "Marina Duarte", "humano", "Emissão manual registrada — protocolo AC-9014"],
    ["t2", "14:05", "Carolina Ito", "humano", "Emissão conferida e confirmada"],
    ["t3", "15:02", "Rafael Bastos", "humano", "Entrega confirmada — instruções acessadas pelo titular"],
  ],
});

const c15 = demo({
  n: 15,
  slug: "duas-emissoes-estados-diferentes",
  titulo: "Duas emissões no mesmo caso em estados diferentes",
  resumo: "A emissão do e-CNPJ já está em uso; a segunda, criada por elegibilidade, está travada no próprio pagamento.",
  observar: [
    "Cada emissão mostra o próprio ciclo, pagamento e bloqueio",
    "O caso não conclui enquanto a segunda emissão não estiver em uso",
    "Nada do que foi liberado na primeira libera a segunda",
  ],
  clienteId: "c3",
  cliente: "Mercado Ponto Certo ME",
  documento: "27.441.882/0001-02",
  produto: "e-CNPJ A1",
  valor: 289,
  responsavelId: "a1",
  ciclo: "em-uso",
  proximaAcao: "Confirmar pagamento",
  bloqueio: "Segunda emissão parada no próprio pagamento",
  registro: {
    conferencia: { decisao: "confirmada", por: autor("a3", "Carolina Ito", "09:50") },
    entrega: { modo: "ac-envia", referencia: "AC-ENV-3400", por: autor("a2", "Rafael Bastos", "10:00") },
    entregue: autor("a2", "Rafael Bastos", "10:30"),
    instalacao: { ...autor("a2", "Rafael Bastos", "11:00"), observacao: "Assinatura de teste validada com o titular." },
    emUso: autor("a2", "Rafael Bastos", "11:05"),
  },
  tarefa: {
    acao: "Confirmar pagamento da segunda emissão",
    papel: "financeiro",
    tipo: "pagamento",
    motivo: "Boleto da emissão do sócio ainda em aberto",
    aguardando: "Financeiro aguarda compensação",
    proximoResponsavel: "Helena Prado",
  },
  historico: [
    ["t1", "09:20", "Marina Duarte", "humano", "Emissão manual registrada — e-CNPJ A1"],
    ["t2", "09:50", "Carolina Ito", "humano", "Emissão conferida e confirmada"],
    ["t3", "11:05", "Rafael Bastos", "humano", "Certificado em uso pelo titular"],
    ["t4", "11:30", "Helena Prado", "alerta", "Segunda emissão criada por elegibilidade — pagamento próprio em aberto"],
  ],
  extra: [
    {
      id: "d15-e2",
      produto: "e-CPF A1 do sócio",
      titular: "Paulo Ricardo Menezes",
      papelTitular: "Sócio administrador",
      ac: "AC Certus RFB",
      modalidade: "A1 · arquivo",
      condicaoComercial: "Tabela balcão · R$ 159,00",
      valor: 159,
      pagamento: { estado: "pendente", detalhe: "Boleto em aberto — pagamento próprio desta emissão" },
      validacao: "pendente",
      dossie: "pendente",
      emissao: "bloqueado",
      entrega: "na",
      instalacao: "na",
      revogacao: semRevogacao,
      ciclo: "planejada",
      motivoElegibilidade: "Sócio administrador solicitou certificado próprio no mesmo atendimento",
      bloqueio: "Pagamento desta emissão não compensado",
    },
  ],
});

export const cenarios: Cenario[] = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15];

export const cenarioRegistros = cenarios.flatMap((c) => c.registros ?? []);

export const cenarioRequests: Request[] = cenarios.map((c) => c.request);

export const cenarioAppointments: Appointment[] = cenarios.flatMap((c) => c.agendamentos ?? []);

export function cenarioDe(id: string): Cenario | undefined {
  return cenarios.find((c) => c.id === id || c.request.protocolo === id || c.slug === id);
}
