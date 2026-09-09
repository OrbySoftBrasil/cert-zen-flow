// Rede de contadores parceiros credenciados — dados fictícios do mock.
import type { CertType, StageId } from "@/lib/mock-data";

export type ContadorStatus = "ativo" | "em credenciamento" | "suspenso" | "inativo";
export type ContadorTier = "Bronze" | "Prata" | "Ouro" | "Diamante";

export interface CarteiraItem {
  id: string;
  clienteId?: string; // vínculo com a base de clientes da AC
  nome: string;
  documento: string;
  tipoPessoa: "PF" | "PJ";
  certificadosAtivos: number;
  proximoVencimento: string;
  ultimaEmissao: string;
  receitaAno: number;
  situacao: "ativo" | "novo" | "em risco" | "inadimplente";
}

export interface PedidoContador {
  id: string;
  protocolo: string;
  cliente: string;
  clienteId?: string;
  tipo: CertType;
  stage: StageId;
  valor: number;
  slaRestanteHoras: number;
  responsavel: string;
  abertoEm: string;
}

export interface ExtratoComissao {
  id: string;
  competencia: string;
  emissoes: number;
  base: number;
  percentual: number;
  valor: number;
  status: "paga" | "aprovada" | "apurada" | "prevista" | "retida";
  pagamento: string;
}

export interface DocCredenciamento {
  id: string;
  nome: string;
  tipo: string;
  validade?: string;
  status: "aprovado" | "em análise" | "vencido" | "pendente";
}

export interface Contador {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  crc: string;
  responsavel: string;
  email: string;
  telefone: string;
  cidade: string;
  status: ContadorStatus;
  tier: ContadorTier;
  desde: string;
  gestor: string;
  comissaoPercentual: number;
  tabelaEspecial: string;
  metaMes: number;
  emissoesMes: number;
  emissoesAno: number;
  receitaMes: number;
  receitaAno: number;
  ticketMedio: number;
  comissaoMes: number;
  comissaoAberta: number;
  comissaoAcumulada: number;
  inadimplencia: number;
  conversao: number;
  nps: number;
  qualidadeDocs: number;
  tempoMedioDias: number;
  churnCarteira: number;
  ultimaAtividade: string;
  observacao: string;
  serie: { mes: string; emissoes: number; receita: number; comissao: number }[];
  carteira: CarteiraItem[];
  pedidos: PedidoContador[];
  extrato: ExtratoComissao[];
  documentos: DocCredenciamento[];
  contatos: { id: string; nome: string; papel: string; email: string; telefone: string }[];
  atividades: {
    id: string;
    quando: string;
    autor: string;
    texto: string;
    tipo: "sistema" | "humano" | "alerta";
  }[];
}

const hoje = new Date();
function dia(n: number) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const meses = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];
function serie(base: number, fator: number) {
  return meses.map((mes, i) => {
    const emissoes = Math.round(base * (0.82 + i * 0.06) * (i === 5 ? 0.55 : 1));
    const receita = Math.round(emissoes * 305 * fator);
    return { mes, emissoes, receita, comissao: Math.round(receita * 0.18) };
  });
}

export const contadores: Contador[] = [
  {
    id: "ct1",
    nome: "Contabilidade Prisma",
    razaoSocial: "Prisma Serviços Contábeis LTDA",
    cnpj: "17.442.908/0001-21",
    crc: "CRC/SP 2SP-031882",
    responsavel: "Sônia Rezende",
    email: "sonia@prismacontabil.com.br",
    telefone: "(11) 3255-8080",
    cidade: "São Paulo / SP",
    status: "ativo",
    tier: "Diamante",
    desde: "2019-02-11",
    gestor: "Marina Duarte",
    comissaoPercentual: 18,
    tabelaEspecial: "Tabela Parceiro Diamante · -22% sobre o balcão",
    metaMes: 170,
    emissoesMes: 158,
    emissoesAno: 1284,
    receitaMes: 48_200,
    receitaAno: 391_600,
    ticketMedio: 305,
    comissaoMes: 8_676,
    comissaoAberta: 8_676,
    comissaoAcumulada: 64_310,
    inadimplencia: 1.2,
    conversao: 74,
    nps: 82,
    qualidadeDocs: 94,
    tempoMedioDias: 1.4,
    churnCarteira: 2.1,
    ultimaAtividade: dia(0),
    observacao: "Maior parceiro da rede. Integração via API de emissão em piloto desde julho.",
    serie: serie(150, 1),
    carteira: [
      {
        id: "cw1",
        clienteId: "c1",
        nome: "Construtora Vale Norte LTDA",
        documento: "12.884.301/0001-45",
        tipoPessoa: "PJ",
        certificadosAtivos: 2,
        proximoVencimento: dia(21),
        ultimaEmissao: "2024-08-02",
        receitaAno: 4_120,
        situacao: "ativo",
      },
      {
        id: "cw2",
        clienteId: "c4",
        nome: "Transportes Aurora S/A",
        documento: "08.552.119/0001-77",
        tipoPessoa: "PJ",
        certificadosAtivos: 26,
        proximoVencimento: dia(72),
        ultimaEmissao: "2026-01-15",
        receitaAno: 22_800,
        situacao: "ativo",
      },
      {
        id: "cw3",
        nome: "Padaria Estrela do Sul ME",
        documento: "31.902.774/0001-60",
        tipoPessoa: "PJ",
        certificadosAtivos: 1,
        proximoVencimento: dia(11),
        ultimaEmissao: "2025-08-13",
        receitaAno: 289,
        situacao: "em risco",
      },
      {
        id: "cw4",
        nome: "Mendes & Fialho Advogados",
        documento: "22.180.443/0001-05",
        tipoPessoa: "PJ",
        certificadosAtivos: 4,
        proximoVencimento: dia(45),
        ultimaEmissao: dia(-18),
        receitaAno: 1_940,
        situacao: "ativo",
      },
      {
        id: "cw5",
        nome: "Rita Camargo Nutrição",
        documento: "455.221.908-11",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(160),
        ultimaEmissao: dia(-32),
        receitaAno: 159,
        situacao: "novo",
      },
      {
        id: "cw6",
        nome: "Metalúrgica Bonfim LTDA",
        documento: "09.771.220/0001-33",
        tipoPessoa: "PJ",
        certificadosAtivos: 3,
        proximoVencimento: dia(-4),
        ultimaEmissao: "2025-07-29",
        receitaAno: 1_170,
        situacao: "inadimplente",
      },
    ],
    pedidos: [
      {
        id: "pc1",
        protocolo: "SOL-20418",
        clienteId: "c1",
        cliente: "Construtora Vale Norte LTDA",
        tipo: "e-CNPJ A1",
        stage: "validacao",
        valor: 289,
        slaRestanteHoras: 3,
        responsavel: "Marina Duarte",
        abertoEm: dia(-1),
      },
      {
        id: "pc2",
        protocolo: "SOL-20441",
        clienteId: "c4",
        cliente: "Transportes Aurora S/A",
        tipo: "Nuvem PJ",
        stage: "videoconferencia",
        valor: 429,
        slaRestanteHoras: 9,
        responsavel: "Marina Duarte",
        abertoEm: dia(-2),
      },
      {
        id: "pc3",
        protocolo: "SOL-20471",
        cliente: "Mendes & Fialho Advogados",
        tipo: "e-CNPJ A3",
        stage: "documentacao",
        valor: 389,
        slaRestanteHoras: 20,
        responsavel: "Carolina Ito",
        abertoEm: dia(0),
      },
      {
        id: "pc4",
        protocolo: "SOL-20474",
        cliente: "Padaria Estrela do Sul ME",
        tipo: "e-CNPJ A1",
        stage: "bloqueado",
        valor: 289,
        slaRestanteHoras: -6,
        responsavel: "Helena Prado",
        abertoEm: dia(-3),
      },
      {
        id: "pc5",
        protocolo: "SOL-20480",
        cliente: "Rita Camargo Nutrição",
        tipo: "e-CPF A1",
        stage: "agendamento",
        valor: 159,
        slaRestanteHoras: 14,
        responsavel: "Rafael Bastos",
        abertoEm: dia(0),
      },
      {
        id: "pc6",
        protocolo: "SOL-20401",
        clienteId: "c4",
        cliente: "Transportes Aurora S/A",
        tipo: "e-CNPJ A3",
        stage: "concluido",
        valor: 389,
        slaRestanteHoras: 26,
        responsavel: "Marina Duarte",
        abertoEm: dia(-7),
      },
    ],
    extrato: [
      {
        id: "ec1",
        competencia: "08/2026",
        emissoes: 62,
        base: 18_900,
        percentual: 18,
        valor: 3_402,
        status: "prevista",
        pagamento: dia(34),
      },
      {
        id: "ec2",
        competencia: "07/2026",
        emissoes: 158,
        base: 48_200,
        percentual: 18,
        valor: 8_676,
        status: "aprovada",
        pagamento: dia(4),
      },
      {
        id: "ec3",
        competencia: "06/2026",
        emissoes: 141,
        base: 44_100,
        percentual: 18,
        valor: 7_938,
        status: "paga",
        pagamento: dia(-28),
      },
      {
        id: "ec4",
        competencia: "05/2026",
        emissoes: 133,
        base: 41_300,
        percentual: 18,
        valor: 7_434,
        status: "paga",
        pagamento: dia(-58),
      },
    ],
    documentos: [
      {
        id: "dc1",
        nome: "Contrato de credenciamento assinado.pdf",
        tipo: "Contrato",
        validade: "2027-02-11",
        status: "aprovado",
      },
      {
        id: "dc2",
        nome: "Certidão de regularidade CRC.pdf",
        tipo: "Habilitação",
        validade: dia(38),
        status: "aprovado",
      },
      { id: "dc3", nome: "Termo LGPD e sigilo.pdf", tipo: "Compliance", status: "aprovado" },
      {
        id: "dc4",
        nome: "Certidão negativa federal.pdf",
        tipo: "Fiscal",
        validade: dia(-9),
        status: "vencido",
      },
    ],
    contatos: [
      {
        id: "ck1",
        nome: "Sônia Rezende",
        papel: "Sócia responsável",
        email: "sonia@prismacontabil.com.br",
        telefone: "(11) 99621-4410",
      },
      {
        id: "ck2",
        nome: "Bruno Tavares",
        papel: "Departamento societário",
        email: "societario@prismacontabil.com.br",
        telefone: "(11) 3255-8085",
      },
    ],
    atividades: [
      {
        id: "at1",
        quando: dia(0) + " 09:12",
        autor: "Sistema",
        texto: "62 emissões registradas na competência de agosto.",
        tipo: "sistema",
      },
      {
        id: "at2",
        quando: dia(-1) + " 16:40",
        autor: "Marina Duarte",
        texto: "Alinhamento sobre piloto da API de emissão em lote.",
        tipo: "humano",
      },
      {
        id: "at3",
        quando: dia(-9) + " 11:05",
        autor: "Compliance",
        texto: "Certidão negativa federal venceu — reenvio solicitado.",
        tipo: "alerta",
      },
    ],
  },
  {
    id: "ct2",
    nome: "Escritório Lumen",
    razaoSocial: "Lumen Assessoria Contábil EIRELI",
    cnpj: "24.118.552/0001-90",
    crc: "CRC/MG 2MG-014770",
    responsavel: "Otávio Lima",
    email: "otavio@lumencontabil.com.br",
    telefone: "(31) 3644-1190",
    cidade: "Belo Horizonte / MG",
    status: "ativo",
    tier: "Ouro",
    desde: "2021-06-08",
    gestor: "Carolina Ito",
    comissaoPercentual: 18,
    tabelaEspecial: "Tabela Parceiro Ouro · -16% sobre o balcão",
    metaMes: 120,
    emissoesMes: 102,
    emissoesAno: 844,
    receitaMes: 31_400,
    receitaAno: 248_900,
    ticketMedio: 308,
    comissaoMes: 5_652,
    comissaoAberta: 7_416,
    comissaoAcumulada: 38_920,
    inadimplencia: 3.8,
    conversao: 61,
    nps: 74,
    qualidadeDocs: 88,
    tempoMedioDias: 1.9,
    churnCarteira: 4.4,
    ultimaAtividade: dia(-1),
    observacao:
      "Forte em PF (profissionais liberais). Oportunidade de migrar carteira para Nuvem PJ.",
    serie: serie(100, 1.02),
    carteira: [
      {
        id: "cw7",
        clienteId: "c3",
        nome: "Clínica Bem Viver ME",
        documento: "29.771.554/0001-08",
        tipoPessoa: "PJ",
        certificadosAtivos: 1,
        proximoVencimento: dia(6),
        ultimaEmissao: "2024-12-18",
        receitaAno: 578,
        situacao: "inadimplente",
      },
      {
        id: "cw8",
        clienteId: "c5",
        nome: "Paulo Sérgio Almeida",
        documento: "877.402.115-90",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(88),
        ultimaEmissao: "2024-11-11",
        receitaAno: 318,
        situacao: "ativo",
      },
      {
        id: "cw9",
        nome: "Studio Vértice Arquitetura",
        documento: "18.443.902/0001-14",
        tipoPessoa: "PJ",
        certificadosAtivos: 2,
        proximoVencimento: dia(29),
        ultimaEmissao: dia(-51),
        receitaAno: 718,
        situacao: "ativo",
      },
      {
        id: "cw10",
        nome: "Larissa Fontes Psicologia",
        documento: "112.988.440-27",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(3),
        ultimaEmissao: "2025-08-06",
        receitaAno: 159,
        situacao: "em risco",
      },
      {
        id: "cw11",
        nome: "Distribuidora Minas Center",
        documento: "07.221.905/0001-72",
        tipoPessoa: "PJ",
        certificadosAtivos: 5,
        proximoVencimento: dia(120),
        ultimaEmissao: dia(-12),
        receitaAno: 3_440,
        situacao: "ativo",
      },
    ],
    pedidos: [
      {
        id: "pc7",
        protocolo: "SOL-20430",
        clienteId: "c3",
        cliente: "Clínica Bem Viver ME",
        tipo: "e-CNPJ A1",
        stage: "bloqueado",
        valor: 289,
        slaRestanteHoras: -12,
        responsavel: "Helena Prado",
        abertoEm: dia(-4),
      },
      {
        id: "pc8",
        protocolo: "SOL-20462",
        clienteId: "c5",
        cliente: "Paulo Sérgio Almeida",
        tipo: "e-CPF A1",
        stage: "validacao",
        valor: 159,
        slaRestanteHoras: 6,
        responsavel: "Carolina Ito",
        abertoEm: dia(-1),
      },
      {
        id: "pc9",
        protocolo: "SOL-20477",
        cliente: "Larissa Fontes Psicologia",
        tipo: "e-CPF A1",
        stage: "documentacao",
        valor: 159,
        slaRestanteHoras: 2,
        responsavel: "Diego Nunes",
        abertoEm: dia(0),
      },
      {
        id: "pc10",
        protocolo: "SOL-20482",
        cliente: "Distribuidora Minas Center",
        tipo: "Nuvem PJ",
        stage: "emissao",
        valor: 429,
        slaRestanteHoras: 11,
        responsavel: "Rafael Bastos",
        abertoEm: dia(-1),
      },
    ],
    extrato: [
      {
        id: "ec5",
        competencia: "08/2026",
        emissoes: 31,
        base: 9_800,
        percentual: 18,
        valor: 1_764,
        status: "prevista",
        pagamento: dia(34),
      },
      {
        id: "ec6",
        competencia: "07/2026",
        emissoes: 102,
        base: 31_400,
        percentual: 18,
        valor: 5_652,
        status: "apurada",
        pagamento: dia(4),
      },
      {
        id: "ec7",
        competencia: "06/2026",
        emissoes: 94,
        base: 29_100,
        percentual: 18,
        valor: 5_238,
        status: "paga",
        pagamento: dia(-28),
      },
    ],
    documentos: [
      {
        id: "dc5",
        nome: "Contrato de credenciamento assinado.pdf",
        tipo: "Contrato",
        validade: "2027-06-08",
        status: "aprovado",
      },
      {
        id: "dc6",
        nome: "Certidão de regularidade CRC.pdf",
        tipo: "Habilitação",
        validade: dia(210),
        status: "aprovado",
      },
      { id: "dc7", nome: "Termo LGPD e sigilo.pdf", tipo: "Compliance", status: "em análise" },
    ],
    contatos: [
      {
        id: "ck3",
        nome: "Otávio Lima",
        papel: "Sócio",
        email: "otavio@lumencontabil.com.br",
        telefone: "(31) 99110-2288",
      },
    ],
    atividades: [
      {
        id: "at4",
        quando: dia(-1) + " 14:20",
        autor: "Carolina Ito",
        texto: "Enviada campanha de renovação para 18 clientes da carteira.",
        tipo: "humano",
      },
      {
        id: "at5",
        quando: dia(-4) + " 09:00",
        autor: "Sistema",
        texto: "Pedido SOL-20430 bloqueado por documentação divergente.",
        tipo: "alerta",
      },
    ],
  },
  {
    id: "ct3",
    nome: "Contábil Horizonte",
    razaoSocial: "Horizonte Gestão Contábil LTDA",
    cnpj: "33.905.147/0001-52",
    crc: "CRC/PR 2PR-009114",
    responsavel: "Juliana Peixoto",
    email: "juliana@horizontecontabil.com",
    telefone: "(41) 3090-4477",
    cidade: "Curitiba / PR",
    status: "ativo",
    tier: "Prata",
    desde: "2023-04-19",
    gestor: "Rafael Bastos",
    comissaoPercentual: 15,
    tabelaEspecial: "Tabela Parceiro Prata · -12% sobre o balcão",
    metaMes: 70,
    emissoesMes: 58,
    emissoesAno: 402,
    receitaMes: 17_100,
    receitaAno: 118_400,
    ticketMedio: 295,
    comissaoMes: 2_565,
    comissaoAberta: 2_565,
    comissaoAcumulada: 14_880,
    inadimplencia: 6.1,
    conversao: 52,
    nps: 66,
    qualidadeDocs: 79,
    tempoMedioDias: 2.6,
    churnCarteira: 7.2,
    ultimaAtividade: dia(-3),
    observacao: "Volume estável, mas qualidade documental abaixo da média — treinamento agendado.",
    serie: serie(56, 0.98),
    carteira: [
      {
        id: "cw12",
        nome: "Auto Peças Trevo LTDA",
        documento: "14.552.001/0001-19",
        tipoPessoa: "PJ",
        certificadosAtivos: 2,
        proximoVencimento: dia(17),
        ultimaEmissao: dia(-40),
        receitaAno: 868,
        situacao: "ativo",
      },
      {
        id: "cw13",
        nome: "Ateliê Marcondes ME",
        documento: "25.114.880/0001-46",
        tipoPessoa: "PJ",
        certificadosAtivos: 1,
        proximoVencimento: dia(-2),
        ultimaEmissao: "2025-08-01",
        receitaAno: 289,
        situacao: "inadimplente",
      },
      {
        id: "cw14",
        nome: "Instituto Aurora",
        documento: "11.780.229/0001-31",
        tipoPessoa: "PJ",
        certificadosAtivos: 3,
        proximoVencimento: dia(64),
        ultimaEmissao: dia(-22),
        receitaAno: 1_290,
        situacao: "ativo",
      },
      {
        id: "cw15",
        nome: "Gustavo Peres Corretora",
        documento: "902.117.334-08",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(95),
        ultimaEmissao: dia(-9),
        receitaAno: 318,
        situacao: "novo",
      },
    ],
    pedidos: [
      {
        id: "pc11",
        protocolo: "SOL-20468",
        cliente: "Auto Peças Trevo LTDA",
        tipo: "e-CNPJ A1",
        stage: "agendamento",
        valor: 289,
        slaRestanteHoras: 7,
        responsavel: "Rafael Bastos",
        abertoEm: dia(-1),
      },
      {
        id: "pc12",
        protocolo: "SOL-20470",
        cliente: "Instituto Aurora",
        tipo: "e-CNPJ A3",
        stage: "novo",
        valor: 389,
        slaRestanteHoras: 22,
        responsavel: "Diego Nunes",
        abertoEm: dia(0),
      },
      {
        id: "pc13",
        protocolo: "SOL-20465",
        cliente: "Ateliê Marcondes ME",
        tipo: "e-CNPJ A1",
        stage: "bloqueado",
        valor: 289,
        slaRestanteHoras: -30,
        responsavel: "Helena Prado",
        abertoEm: dia(-5),
      },
    ],
    extrato: [
      {
        id: "ec8",
        competencia: "08/2026",
        emissoes: 21,
        base: 6_200,
        percentual: 15,
        valor: 930,
        status: "prevista",
        pagamento: dia(34),
      },
      {
        id: "ec9",
        competencia: "07/2026",
        emissoes: 58,
        base: 17_100,
        percentual: 15,
        valor: 2_565,
        status: "apurada",
        pagamento: dia(4),
      },
      {
        id: "ec10",
        competencia: "06/2026",
        emissoes: 49,
        base: 14_400,
        percentual: 15,
        valor: 2_160,
        status: "paga",
        pagamento: dia(-28),
      },
    ],
    documentos: [
      {
        id: "dc8",
        nome: "Contrato de credenciamento assinado.pdf",
        tipo: "Contrato",
        validade: "2027-04-19",
        status: "aprovado",
      },
      {
        id: "dc9",
        nome: "Certidão de regularidade CRC.pdf",
        tipo: "Habilitação",
        validade: dia(96),
        status: "aprovado",
      },
      {
        id: "dc10",
        nome: "Comprovante de treinamento AR.pdf",
        tipo: "Capacitação",
        status: "pendente",
      },
    ],
    contatos: [
      {
        id: "ck4",
        nome: "Juliana Peixoto",
        papel: "Sócia",
        email: "juliana@horizontecontabil.com",
        telefone: "(41) 99880-3311",
      },
    ],
    atividades: [
      {
        id: "at6",
        quando: dia(-3) + " 10:30",
        autor: "Rafael Bastos",
        texto: "Treinamento de documentação agendado para a equipe do parceiro.",
        tipo: "humano",
      },
    ],
  },
  {
    id: "ct4",
    nome: "Nexo Contadores",
    razaoSocial: "Nexo Contadores Associados S/S",
    cnpj: "40.221.884/0001-07",
    crc: "CRC/RJ 2RJ-022019",
    responsavel: "Fernando Sales",
    email: "fernando@nexocontadores.com.br",
    telefone: "(21) 2555-9080",
    cidade: "Rio de Janeiro / RJ",
    status: "ativo",
    tier: "Ouro",
    desde: "2022-08-30",
    gestor: "Marina Duarte",
    comissaoPercentual: 18,
    tabelaEspecial: "Tabela Parceiro Ouro · -16% sobre o balcão",
    metaMes: 110,
    emissoesMes: 96,
    emissoesAno: 731,
    receitaMes: 29_800,
    receitaAno: 224_100,
    ticketMedio: 310,
    comissaoMes: 5_364,
    comissaoAberta: 5_364,
    comissaoAcumulada: 33_140,
    inadimplencia: 2.4,
    conversao: 68,
    nps: 79,
    qualidadeDocs: 91,
    tempoMedioDias: 1.6,
    churnCarteira: 3.1,
    ultimaAtividade: dia(0),
    observacao:
      "Usa portal de indicação com link próprio. 34% dos pedidos entram já com documentos completos.",
    serie: serie(94, 1.01),
    carteira: [
      {
        id: "cw16",
        clienteId: "c2",
        nome: "Ana Beatriz Cardoso",
        documento: "342.118.907-30",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(48),
        ultimaEmissao: "2025-02-11",
        receitaAno: 159,
        situacao: "ativo",
      },
      {
        id: "cw17",
        nome: "Rede Farma Popular",
        documento: "16.900.771/0001-88",
        tipoPessoa: "PJ",
        certificadosAtivos: 12,
        proximoVencimento: dia(35),
        ultimaEmissao: dia(-6),
        receitaAno: 14_200,
        situacao: "ativo",
      },
      {
        id: "cw18",
        nome: "Marcos Vilela Engenharia",
        documento: "554.098.221-40",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(8),
        ultimaEmissao: "2025-08-11",
        receitaAno: 318,
        situacao: "em risco",
      },
      {
        id: "cw19",
        nome: "Supermercados União",
        documento: "05.118.220/0001-64",
        tipoPessoa: "PJ",
        certificadosAtivos: 4,
        proximoVencimento: dia(52),
        ultimaEmissao: dia(-19),
        receitaAno: 1_556,
        situacao: "ativo",
      },
    ],
    pedidos: [
      {
        id: "pc14",
        protocolo: "SOL-20422",
        clienteId: "c2",
        cliente: "Ana Beatriz Cardoso",
        tipo: "e-CPF A1",
        stage: "agendamento",
        valor: 159,
        slaRestanteHoras: 5,
        responsavel: "Rafael Bastos",
        abertoEm: dia(-1),
      },
      {
        id: "pc15",
        protocolo: "SOL-20476",
        cliente: "Rede Farma Popular",
        tipo: "Nuvem PJ",
        stage: "emissao",
        valor: 429,
        slaRestanteHoras: 8,
        responsavel: "Marina Duarte",
        abertoEm: dia(-2),
      },
      {
        id: "pc16",
        protocolo: "SOL-20481",
        cliente: "Marcos Vilela Engenharia",
        tipo: "e-CPF A3",
        stage: "documentacao",
        valor: 318,
        slaRestanteHoras: 16,
        responsavel: "Carolina Ito",
        abertoEm: dia(0),
      },
      {
        id: "pc17",
        protocolo: "SOL-20455",
        cliente: "Supermercados União",
        tipo: "e-CNPJ A3",
        stage: "concluido",
        valor: 389,
        slaRestanteHoras: 30,
        responsavel: "Marina Duarte",
        abertoEm: dia(-8),
      },
    ],
    extrato: [
      {
        id: "ec11",
        competencia: "08/2026",
        emissoes: 38,
        base: 11_600,
        percentual: 18,
        valor: 2_088,
        status: "prevista",
        pagamento: dia(34),
      },
      {
        id: "ec12",
        competencia: "07/2026",
        emissoes: 96,
        base: 29_800,
        percentual: 18,
        valor: 5_364,
        status: "aprovada",
        pagamento: dia(4),
      },
      {
        id: "ec13",
        competencia: "06/2026",
        emissoes: 88,
        base: 27_200,
        percentual: 18,
        valor: 4_896,
        status: "paga",
        pagamento: dia(-28),
      },
    ],
    documentos: [
      {
        id: "dc11",
        nome: "Contrato de credenciamento assinado.pdf",
        tipo: "Contrato",
        validade: "2026-08-30",
        status: "aprovado",
      },
      {
        id: "dc12",
        nome: "Certidão de regularidade CRC.pdf",
        tipo: "Habilitação",
        validade: dia(140),
        status: "aprovado",
      },
      { id: "dc13", nome: "Termo LGPD e sigilo.pdf", tipo: "Compliance", status: "aprovado" },
    ],
    contatos: [
      {
        id: "ck5",
        nome: "Fernando Sales",
        papel: "Sócio diretor",
        email: "fernando@nexocontadores.com.br",
        telefone: "(21) 99444-1200",
      },
      {
        id: "ck6",
        nome: "Paula Vidal",
        papel: "Atendimento",
        email: "atendimento@nexocontadores.com.br",
        telefone: "(21) 2555-9081",
      },
    ],
    atividades: [
      {
        id: "at7",
        quando: dia(0) + " 08:05",
        autor: "Sistema",
        texto: "3 novos pedidos recebidos pelo link de indicação do parceiro.",
        tipo: "sistema",
      },
      {
        id: "at8",
        quando: dia(-6) + " 17:10",
        autor: "Marina Duarte",
        texto: "Renovação do contrato de credenciamento inicia em 30 dias.",
        tipo: "alerta",
      },
    ],
  },
  {
    id: "ct5",
    nome: "Assessoria Contar",
    razaoSocial: "Contar Assessoria Empresarial LTDA",
    cnpj: "51.774.220/0001-18",
    crc: "CRC/CE 2CE-004411",
    responsavel: "Rodrigo Menezes",
    email: "rodrigo@contarassessoria.com",
    telefone: "(85) 3033-7711",
    cidade: "Fortaleza / CE",
    status: "em credenciamento",
    tier: "Bronze",
    desde: dia(-24),
    gestor: "Diego Nunes",
    comissaoPercentual: 12,
    tabelaEspecial: "Tabela Parceiro Bronze · -8% sobre o balcão",
    metaMes: 30,
    emissoesMes: 11,
    emissoesAno: 11,
    receitaMes: 3_180,
    receitaAno: 3_180,
    ticketMedio: 289,
    comissaoMes: 382,
    comissaoAberta: 382,
    comissaoAcumulada: 382,
    inadimplencia: 0,
    conversao: 44,
    nps: 0,
    qualidadeDocs: 71,
    tempoMedioDias: 3.2,
    churnCarteira: 0,
    ultimaAtividade: dia(-2),
    observacao:
      "Credenciamento em andamento — falta homologação do posto de atendimento e treinamento AR.",
    serie: [
      { mes: "Mar", emissoes: 0, receita: 0, comissao: 0 },
      { mes: "Abr", emissoes: 0, receita: 0, comissao: 0 },
      { mes: "Mai", emissoes: 0, receita: 0, comissao: 0 },
      { mes: "Jun", emissoes: 0, receita: 0, comissao: 0 },
      { mes: "Jul", emissoes: 11, receita: 3_180, comissao: 382 },
      { mes: "Ago", emissoes: 4, receita: 1_156, comissao: 139 },
    ],
    carteira: [
      {
        id: "cw20",
        nome: "Sabor do Ceará Alimentos",
        documento: "28.117.440/0001-92",
        tipoPessoa: "PJ",
        certificadosAtivos: 1,
        proximoVencimento: dia(300),
        ultimaEmissao: dia(-14),
        receitaAno: 289,
        situacao: "novo",
      },
      {
        id: "cw21",
        nome: "Camila Rocha Contabilidade PF",
        documento: "660.114.229-05",
        tipoPessoa: "PF",
        certificadosAtivos: 1,
        proximoVencimento: dia(280),
        ultimaEmissao: dia(-20),
        receitaAno: 159,
        situacao: "novo",
      },
    ],
    pedidos: [
      {
        id: "pc18",
        protocolo: "SOL-20484",
        cliente: "Sabor do Ceará Alimentos",
        tipo: "e-CNPJ A1",
        stage: "novo",
        valor: 289,
        slaRestanteHoras: 23,
        responsavel: "Diego Nunes",
        abertoEm: dia(0),
      },
    ],
    extrato: [
      {
        id: "ec14",
        competencia: "07/2026",
        emissoes: 11,
        base: 3_180,
        percentual: 12,
        valor: 382,
        status: "apurada",
        pagamento: dia(4),
      },
    ],
    documentos: [
      {
        id: "dc14",
        nome: "Contrato de credenciamento.pdf",
        tipo: "Contrato",
        status: "em análise",
      },
      {
        id: "dc15",
        nome: "Certidão de regularidade CRC.pdf",
        tipo: "Habilitação",
        validade: dia(180),
        status: "aprovado",
      },
      {
        id: "dc16",
        nome: "Homologação do posto de atendimento.pdf",
        tipo: "Estrutura",
        status: "pendente",
      },
      {
        id: "dc17",
        nome: "Treinamento AR — certificado.pdf",
        tipo: "Capacitação",
        status: "pendente",
      },
    ],
    contatos: [
      {
        id: "ck7",
        nome: "Rodrigo Menezes",
        papel: "Sócio",
        email: "rodrigo@contarassessoria.com",
        telefone: "(85) 98800-1122",
      },
    ],
    atividades: [
      {
        id: "at9",
        quando: dia(-2) + " 15:00",
        autor: "Diego Nunes",
        texto: "Checklist de credenciamento enviado — 2 itens pendentes.",
        tipo: "humano",
      },
    ],
  },
  {
    id: "ct6",
    nome: "Grupo Fiscaliza",
    razaoSocial: "Fiscaliza Consultoria Tributária LTDA",
    cnpj: "62.008.913/0001-40",
    crc: "CRC/RS 2RS-011233",
    responsavel: "Cristina Bauer",
    email: "cristina@fiscaliza.com.br",
    telefone: "(51) 3211-6600",
    cidade: "Porto Alegre / RS",
    status: "suspenso",
    tier: "Prata",
    desde: "2020-10-05",
    gestor: "Helena Prado",
    comissaoPercentual: 15,
    tabelaEspecial: "Suspensa durante a apuração",
    metaMes: 60,
    emissoesMes: 0,
    emissoesAno: 188,
    receitaMes: 0,
    receitaAno: 56_400,
    ticketMedio: 300,
    comissaoMes: 0,
    comissaoAberta: 4_752,
    comissaoAcumulada: 21_400,
    inadimplencia: 12.4,
    conversao: 38,
    nps: 41,
    qualidadeDocs: 62,
    tempoMedioDias: 4.1,
    churnCarteira: 14.8,
    ultimaAtividade: dia(-16),
    observacao:
      "Suspenso por divergência em validação documental (auditoria interna). Comissão retida até conclusão.",
    serie: [
      { mes: "Mar", emissoes: 52, receita: 15_600, comissao: 2_340 },
      { mes: "Abr", emissoes: 48, receita: 14_400, comissao: 2_160 },
      { mes: "Mai", emissoes: 44, receita: 13_200, comissao: 1_980 },
      { mes: "Jun", emissoes: 30, receita: 9_000, comissao: 1_350 },
      { mes: "Jul", emissoes: 14, receita: 4_200, comissao: 630 },
      { mes: "Ago", emissoes: 0, receita: 0, comissao: 0 },
    ],
    carteira: [
      {
        id: "cw22",
        nome: "Vinícola Serra Velha",
        documento: "19.884.552/0001-27",
        tipoPessoa: "PJ",
        certificadosAtivos: 2,
        proximoVencimento: dia(26),
        ultimaEmissao: dia(-70),
        receitaAno: 718,
        situacao: "em risco",
      },
      {
        id: "cw23",
        nome: "Transporte Pampa LTDA",
        documento: "23.660.114/0001-55",
        tipoPessoa: "PJ",
        certificadosAtivos: 3,
        proximoVencimento: dia(-8),
        ultimaEmissao: dia(-95),
        receitaAno: 1_067,
        situacao: "inadimplente",
      },
    ],
    pedidos: [],
    extrato: [
      {
        id: "ec15",
        competencia: "07/2026",
        emissoes: 14,
        base: 4_200,
        percentual: 15,
        valor: 630,
        status: "retida",
        pagamento: dia(4),
      },
      {
        id: "ec16",
        competencia: "06/2026",
        emissoes: 30,
        base: 9_000,
        percentual: 15,
        valor: 1_350,
        status: "retida",
        pagamento: dia(-28),
      },
    ],
    documentos: [
      {
        id: "dc18",
        nome: "Contrato de credenciamento assinado.pdf",
        tipo: "Contrato",
        validade: "2026-10-05",
        status: "aprovado",
      },
      { id: "dc19", nome: "Notificação de suspensão.pdf", tipo: "Compliance", status: "aprovado" },
      { id: "dc20", nome: "Plano de ação de correção.pdf", tipo: "Compliance", status: "pendente" },
    ],
    contatos: [
      {
        id: "ck8",
        nome: "Cristina Bauer",
        papel: "Sócia",
        email: "cristina@fiscaliza.com.br",
        telefone: "(51) 99700-8811",
      },
    ],
    atividades: [
      {
        id: "at10",
        quando: dia(-16) + " 09:45",
        autor: "Helena Prado",
        texto: "Parceiro suspenso após auditoria — comissões retidas.",
        tipo: "alerta",
      },
    ],
  },
];

export function contadorById(id: string) {
  return contadores.find((c) => c.id === id);
}

/** Mapa clienteId (base da AC) -> contador responsável pela indicação. */
export const contadorPorCliente: Record<string, string> = contadores.reduce(
  (acc, ct) => {
    for (const item of ct.carteira) if (item.clienteId) acc[item.clienteId] = ct.id;
    return acc;
  },
  {} as Record<string, string>,
);

export function contadorDoCliente(clienteId: string) {
  const id = contadorPorCliente[clienteId];
  return id ? contadorById(id) : undefined;
}

export const tierRegras = [
  {
    tier: "Bronze",
    meta: "até 30 emissões/mês",
    comissao: "12%",
    beneficios: "Tabela -8% · portal de indicação",
  },
  {
    tier: "Prata",
    meta: "31 a 80 emissões/mês",
    comissao: "15%",
    beneficios: "Tabela -12% · fila prioritária",
  },
  {
    tier: "Ouro",
    meta: "81 a 150 emissões/mês",
    comissao: "18%",
    beneficios: "Tabela -16% · gestor dedicado",
  },
  {
    tier: "Diamante",
    meta: "acima de 150 emissões/mês",
    comissao: "18% + bônus 2%",
    beneficios: "Tabela -22% · API e SLA 4h",
  },
];

export const funilCredenciamento = [
  { etapa: "Cadastro recebido", qtd: 14 },
  { etapa: "Documentação", qtd: 9 },
  { etapa: "Análise de compliance", qtd: 6 },
  { etapa: "Treinamento AR", qtd: 4 },
  { etapa: "Credenciado", qtd: 3 },
];

export const rankingMensal = contadores
  .map((c) => ({
    nome: c.nome,
    emissoes: c.emissoesMes,
    receita: c.receitaMes,
    comissao: c.comissaoMes,
  }))
  .sort((a, b) => b.emissoes - a.emissoes);
