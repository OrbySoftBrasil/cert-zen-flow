// Dados fictícios do mock da Autoridade Certificadora.
// Nenhum backend: tudo em memória, com estados realistas de operação.

export type StageId =
  | "novo"
  | "documentacao"
  | "validacao"
  | "agendamento"
  | "videoconferencia"
  | "emissao"
  | "concluido"
  | "bloqueado";

export type CertType = "e-CPF A1" | "e-CPF A3" | "e-CNPJ A1" | "e-CNPJ A3" | "Nuvem PJ";
export type Channel = "WhatsApp" | "Site" | "Parceiro" | "Telefone" | "E-mail";
export type Priority = "baixa" | "normal" | "alta" | "critica";

export interface Agent {
  id: string;
  nome: string;
  iniciais: string;
  papel: string;
  emissoes: number;
  tempoMedioMin: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface TimelineEvent {
  id: string;
  quando: string;
  autor: string;
  titulo: string;
  detalhe?: string;
  tipo: "sistema" | "humano" | "cliente" | "alerta";
}

export interface Request {
  id: string;
  protocolo: string;
  clienteId: string;
  cliente: string;
  documento: string;
  tipo: CertType;
  valor: number;
  stage: StageId;
  responsavelId: string;
  canal: Channel;
  prioridade: Priority;
  abertoEm: string;
  slaHoras: number;
  slaRestanteHoras: number;
  tags: string[];
  checklist: ChecklistItem[];
  timeline: TimelineEvent[];
}

export interface Certificate {
  id: string;
  tipo: CertType;
  serie: string;
  emitidoEm: string;
  validoAte: string;
  status: "ativo" | "revogado" | "expirado" | "a vencer";
}

export interface Invoice {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "pago" | "aberto" | "vencido";
  metodo: string;
}

export interface DocumentFile {
  id: string;
  nome: string;
  tipo: string;
  enviadoEm: string;
  status: "aprovado" | "em análise" | "reprovado";
  motivo?: string;
}

export interface Client {
  id: string;
  nome: string;
  documento: string;
  tipoPessoa: "PF" | "PJ";
  email: string;
  telefone: string;
  cidade: string;
  desde: string;
  ltv: number;
  saude: number; // 0-100
  gestor: string;
  certificados: Certificate[];
  faturas: Invoice[];
  documentos: DocumentFile[];
  notas: { id: string; quando: string; autor: string; texto: string }[];
}

export interface Message {
  id: string;
  de: "cliente" | "bot" | "agente";
  autor: string;
  quando: string;
  texto: string;
  lida?: boolean;
  anexo?: { nome: string; tipo: string };
}

export interface Conversation {
  id: string;
  clienteId: string;
  cliente: string;
  canal: Channel;
  status: "bot" | "fila" | "humano" | "resolvido";
  aguardandoMin: number;
  intencao: string;
  sentimento: "positivo" | "neutro" | "frustrado";
  resumo: string;
  proximaAcao: string;
  sugestoes: string[];
  mensagens: Message[];
  naoLidas?: number;
  fixada?: boolean;
  protocolo?: string;
  tags?: string[];
}


export interface Appointment {
  id: string;
  clienteId: string;
  cliente: string;
  tipo: CertType;
  agenteId: string;
  dia: string; // ISO date
  hora: string; // HH:mm
  duracaoMin: number;
  sala: string;
  status: "confirmado" | "pendente" | "no-show" | "concluido" | "remarcado";
}

export const stages: { id: StageId; nome: string; descricao: string }[] = [
  { id: "novo", nome: "Novo pedido", descricao: "Entrada de solicitações" },
  { id: "documentacao", nome: "Documentação", descricao: "Coleta de documentos" },
  { id: "validacao", nome: "Validação", descricao: "Análise do agente de registro" },
  { id: "agendamento", nome: "Agendamento", descricao: "Marcação da videoconferência" },
  { id: "videoconferencia", nome: "Videoconferência", descricao: "Validação presencial remota" },
  { id: "emissao", nome: "Emissão", descricao: "Geração do certificado" },
  { id: "concluido", nome: "Concluído", descricao: "Entregue ao titular" },
  { id: "bloqueado", nome: "Bloqueado", descricao: "Impedimento operacional" },
];

export const agents: Agent[] = [
  { id: "a1", nome: "Marina Duarte", iniciais: "MD", papel: "Agente de Registro", emissoes: 148, tempoMedioMin: 26 },
  { id: "a2", nome: "Rafael Bastos", iniciais: "RB", papel: "Agente de Registro", emissoes: 121, tempoMedioMin: 31 },
  { id: "a3", nome: "Carolina Ito", iniciais: "CI", papel: "Validação Documental", emissoes: 97, tempoMedioMin: 22 },
  { id: "a4", nome: "Diego Nunes", iniciais: "DN", papel: "Atendimento", emissoes: 64, tempoMedioMin: 38 },
  { id: "a5", nome: "Helena Prado", iniciais: "HP", papel: "Compliance", emissoes: 41, tempoMedioMin: 44 },
];

export function agentById(id: string): Agent {
  return agents.find((a) => a.id === id) ?? (agents[0] as Agent);
}

const hoje = new Date();
function diaOffset(n: number) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const clients: Client[] = [
  {
    id: "c1",
    nome: "Construtora Vale Norte LTDA",
    documento: "12.884.301/0001-45",
    tipoPessoa: "PJ",
    email: "financeiro@valenorte.com.br",
    telefone: "(11) 4002-8922",
    cidade: "São Paulo / SP",
    desde: "2019-03-14",
    ltv: 18420,
    saude: 87,
    gestor: "Marina Duarte",
    certificados: [
      { id: "cert1", tipo: "e-CNPJ A1", serie: "AC-2024-88120", emitidoEm: "2024-08-02", validoAte: diaOffset(21), status: "a vencer" },
      { id: "cert2", tipo: "e-CNPJ A3", serie: "AC-2022-51004", emitidoEm: "2022-07-19", validoAte: "2025-07-19", status: "expirado" },
      { id: "cert3", tipo: "Nuvem PJ", serie: "AC-2025-90311", emitidoEm: "2025-11-05", validoAte: "2026-11-05", status: "ativo" },
    ],
    faturas: [
      { id: "f1", descricao: "Renovação e-CNPJ A1", valor: 289, vencimento: diaOffset(9), status: "aberto", metodo: "Boleto" },
      { id: "f2", descricao: "Emissão Nuvem PJ", valor: 429, vencimento: "2025-11-05", status: "pago", metodo: "Pix" },
      { id: "f3", descricao: "Suporte anual", valor: 180, vencimento: diaOffset(-14), status: "vencido", metodo: "Boleto" },
    ],
    documentos: [
      { id: "d1", nome: "Contrato social consolidado.pdf", tipo: "Constituição", enviadoEm: diaOffset(-3), status: "aprovado" },
      { id: "d2", nome: "RG representante legal.jpg", tipo: "Identificação", enviadoEm: diaOffset(-2), status: "reprovado", motivo: "Imagem com reflexo, dados ilegíveis" },
      { id: "d3", nome: "Comprovante de endereço.pdf", tipo: "Endereço", enviadoEm: diaOffset(-1), status: "em análise" },
    ],
    notas: [
      { id: "n1", quando: diaOffset(-2), autor: "Marina Duarte", texto: "Cliente pediu emissão antes do fechamento fiscal. Prioridade alta." },
    ],
  },
  {
    id: "c2",
    nome: "Ana Beatriz Cardoso",
    documento: "342.118.907-30",
    tipoPessoa: "PF",
    email: "ana.cardoso@email.com",
    telefone: "(21) 99812-4410",
    cidade: "Niterói / RJ",
    desde: "2023-05-02",
    ltv: 640,
    saude: 62,
    gestor: "Rafael Bastos",
    certificados: [
      { id: "cert4", tipo: "e-CPF A1", serie: "AC-2025-77120", emitidoEm: "2025-02-11", validoAte: diaOffset(48), status: "ativo" },
    ],
    faturas: [{ id: "f4", descricao: "e-CPF A1", valor: 159, vencimento: diaOffset(3), status: "aberto", metodo: "Pix" }],
    documentos: [
      { id: "d4", nome: "CNH digital.pdf", tipo: "Identificação", enviadoEm: diaOffset(-1), status: "em análise" },
    ],
    notas: [{ id: "n2", quando: diaOffset(-1), autor: "Diego Nunes", texto: "Já teve no-show em agendamento anterior." }],
  },
  {
    id: "c3",
    nome: "Clínica Bem Viver ME",
    documento: "29.771.554/0001-08",
    tipoPessoa: "PJ",
    email: "contato@bemviver.med.br",
    telefone: "(31) 3322-7788",
    cidade: "Belo Horizonte / MG",
    desde: "2021-09-30",
    ltv: 5230,
    saude: 44,
    gestor: "Carolina Ito",
    certificados: [
      { id: "cert5", tipo: "e-CNPJ A1", serie: "AC-2024-44190", emitidoEm: "2024-12-18", validoAte: diaOffset(6), status: "a vencer" },
      { id: "cert6", tipo: "e-CPF A3", serie: "AC-2023-31002", emitidoEm: "2023-04-04", validoAte: "2026-04-04", status: "revogado" },
    ],
    faturas: [{ id: "f5", descricao: "Renovação e-CNPJ", valor: 289, vencimento: diaOffset(-6), status: "vencido", metodo: "Boleto" }],
    documentos: [{ id: "d5", nome: "Procuração.pdf", tipo: "Representação", enviadoEm: diaOffset(-5), status: "aprovado" }],
    notas: [{ id: "n3", quando: diaOffset(-6), autor: "Helena Prado", texto: "Revogação registrada a pedido do titular (troca de sócio)." }],
  },
  {
    id: "c4",
    nome: "Transportes Aurora S/A",
    documento: "08.552.119/0001-77",
    tipoPessoa: "PJ",
    email: "ti@aurora.log",
    telefone: "(41) 3555-1200",
    cidade: "Curitiba / PR",
    desde: "2018-01-22",
    ltv: 41120,
    saude: 93,
    gestor: "Marina Duarte",
    certificados: [
      { id: "cert7", tipo: "Nuvem PJ", serie: "AC-2026-10233", emitidoEm: "2026-01-15", validoAte: "2027-01-15", status: "ativo" },
      { id: "cert8", tipo: "e-CNPJ A3", serie: "AC-2024-66120", emitidoEm: "2024-06-11", validoAte: diaOffset(72), status: "ativo" },
    ],
    faturas: [{ id: "f6", descricao: "Contrato corporativo trimestral", valor: 3480, vencimento: diaOffset(18), status: "aberto", metodo: "Transferência" }],
    documentos: [{ id: "d6", nome: "Estatuto social.pdf", tipo: "Constituição", enviadoEm: diaOffset(-30), status: "aprovado" }],
    notas: [{ id: "n4", quando: diaOffset(-10), autor: "Marina Duarte", texto: "Conta corporativa: 26 certificados sob o mesmo contrato." }],
  },
  {
    id: "c5",
    nome: "Paulo Sérgio Almeida",
    documento: "877.402.115-90",
    tipoPessoa: "PF",
    email: "paulosergio@advocacia.adv.br",
    telefone: "(85) 98811-2020",
    cidade: "Fortaleza / CE",
    desde: "2024-11-11",
    ltv: 318,
    saude: 71,
    gestor: "Rafael Bastos",
    certificados: [{ id: "cert9", tipo: "e-CPF A3", serie: "AC-2024-99011", emitidoEm: "2024-11-11", validoAte: diaOffset(88), status: "ativo" }],
    faturas: [{ id: "f7", descricao: "e-CPF A3 + token", valor: 318, vencimento: "2024-11-11", status: "pago", metodo: "Cartão" }],
    documentos: [{ id: "d7", nome: "OAB frente e verso.pdf", tipo: "Identificação", enviadoEm: diaOffset(-20), status: "aprovado" }],
    notas: [],
  },
];

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}

function ck(items: [string, boolean][]): ChecklistItem[] {
  return items.map(([label, done], i) => ({ id: `ck${i}`, label, done }));
}

export const requests: Request[] = [
  {
    id: "r1",
    protocolo: "SOL-20418",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    documento: "12.884.301/0001-45",
    tipo: "e-CNPJ A1",
    valor: 289,
    stage: "validacao",
    responsavelId: "a3",
    canal: "WhatsApp",
    prioridade: "critica",
    abertoEm: diaOffset(-3),
    slaHoras: 24,
    slaRestanteHoras: -5,
    tags: ["renovação", "corporativo"],
    checklist: ck([
      ["Contrato social recebido", true],
      ["Identificação do representante", false],
      ["Comprovante de endereço", false],
      ["Consulta de restrições", true],
    ]),
    timeline: [
      { id: "t1", quando: diaOffset(-3) + " 09:12", autor: "Bot de atendimento", titulo: "Solicitação criada via WhatsApp", tipo: "sistema" },
      { id: "t2", quando: diaOffset(-3) + " 09:20", autor: "Diego Nunes", titulo: "Atendimento assumido", tipo: "humano" },
      { id: "t3", quando: diaOffset(-2) + " 14:03", autor: "Cliente", titulo: "Documentos enviados (3 arquivos)", tipo: "cliente" },
      { id: "t4", quando: diaOffset(-2) + " 16:41", autor: "Carolina Ito", titulo: "RG reprovado", detalhe: "Imagem com reflexo, dados ilegíveis", tipo: "alerta" },
      { id: "t5", quando: diaOffset(-1) + " 08:00", autor: "Sistema", titulo: "SLA de validação estourado", tipo: "alerta" },
    ],
  },
  {
    id: "r2",
    protocolo: "SOL-20422",
    clienteId: "c2",
    cliente: "Ana Beatriz Cardoso",
    documento: "342.118.907-30",
    tipo: "e-CPF A1",
    valor: 159,
    stage: "agendamento",
    responsavelId: "a2",
    canal: "Site",
    prioridade: "normal",
    abertoEm: diaOffset(-1),
    slaHoras: 24,
    slaRestanteHoras: 7,
    tags: ["primeira emissão"],
    checklist: ck([
      ["Documento de identidade validado", true],
      ["Pagamento confirmado", false],
      ["Horário escolhido pelo titular", false],
    ]),
    timeline: [
      { id: "t6", quando: diaOffset(-1) + " 11:40", autor: "Sistema", titulo: "Pedido criado pelo site", tipo: "sistema" },
      { id: "t7", quando: diaOffset(-1) + " 12:02", autor: "Rafael Bastos", titulo: "Documento validado", tipo: "humano" },
    ],
  },
  {
    id: "r3",
    protocolo: "SOL-20430",
    clienteId: "c3",
    cliente: "Clínica Bem Viver ME",
    documento: "29.771.554/0001-08",
    tipo: "e-CNPJ A1",
    valor: 289,
    stage: "bloqueado",
    responsavelId: "a5",
    canal: "Parceiro",
    prioridade: "alta",
    abertoEm: diaOffset(-6),
    slaHoras: 48,
    slaRestanteHoras: -32,
    tags: ["inadimplente", "renovação"],
    checklist: ck([
      ["Fatura em aberto regularizada", false],
      ["Procuração válida", true],
      ["Consulta de restrições", true],
    ]),
    timeline: [
      { id: "t8", quando: diaOffset(-6) + " 10:00", autor: "Parceiro Cert+", titulo: "Solicitação encaminhada", tipo: "sistema" },
      { id: "t9", quando: diaOffset(-5) + " 09:15", autor: "Financeiro", titulo: "Bloqueio por inadimplência", detalhe: "Fatura F5 vencida há 6 dias", tipo: "alerta" },
    ],
  },
  {
    id: "r4",
    protocolo: "SOL-20441",
    clienteId: "c4",
    cliente: "Transportes Aurora S/A",
    documento: "08.552.119/0001-77",
    tipo: "Nuvem PJ",
    valor: 429,
    stage: "videoconferencia",
    responsavelId: "a1",
    canal: "Telefone",
    prioridade: "alta",
    abertoEm: diaOffset(-2),
    slaHoras: 24,
    slaRestanteHoras: 3,
    tags: ["corporativo", "lote"],
    checklist: ck([
      ["Documentos aprovados", true],
      ["Videoconferência agendada", true],
      ["Titular confirmou presença", true],
      ["Biometria capturada", false],
    ]),
    timeline: [
      { id: "t10", quando: diaOffset(-2) + " 15:20", autor: "Marina Duarte", titulo: "Solicitação criada em lote (12 titulares)", tipo: "humano" },
      { id: "t11", quando: diaOffset(-1) + " 09:45", autor: "Sistema", titulo: "Videoconferência confirmada", tipo: "sistema" },
    ],
  },
  {
    id: "r5",
    protocolo: "SOL-20449",
    clienteId: "c5",
    cliente: "Paulo Sérgio Almeida",
    documento: "877.402.115-90",
    tipo: "e-CPF A3",
    valor: 318,
    stage: "emissao",
    responsavelId: "a2",
    canal: "Site",
    prioridade: "normal",
    abertoEm: diaOffset(-1),
    slaHoras: 12,
    slaRestanteHoras: 2,
    tags: ["token"],
    checklist: ck([
      ["Validação presencial concluída", true],
      ["Mídia criptográfica vinculada", true],
      ["Termo de titularidade assinado", false],
    ]),
    timeline: [
      { id: "t12", quando: diaOffset(-1) + " 08:31", autor: "Sistema", titulo: "Validação concluída", tipo: "sistema" },
    ],
  },
  {
    id: "r6",
    protocolo: "SOL-20455",
    clienteId: "c2",
    cliente: "Ana Beatriz Cardoso",
    documento: "342.118.907-30",
    tipo: "e-CPF A1",
    valor: 159,
    stage: "novo",
    responsavelId: "a4",
    canal: "WhatsApp",
    prioridade: "baixa",
    abertoEm: diaOffset(0),
    slaHoras: 8,
    slaRestanteHoras: 6,
    tags: ["reemissão"],
    checklist: ck([
      ["Identificar titular", true],
      ["Confirmar tipo de certificado", false],
    ]),
    timeline: [{ id: "t13", quando: diaOffset(0) + " 08:05", autor: "Bot de atendimento", titulo: "Pedido registrado", tipo: "sistema" }],
  },
  {
    id: "r7",
    protocolo: "SOL-20460",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    documento: "12.884.301/0001-45",
    tipo: "Nuvem PJ",
    valor: 429,
    stage: "documentacao",
    responsavelId: "a3",
    canal: "E-mail",
    prioridade: "normal",
    abertoEm: diaOffset(0),
    slaHoras: 24,
    slaRestanteHoras: 18,
    tags: ["upgrade"],
    checklist: ck([
      ["Solicitar contrato social", true],
      ["Solicitar identificação", false],
      ["Solicitar comprovante", false],
    ]),
    timeline: [{ id: "t14", quando: diaOffset(0) + " 10:22", autor: "Sistema", titulo: "Checklist de documentos enviado", tipo: "sistema" }],
  },
  {
    id: "r8",
    protocolo: "SOL-20401",
    clienteId: "c4",
    cliente: "Transportes Aurora S/A",
    documento: "08.552.119/0001-77",
    tipo: "e-CNPJ A3",
    valor: 389,
    stage: "concluido",
    responsavelId: "a1",
    canal: "Parceiro",
    prioridade: "normal",
    abertoEm: diaOffset(-8),
    slaHoras: 48,
    slaRestanteHoras: 12,
    tags: ["corporativo"],
    checklist: ck([
      ["Documentos aprovados", true],
      ["Validação presencial concluída", true],
      ["Certificado entregue", true],
    ]),
    timeline: [{ id: "t15", quando: diaOffset(-7) + " 17:10", autor: "Marina Duarte", titulo: "Certificado emitido e entregue", tipo: "humano" }],
  },
  {
    id: "r9",
    protocolo: "SOL-20462",
    clienteId: "c5",
    cliente: "Paulo Sérgio Almeida",
    documento: "877.402.115-90",
    tipo: "e-CPF A1",
    valor: 159,
    stage: "validacao",
    responsavelId: "a3",
    canal: "Site",
    prioridade: "alta",
    abertoEm: diaOffset(0),
    slaHoras: 12,
    slaRestanteHoras: 1,
    tags: ["urgente"],
    checklist: ck([
      ["Documento de identidade validado", true],
      ["Selfie de prova de vida", false],
    ]),
    timeline: [{ id: "t16", quando: diaOffset(0) + " 07:50", autor: "Sistema", titulo: "Documentos recebidos", tipo: "sistema" }],
  },
];

export function requestById(id: string) {
  return requests.find((r) => r.id === id || r.protocolo === id);
}

export const conversations: Conversation[] = [
  {
    id: "cv1",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    canal: "WhatsApp",
    status: "fila",
    aguardandoMin: 12,
    intencao: "Renovação de e-CNPJ",
    sentimento: "frustrado",
    protocolo: "SOL-20418",
    fixada: true,
    naoLidas: 2,
    tags: ["Prioridade", "Financeiro pendente"],
    resumo:
      "Cliente reenviou o RG do representante após reprovação e cobra prazo. Certificado vence em 21 dias e há uma fatura de suporte vencida há 14 dias.",
    proximaAcao: "Validar novo documento e liberar agendamento ainda hoje",
    sugestoes: [
      "Recebemos o novo documento e já colocamos na fila de validação prioritária.",
      "Posso reservar um horário de videoconferência para hoje às 16h?",
      "Sobre a fatura em aberto, consigo gerar a 2ª via agora mesmo.",
    ],
    mensagens: [
      { id: "m1", de: "cliente", autor: "Vale Norte", quando: "09:02", texto: "Bom dia, reenviei o RG. Conseguem validar hoje?" },
      {
        id: "m1b",
        de: "cliente",
        autor: "Vale Norte",
        quando: "09:02",
        texto: "Segue o arquivo novo, agora sem reflexo.",
        anexo: { nome: "RG-representante-v2.jpg", tipo: "Imagem · 1,8 MB" },
      },
      { id: "m2", de: "bot", autor: "Assistente AC", quando: "09:03", texto: "Bom dia! Recebi seu arquivo. Vou verificar o status da validação e já retorno.", lida: true },
      { id: "m2b", de: "bot", autor: "Assistente AC", quando: "09:04", texto: "Identifiquei o protocolo SOL-20418 (e-CNPJ A1) em etapa de Documentação.", lida: true },
      { id: "m3", de: "cliente", autor: "Vale Norte", quando: "09:15", texto: "Preciso emitir antes do fechamento fiscal, já está atrasado." },
    ],
  },
  {
    id: "cv2",
    clienteId: "c2",
    cliente: "Ana Beatriz Cardoso",
    canal: "Site",
    status: "bot",
    aguardandoMin: 2,
    intencao: "Agendamento de videoconferência",
    sentimento: "neutro",
    protocolo: "SOL-20422",
    naoLidas: 1,
    tags: ["Aguarda pagamento"],
    resumo: "Titular quer escolher horário para validação presencial remota. Pagamento ainda não confirmado.",
    proximaAcao: "Confirmar pagamento antes de liberar a agenda",
    sugestoes: ["Assim que o pagamento for confirmado, libero os horários disponíveis.", "Prefere manhã ou tarde?"],
    mensagens: [
      { id: "m4", de: "cliente", autor: "Ana", quando: "10:31", texto: "Quero marcar a videochamada" },
      { id: "m5", de: "bot", autor: "Assistente AC", quando: "10:31", texto: "Claro! Identifiquei seu pedido SOL-20422 (e-CPF A1).", lida: true },
      { id: "m5b", de: "bot", autor: "Assistente AC", quando: "10:32", texto: "Antes de liberar a agenda preciso confirmar o pagamento do boleto. Já efetuou?", lida: false },
    ],
  },
  {
    id: "cv3",
    clienteId: "c3",
    cliente: "Clínica Bem Viver ME",
    canal: "E-mail",
    status: "humano",
    aguardandoMin: 0,
    intencao: "Contestação de bloqueio financeiro",
    sentimento: "frustrado",
    protocolo: "SOL-20399",
    tags: ["Escalado"],
    resumo: "Cliente alega pagamento da fatura vencida e pede desbloqueio imediato da renovação.",
    proximaAcao: "Solicitar comprovante e acionar o financeiro",
    sugestoes: ["Pode nos enviar o comprovante? Faço a baixa manual em seguida."],
    mensagens: [
      { id: "m6", de: "cliente", autor: "Bem Viver", quando: "08:44", texto: "Já pagamos ontem, por que continua bloqueado?" },
      { id: "m7", de: "agente", autor: "Helena Prado", quando: "08:50", texto: "Estou verificando com o financeiro agora.", lida: true },
      { id: "m7b", de: "agente", autor: "Helena Prado", quando: "08:58", texto: "Consegue me enviar o comprovante em PDF? Faço a baixa manual e libero a renovação hoje.", lida: false },
    ],
  },
  {
    id: "cv4",
    clienteId: "c4",
    cliente: "Transportes Aurora S/A",
    canal: "WhatsApp",
    status: "resolvido",
    aguardandoMin: 0,
    intencao: "Emissão em lote",
    sentimento: "positivo",
    protocolo: "SOL-20360",
    tags: ["Lote 12 titulares"],
    resumo: "Lote de 12 titulares agendado para amanhã. Cliente confirmou a lista.",
    proximaAcao: "Nenhuma — acompanhar execução do lote",
    sugestoes: [],
    mensagens: [
      { id: "m8a", de: "agente", autor: "Marina Duarte", quando: "Ontem", texto: "Segue a lista final dos 12 titulares para conferência.", lida: true },
      { id: "m8", de: "cliente", autor: "Aurora TI", quando: "Ontem", texto: "Lista confirmada, obrigado!" },
    ],
  },
  {
    id: "cv5",
    clienteId: "c5",
    cliente: "Paulo Sérgio Almeida",
    canal: "WhatsApp",
    status: "fila",
    aguardandoMin: 5,
    intencao: "Instalação do certificado A3",
    sentimento: "neutro",
    protocolo: "SOL-20430",
    naoLidas: 3,
    tags: ["Suporte técnico"],
    resumo: "Titular não consegue instalar o driver do token em Windows 11 e pede suporte guiado.",
    proximaAcao: "Enviar passo a passo de instalação e oferecer acesso remoto",
    sugestoes: [
      "Envio agora o passo a passo de instalação do token para Windows 11.",
      "Prefere que eu abra um acesso remoto de 10 minutos?",
    ],
    mensagens: [
      { id: "m9", de: "cliente", autor: "Paulo", quando: "11:02", texto: "O token não é reconhecido no meu notebook novo." },
      { id: "m10", de: "bot", autor: "Assistente AC", quando: "11:02", texto: "Qual o sistema operacional que você está usando?", lida: true },
      { id: "m11", de: "cliente", autor: "Paulo", quando: "11:04", texto: "Windows 11, instalei o driver do site mas nada." },
    ],
  },
];


export const appointments: Appointment[] = [
  { id: "ag1", clienteId: "c4", cliente: "Transportes Aurora S/A", tipo: "Nuvem PJ", agenteId: "a1", dia: diaOffset(0), hora: "09:00", duracaoMin: 30, sala: "Sala virtual 1", status: "confirmado" },
  { id: "ag2", clienteId: "c2", cliente: "Ana Beatriz Cardoso", tipo: "e-CPF A1", agenteId: "a2", dia: diaOffset(0), hora: "10:00", duracaoMin: 30, sala: "Sala virtual 2", status: "pendente" },
  { id: "ag3", clienteId: "c5", cliente: "Paulo Sérgio Almeida", tipo: "e-CPF A3", agenteId: "a2", dia: diaOffset(0), hora: "11:30", duracaoMin: 30, sala: "Sala virtual 2", status: "concluido" },
  { id: "ag4", clienteId: "c1", cliente: "Construtora Vale Norte LTDA", tipo: "e-CNPJ A1", agenteId: "a1", dia: diaOffset(0), hora: "14:00", duracaoMin: 45, sala: "Sala virtual 1", status: "pendente" },
  { id: "ag5", clienteId: "c3", cliente: "Clínica Bem Viver ME", tipo: "e-CNPJ A1", agenteId: "a3", dia: diaOffset(0), hora: "15:00", duracaoMin: 30, sala: "Sala virtual 3", status: "no-show" },
  { id: "ag6", clienteId: "c4", cliente: "Transportes Aurora S/A", tipo: "e-CNPJ A3", agenteId: "a1", dia: diaOffset(1), hora: "09:00", duracaoMin: 60, sala: "Sala virtual 1", status: "confirmado" },
  { id: "ag7", clienteId: "c5", cliente: "Paulo Sérgio Almeida", tipo: "e-CPF A1", agenteId: "a3", dia: diaOffset(1), hora: "13:30", duracaoMin: 30, sala: "Sala virtual 3", status: "remarcado" },
  { id: "ag8", clienteId: "c2", cliente: "Ana Beatriz Cardoso", tipo: "e-CPF A1", agenteId: "a2", dia: diaOffset(2), hora: "16:00", duracaoMin: 30, sala: "Sala virtual 2", status: "pendente" },
  { id: "ag9", clienteId: "c1", cliente: "Construtora Vale Norte LTDA", tipo: "e-CNPJ A1", agenteId: "a1", dia: diaOffset(3), hora: "09:00", duracaoMin: 30, sala: "Sala virtual 1", status: "pendente" },
  { id: "ag10", clienteId: "c3", cliente: "Clínica Bem Viver ME", tipo: "e-CNPJ A1", agenteId: "a3", dia: diaOffset(3), hora: "14:00", duracaoMin: 30, sala: "Sala virtual 3", status: "confirmado" },
  { id: "ag11", clienteId: "c5", cliente: "Paulo Sérgio Almeida", tipo: "e-CPF A3", agenteId: "a2", dia: diaOffset(4), hora: "10:00", duracaoMin: 45, sala: "Sala virtual 2", status: "confirmado" },
  { id: "ag12", clienteId: "c4", cliente: "Transportes Aurora S/A", tipo: "e-CNPJ A3", agenteId: "a1", dia: diaOffset(6), hora: "08:00", duracaoMin: 60, sala: "Sala virtual 1", status: "pendente" },
  { id: "ag13", clienteId: "c2", cliente: "Ana Beatriz Cardoso", tipo: "e-CPF A1", agenteId: "a3", dia: diaOffset(7), hora: "11:30", duracaoMin: 30, sala: "Sala virtual 3", status: "pendente" },
  { id: "ag14", clienteId: "c1", cliente: "Construtora Vale Norte LTDA", tipo: "Nuvem PJ", agenteId: "a1", dia: diaOffset(9), hora: "15:00", duracaoMin: 30, sala: "Sala virtual 1", status: "confirmado" },
  { id: "ag15", clienteId: "c5", cliente: "Paulo Sérgio Almeida", tipo: "e-CPF A1", agenteId: "a2", dia: diaOffset(10), hora: "09:00", duracaoMin: 30, sala: "Sala virtual 2", status: "pendente" },
  { id: "ag16", clienteId: "c3", cliente: "Clínica Bem Viver ME", tipo: "e-CNPJ A3", agenteId: "a3", dia: diaOffset(13), hora: "16:00", duracaoMin: 45, sala: "Sala virtual 3", status: "pendente" },
  { id: "ag17", clienteId: "c4", cliente: "Transportes Aurora S/A", tipo: "e-CNPJ A1", agenteId: "a1", dia: diaOffset(14), hora: "10:00", duracaoMin: 30, sala: "Sala virtual 1", status: "confirmado" },
  { id: "ag18", clienteId: "c2", cliente: "Ana Beatriz Cardoso", tipo: "e-CPF A3", agenteId: "a2", dia: diaOffset(17), hora: "13:30", duracaoMin: 30, sala: "Sala virtual 2", status: "pendente" },
  { id: "ag19", clienteId: "c1", cliente: "Construtora Vale Norte LTDA", tipo: "e-CNPJ A1", agenteId: "a3", dia: diaOffset(21), hora: "09:00", duracaoMin: 45, sala: "Sala virtual 3", status: "pendente" },
  { id: "ag20", clienteId: "c5", cliente: "Paulo Sérgio Almeida", tipo: "Nuvem PJ", agenteId: "a1", dia: diaOffset(-2), hora: "14:00", duracaoMin: 30, sala: "Sala virtual 1", status: "concluido" },
  { id: "ag21", clienteId: "c3", cliente: "Clínica Bem Viver ME", tipo: "e-CPF A1", agenteId: "a2", dia: diaOffset(-4), hora: "11:30", duracaoMin: 30, sala: "Sala virtual 2", status: "no-show" },
];

export const receitaSerie = [
  { mes: "Fev", receita: 182400, emissoes: 612 },
  { mes: "Mar", receita: 198100, emissoes: 664 },
  { mes: "Abr", receita: 176900, emissoes: 588 },
  { mes: "Mai", receita: 214300, emissoes: 712 },
  { mes: "Jun", receita: 236800, emissoes: 781 },
  { mes: "Jul", receita: 259400, emissoes: 848 },
];

export const emissoesPorTipo = [
  { tipo: "e-CPF A1", total: 318 },
  { tipo: "e-CPF A3", total: 164 },
  { tipo: "e-CNPJ A1", total: 221 },
  { tipo: "e-CNPJ A3", total: 88 },
  { tipo: "Nuvem PJ", total: 57 },
];

export const renovacoes = [
  { janela: "Vence em 30 dias", quantidade: 214, receita: 62_300 },
  { janela: "Vence em 60 dias", quantidade: 168, receita: 48_900 },
  { janela: "Vence em 90 dias", quantidade: 132, receita: 37_100 },
];

export const auditTrail = [
  { id: "au1", quando: diaOffset(0) + " 08:12", ator: "Helena Prado", acao: "Revogação registrada", alvo: "AC-2023-31002", evidencia: "Termo assinado + vídeo" },
  { id: "au2", quando: diaOffset(0) + " 07:55", ator: "Sistema", acao: "SLA estourado", alvo: "SOL-20418", evidencia: "Log automático" },
  { id: "au3", quando: diaOffset(-1) + " 16:20", ator: "Carolina Ito", acao: "Documento reprovado", alvo: "RG representante legal", evidencia: "Parecer documental" },
  { id: "au4", quando: diaOffset(-1) + " 09:45", ator: "Marina Duarte", acao: "Certificado emitido", alvo: "AC-2026-10233", evidencia: "Videoconferência gravada" },
  { id: "au5", quando: diaOffset(-2) + " 11:02", ator: "Diego Nunes", acao: "Atendimento assumido do bot", alvo: "Conversa CV1", evidencia: "Transcrição" },
];

export const kpis = {
  receitaMes: 259400,
  receitaVar: 9.6,
  mrrRenovacao: 84200,
  mrrVar: 4.1,
  emissoes: 848,
  emissoesVar: 8.6,
  ticketMedio: 306,
  ticketVar: 1.2,
  conversao: 62.4,
  conversaoVar: -2.3,
  noShow: 7.8,
  noShowVar: -1.4,
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ---------------------------------------------------------------------------
// Helpdesk / Chamados
// ---------------------------------------------------------------------------

export type TicketStatus = "aberto" | "em andamento" | "aguardando cliente" | "resolvido" | "fechado";
export type TicketCategoria =
  | "Instalação e uso"
  | "Documentação"
  | "Agendamento"
  | "Financeiro"
  | "Revogação"
  | "Erro no certificado"
  | "Outros";

export interface TicketMessage {
  id: string;
  autor: string;
  papel: "cliente" | "suporte" | "sistema";
  quando: string;
  texto: string;
  anexo?: { nome: string; tipo: string };
}

export interface Ticket {
  id: string;
  numero: string;
  clienteId: string;
  cliente: string;
  contato: string;
  assunto: string;
  categoria: TicketCategoria;
  subcategoria: string;
  canal: Channel;
  prioridade: Priority;
  status: TicketStatus;
  responsavelId: string;
  abertoEm: string;
  atualizadoEm: string;
  slaRestanteHoras: number;
  primeiraRespostaMin?: number;
  satisfacao?: number; // 1-5
  tags: string[];
  mensagens: TicketMessage[];
}

export const ticketCategorias: { nome: TicketCategoria; sub: string[] }[] = [
  { nome: "Instalação e uso", sub: ["Driver do token", "Assinatura em PDF", "Navegador / Java", "Acesso na nuvem"] },
  { nome: "Documentação", sub: ["Documento reprovado", "Reenvio de arquivo", "Procuração"] },
  { nome: "Agendamento", sub: ["Remarcar videoconferência", "Não consegui entrar na sala", "Confirmar horário"] },
  { nome: "Financeiro", sub: ["2ª via de boleto", "Nota fiscal", "Reembolso", "Cobrança indevida"] },
  { nome: "Revogação", sub: ["Perda do token", "Suspeita de comprometimento", "Desligamento do titular"] },
  { nome: "Erro no certificado", sub: ["Dados incorretos", "Certificado não reconhecido", "Expirado antes do prazo"] },
  { nome: "Outros", sub: ["Dúvida geral", "Sugestão", "Reclamação"] },
];

export const tickets: Ticket[] = [
  {
    id: "t1",
    numero: "CH-4821",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    contato: "financeiro@valenorte.com.br",
    assunto: "Certificado A1 não é reconhecido no e-CAC",
    categoria: "Erro no certificado",
    subcategoria: "Certificado não reconhecido",
    canal: "Site",
    prioridade: "alta",
    status: "em andamento",
    responsavelId: "a4",
    abertoEm: diaOffset(-1) + " 09:12",
    atualizadoEm: diaOffset(0) + " 08:40",
    slaRestanteHoras: 3,
    primeiraRespostaMin: 18,
    tags: ["e-CNPJ A1", "e-CAC"],
    mensagens: [
      { id: "tm1", autor: "Cliente", papel: "cliente", quando: diaOffset(-1) + " 09:12", texto: "Instalamos o certificado no computador do escritório e o e-CAC não reconhece. Aparece que nenhum certificado foi encontrado." },
      { id: "tm2", autor: "Sistema", papel: "sistema", quando: diaOffset(-1) + " 09:12", texto: "Chamado classificado automaticamente como Erro no certificado · Prioridade alta." },
      { id: "tm3", autor: "Diego Nunes", papel: "suporte", quando: diaOffset(-1) + " 09:30", texto: "Bom dia! Poderia enviar um print da tela de certificados do navegador? Vamos verificar a cadeia de confiança.", },
      { id: "tm4", autor: "Cliente", papel: "cliente", quando: diaOffset(0) + " 08:40", texto: "Segue o print solicitado.", anexo: { nome: "print-navegador.png", tipo: "PNG" } },
    ],
  },
  {
    id: "t2",
    numero: "CH-4820",
    clienteId: "c3",
    cliente: "Ateliê Marcondes ME",
    contato: "contato@marcondes.com.br",
    assunto: "Preciso remarcar a videoconferência de validação",
    categoria: "Agendamento",
    subcategoria: "Remarcar videoconferência",
    canal: "WhatsApp",
    prioridade: "normal",
    status: "aguardando cliente",
    responsavelId: "a2",
    abertoEm: diaOffset(-2) + " 14:05",
    atualizadoEm: diaOffset(-1) + " 10:22",
    slaRestanteHoras: 11,
    primeiraRespostaMin: 6,
    tags: ["videoconferência"],
    mensagens: [
      { id: "tm5", autor: "Cliente", papel: "cliente", quando: diaOffset(-2) + " 14:05", texto: "Tive um imprevisto e não consigo comparecer amanhã às 10h." },
      { id: "tm6", autor: "Rafael Bastos", papel: "suporte", quando: diaOffset(-2) + " 14:11", texto: "Sem problemas. Tenho horários livres quinta 09h, 11h e 16h. Qual prefere?" },
    ],
  },
  {
    id: "t3",
    numero: "CH-4819",
    clienteId: "c2",
    cliente: "Paula Ferraz Advocacia",
    contato: "paula@ferrazadv.com.br",
    assunto: "Segunda via do boleto de renovação",
    categoria: "Financeiro",
    subcategoria: "2ª via de boleto",
    canal: "E-mail",
    prioridade: "baixa",
    status: "resolvido",
    responsavelId: "a4",
    abertoEm: diaOffset(-4) + " 11:40",
    atualizadoEm: diaOffset(-3) + " 09:05",
    slaRestanteHoras: 22,
    primeiraRespostaMin: 34,
    satisfacao: 5,
    tags: ["boleto"],
    mensagens: [
      { id: "tm7", autor: "Cliente", papel: "cliente", quando: diaOffset(-4) + " 11:40", texto: "O boleto venceu, podem reenviar atualizado?" },
      { id: "tm8", autor: "Diego Nunes", papel: "suporte", quando: diaOffset(-4) + " 12:14", texto: "Boleto atualizado em anexo, vencimento em 3 dias.", anexo: { nome: "boleto-atualizado.pdf", tipo: "PDF" } },
      { id: "tm9", autor: "Cliente", papel: "cliente", quando: diaOffset(-3) + " 09:05", texto: "Pago, obrigada!" },
    ],
  },
  {
    id: "t4",
    numero: "CH-4818",
    clienteId: "c4",
    cliente: "Transportes Iguaçu S/A",
    contato: "ti@iguacu.com.br",
    assunto: "Perda do token — solicitar revogação imediata",
    categoria: "Revogação",
    subcategoria: "Perda do token",
    canal: "Telefone",
    prioridade: "critica",
    status: "aberto",
    responsavelId: "a5",
    abertoEm: diaOffset(0) + " 07:58",
    atualizadoEm: diaOffset(0) + " 07:58",
    slaRestanteHoras: -1,
    tags: ["compliance", "revogação"],
    mensagens: [
      { id: "tm10", autor: "Cliente", papel: "cliente", quando: diaOffset(0) + " 07:58", texto: "O token do diretor foi extraviado em viagem. Precisamos revogar hoje." },
      { id: "tm11", autor: "Sistema", papel: "sistema", quando: diaOffset(0) + " 07:58", texto: "Prioridade crítica aplicada por regra de compliance. Encaminhado para Helena Prado." },
    ],
  },
  {
    id: "t5",
    numero: "CH-4817",
    clienteId: "c5",
    cliente: "Bruno Salgado MEI",
    contato: "bruno.salgado@gmail.com",
    assunto: "Erro ao assinar PDF no Adobe Reader",
    categoria: "Instalação e uso",
    subcategoria: "Assinatura em PDF",
    canal: "Site",
    prioridade: "normal",
    status: "em andamento",
    responsavelId: "a3",
    abertoEm: diaOffset(-1) + " 16:33",
    atualizadoEm: diaOffset(0) + " 09:10",
    slaRestanteHoras: 6,
    primeiraRespostaMin: 12,
    tags: ["A3", "Adobe"],
    mensagens: [
      { id: "tm12", autor: "Cliente", papel: "cliente", quando: diaOffset(-1) + " 16:33", texto: "Ao assinar aparece 'a operação criptográfica falhou'." },
      { id: "tm13", autor: "Carolina Ito", papel: "suporte", quando: diaOffset(-1) + " 16:45", texto: "Vamos reinstalar o driver do token. Enviei o passo a passo por e-mail." },
      { id: "tm14", autor: "Cliente", papel: "cliente", quando: diaOffset(0) + " 09:10", texto: "Reinstalei, mas o erro continua." },
    ],
  },
  {
    id: "t6",
    numero: "CH-4816",
    clienteId: "c1",
    cliente: "Construtora Vale Norte LTDA",
    contato: "financeiro@valenorte.com.br",
    assunto: "Contrato social reprovado — qual o motivo?",
    categoria: "Documentação",
    subcategoria: "Documento reprovado",
    canal: "Site",
    prioridade: "alta",
    status: "aguardando cliente",
    responsavelId: "a3",
    abertoEm: diaOffset(-3) + " 10:02",
    atualizadoEm: diaOffset(-2) + " 15:47",
    slaRestanteHoras: 2,
    primeiraRespostaMin: 21,
    tags: ["documentação"],
    mensagens: [
      { id: "tm15", autor: "Cliente", papel: "cliente", quando: diaOffset(-3) + " 10:02", texto: "Recebemos aviso de reprovação do contrato social." },
      { id: "tm16", autor: "Carolina Ito", papel: "suporte", quando: diaOffset(-3) + " 10:23", texto: "A última alteração contratual não estava registrada na Junta. Pode reenviar a versão registrada?" },
    ],
  },
  {
    id: "t7",
    numero: "CH-4815",
    clienteId: "c2",
    cliente: "Paula Ferraz Advocacia",
    contato: "paula@ferrazadv.com.br",
    assunto: "Sugestão: lembrete de vencimento por WhatsApp",
    categoria: "Outros",
    subcategoria: "Sugestão",
    canal: "Site",
    prioridade: "baixa",
    status: "fechado",
    responsavelId: "a4",
    abertoEm: diaOffset(-8) + " 13:00",
    atualizadoEm: diaOffset(-7) + " 08:30",
    slaRestanteHoras: 40,
    primeiraRespostaMin: 51,
    satisfacao: 4,
    tags: ["produto"],
    mensagens: [
      { id: "tm17", autor: "Cliente", papel: "cliente", quando: diaOffset(-8) + " 13:00", texto: "Seria ótimo receber aviso 30 dias antes do vencimento." },
      { id: "tm18", autor: "Diego Nunes", papel: "suporte", quando: diaOffset(-7) + " 08:30", texto: "Registramos sua sugestão no roadmap. Obrigado!" },
    ],
  },
];

export const ticketStatuses: TicketStatus[] = ["aberto", "em andamento", "aguardando cliente", "resolvido", "fechado"];

export const baseConhecimento = [
  { id: "kb1", titulo: "Como instalar o driver do token A3", categoria: "Instalação e uso", views: 3120 },
  { id: "kb2", titulo: "Certificado não aparece no e-CAC: checklist", categoria: "Erro no certificado", views: 2410 },
  { id: "kb3", titulo: "Documentos aceitos para e-CNPJ", categoria: "Documentação", views: 1980 },
  { id: "kb4", titulo: "Como remarcar sua videoconferência", categoria: "Agendamento", views: 1544 },
  { id: "kb5", titulo: "Emitir 2ª via de boleto e nota fiscal", categoria: "Financeiro", views: 1201 },
];
