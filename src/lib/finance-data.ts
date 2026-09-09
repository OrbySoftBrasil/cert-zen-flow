// ---------------------------------------------------------------------------
// Módulo financeiro — dados fictícios de demonstração
// ---------------------------------------------------------------------------

export const brlFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const hoje = new Date("2026-08-02T12:00:00Z");
export function dia(offset: number) {
  const d = new Date(hoje);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
export const dataBR = (iso: string) => iso.split("-").reverse().join("/");
export const diasAte = (iso: string) =>
  Math.round((new Date(`${iso}T12:00:00Z`).getTime() - hoje.getTime()) / 86400000);

// ------------------------------- Contas ------------------------------------

export interface Conta {
  id: string;
  nome: string;
  banco: string;
  tipo: "corrente" | "caixa" | "aplicação" | "adquirente";
  saldo: number;
  conciliadoAte: string;
}

export const contas: Conta[] = [
  {
    id: "cta1",
    nome: "Conta movimento",
    banco: "Banco Alfa · Ag 0412 / CC 18820-3",
    tipo: "corrente",
    saldo: 486_320,
    conciliadoAte: dia(-1),
  },
  {
    id: "cta2",
    nome: "Conta tarifas e impostos",
    banco: "Banco Alfa · CC 18821-1",
    tipo: "corrente",
    saldo: 92_140,
    conciliadoAte: dia(-2),
  },
  {
    id: "cta3",
    nome: "Reserva operacional",
    banco: "CDB liquidez diária · 103% CDI",
    tipo: "aplicação",
    saldo: 310_000,
    conciliadoAte: dia(-1),
  },
  {
    id: "cta4",
    nome: "Recebíveis cartão",
    banco: "Adquirente Pagio · D+30",
    tipo: "adquirente",
    saldo: 128_640,
    conciliadoAte: dia(-3),
  },
  {
    id: "cta5",
    nome: "Caixa das unidades",
    banco: "Numerário lojas / postos AR",
    tipo: "caixa",
    saldo: 8_450,
    conciliadoAte: dia(-1),
  },
];

// ------------------------------ Categorias ---------------------------------

export interface Categoria {
  id: string;
  nome: string;
  natureza: "receita" | "despesa";
  grupo: string;
  dre: string;
}

export const categorias: Categoria[] = [
  {
    id: "r1",
    nome: "Emissão de certificados",
    natureza: "receita",
    grupo: "Operacional",
    dre: "Receita bruta",
  },
  { id: "r2", nome: "Renovações", natureza: "receita", grupo: "Recorrente", dre: "Receita bruta" },
  {
    id: "r3",
    nome: "Planos e pacotes",
    natureza: "receita",
    grupo: "Recorrente",
    dre: "Receita bruta",
  },
  {
    id: "r4",
    nome: "Serviços avulsos (AR móvel)",
    natureza: "receita",
    grupo: "Operacional",
    dre: "Receita bruta",
  },
  { id: "d1", nome: "Repasse à AC raiz", natureza: "despesa", grupo: "Custo direto", dre: "CPV" },
  { id: "d2", nome: "Mídias e tokens", natureza: "despesa", grupo: "Custo direto", dre: "CPV" },
  {
    id: "d3",
    nome: "Comissões de parceiros",
    natureza: "despesa",
    grupo: "Custo direto",
    dre: "CPV",
  },
  {
    id: "d4",
    nome: "Folha e encargos",
    natureza: "despesa",
    grupo: "Pessoas",
    dre: "Despesa operacional",
  },
  {
    id: "d5",
    nome: "Infraestrutura e software",
    natureza: "despesa",
    grupo: "Tecnologia",
    dre: "Despesa operacional",
  },
  {
    id: "d6",
    nome: "Marketing e aquisição",
    natureza: "despesa",
    grupo: "Comercial",
    dre: "Despesa operacional",
  },
  {
    id: "d7",
    nome: "Tributos sobre venda",
    natureza: "despesa",
    grupo: "Tributário",
    dre: "Deduções",
  },
  {
    id: "d8",
    nome: "Tarifas bancárias e MDR",
    natureza: "despesa",
    grupo: "Financeiro",
    dre: "Despesa financeira",
  },
  {
    id: "d9",
    nome: "Ocupação e utilidades",
    natureza: "despesa",
    grupo: "Estrutura",
    dre: "Despesa operacional",
  },
];

export const centrosCusto = [
  { id: "cc1", nome: "Emissão / AR", orcado: 96_000, realizado: 88_420 },
  { id: "cc2", nome: "Atendimento & Helpdesk", orcado: 54_000, realizado: 57_310 },
  { id: "cc3", nome: "Comercial & Parcerias", orcado: 72_000, realizado: 64_900 },
  { id: "cc4", nome: "Tecnologia", orcado: 48_000, realizado: 45_120 },
  { id: "cc5", nome: "Administrativo", orcado: 39_000, realizado: 41_760 },
];

// ------------------------------ Fluxo de caixa ------------------------------

export interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  contraparte: string;
  categoria: string;
  centroCusto: string;
  conta: string;
  metodo: "Pix" | "Boleto" | "Cartão" | "TED" | "Dinheiro";
  tipo: "entrada" | "saida";
  valor: number;
  conciliado: boolean;
  documento: string;
}

export const lancamentos: Lancamento[] = [
  {
    id: "lc1",
    data: dia(0),
    descricao: "Liquidação lote de boletos",
    contraparte: "Banco Alfa",
    categoria: "Emissão de certificados",
    centroCusto: "Emissão / AR",
    conta: "Conta movimento",
    metodo: "Boleto",
    tipo: "entrada",
    valor: 34_820,
    conciliado: false,
    documento: "LOTE-8841",
  },
  {
    id: "lc2",
    data: dia(0),
    descricao: "Pix — Construtora Vale Norte LTDA",
    contraparte: "Construtora Vale Norte LTDA",
    categoria: "Renovações",
    centroCusto: "Emissão / AR",
    conta: "Conta movimento",
    metodo: "Pix",
    tipo: "entrada",
    valor: 1_740,
    conciliado: true,
    documento: "NF-20418",
  },
  {
    id: "lc3",
    data: dia(0),
    descricao: "Repasse mensal AC raiz",
    contraparte: "AC Raiz Certis",
    categoria: "Repasse à AC raiz",
    centroCusto: "Emissão / AR",
    conta: "Conta movimento",
    metodo: "TED",
    tipo: "saida",
    valor: 61_400,
    conciliado: true,
    documento: "CTR-114",
  },
  {
    id: "lc4",
    data: dia(-1),
    descricao: "Repasse adquirente D+30",
    contraparte: "Pagio Adquirência",
    categoria: "Emissão de certificados",
    centroCusto: "Emissão / AR",
    conta: "Recebíveis cartão",
    metodo: "Cartão",
    tipo: "entrada",
    valor: 28_310,
    conciliado: true,
    documento: "ADQ-0729",
  },
  {
    id: "lc5",
    data: dia(-1),
    descricao: "MDR e antecipação de recebíveis",
    contraparte: "Pagio Adquirência",
    categoria: "Tarifas bancárias e MDR",
    centroCusto: "Administrativo",
    conta: "Recebíveis cartão",
    metodo: "Cartão",
    tipo: "saida",
    valor: 2_914,
    conciliado: true,
    documento: "ADQ-0729",
  },
  {
    id: "lc6",
    data: dia(-2),
    descricao: "Assinatura plano Corporate — Transportes Iguaçu",
    contraparte: "Transportes Iguaçu S/A",
    categoria: "Planos e pacotes",
    centroCusto: "Comercial & Parcerias",
    conta: "Conta movimento",
    metodo: "Pix",
    tipo: "entrada",
    valor: 8_900,
    conciliado: true,
    documento: "NF-20402",
  },
  {
    id: "lc7",
    data: dia(-2),
    descricao: "Compra de tokens e cartões",
    contraparte: "Safe Devices BR",
    categoria: "Mídias e tokens",
    centroCusto: "Emissão / AR",
    conta: "Conta movimento",
    metodo: "Boleto",
    tipo: "saida",
    valor: 18_260,
    conciliado: true,
    documento: "NF-e 44921",
  },
  {
    id: "lc8",
    data: dia(-3),
    descricao: "Folha quinzenal + encargos",
    contraparte: "Equipe Certus",
    categoria: "Folha e encargos",
    centroCusto: "Administrativo",
    conta: "Conta movimento",
    metodo: "TED",
    tipo: "saida",
    valor: 96_500,
    conciliado: true,
    documento: "FOL-07/26",
  },
  {
    id: "lc9",
    data: dia(-3),
    descricao: "Comissão parceiros — julho",
    contraparte: "Rede de parceiros",
    categoria: "Comissões de parceiros",
    centroCusto: "Comercial & Parcerias",
    conta: "Conta movimento",
    metodo: "Pix",
    tipo: "saida",
    valor: 22_180,
    conciliado: false,
    documento: "COM-07/26",
  },
  {
    id: "lc10",
    data: dia(-4),
    descricao: "Videoconferências de validação — pacote",
    contraparte: "Clínica Bem Viver ME",
    categoria: "Serviços avulsos (AR móvel)",
    centroCusto: "Emissão / AR",
    conta: "Conta movimento",
    metodo: "Pix",
    tipo: "entrada",
    valor: 2_460,
    conciliado: true,
    documento: "NF-20388",
  },
  {
    id: "lc11",
    data: dia(-4),
    descricao: "Nuvem, HSM e observabilidade",
    contraparte: "CloudSign Infra",
    categoria: "Infraestrutura e software",
    centroCusto: "Tecnologia",
    conta: "Conta movimento",
    metodo: "Cartão",
    tipo: "saida",
    valor: 14_870,
    conciliado: true,
    documento: "INV-3391",
  },
  {
    id: "lc12",
    data: dia(-5),
    descricao: "Mídia paga e SEO",
    contraparte: "Agência Norte",
    categoria: "Marketing e aquisição",
    centroCusto: "Comercial & Parcerias",
    conta: "Conta movimento",
    metodo: "Boleto",
    tipo: "saida",
    valor: 12_400,
    conciliado: true,
    documento: "NF-e 7712",
  },
  {
    id: "lc13",
    data: dia(-6),
    descricao: "Recebimento em dinheiro — posto AR Centro",
    contraparte: "Balcão Centro",
    categoria: "Emissão de certificados",
    centroCusto: "Emissão / AR",
    conta: "Caixa das unidades",
    metodo: "Dinheiro",
    tipo: "entrada",
    valor: 3_180,
    conciliado: false,
    documento: "CX-0731",
  },
  {
    id: "lc14",
    data: dia(-6),
    descricao: "DAS / tributos sobre faturamento",
    contraparte: "Receita Federal",
    categoria: "Tributos sobre venda",
    centroCusto: "Administrativo",
    conta: "Conta tarifas e impostos",
    metodo: "Boleto",
    tipo: "saida",
    valor: 31_720,
    conciliado: true,
    documento: "DARF-07",
  },
  {
    id: "lc15",
    data: dia(-7),
    descricao: "Aluguel e utilidades das unidades",
    contraparte: "Adm. Predial Vega",
    categoria: "Ocupação e utilidades",
    centroCusto: "Administrativo",
    conta: "Conta movimento",
    metodo: "Boleto",
    tipo: "saida",
    valor: 19_300,
    conciliado: true,
    documento: "LOC-08",
  },
  {
    id: "lc16",
    data: dia(-8),
    descricao: "Lote renovações corporativas",
    contraparte: "Carteira PJ",
    categoria: "Renovações",
    centroCusto: "Emissão / AR",
    conta: "Conta movimento",
    metodo: "Boleto",
    tipo: "entrada",
    valor: 41_960,
    conciliado: true,
    documento: "LOTE-8802",
  },
];

// ------------------------------ Contas a pagar ------------------------------

export type TituloStatus =
  "em aberto" | "agendado" | "pago" | "vencido" | "em atraso" | "recebido" | "negociado";

export interface Pagar {
  id: string;
  fornecedor: string;
  descricao: string;
  categoria: string;
  centroCusto: string;
  emissao: string;
  vencimento: string;
  valor: number;
  status: Extract<TituloStatus, "em aberto" | "agendado" | "pago" | "vencido">;
  metodo: "Pix" | "Boleto" | "TED" | "Cartão";
  recorrente: boolean;
  aprovacao: "pendente" | "aprovado" | "rejeitado";
  documento: string;
}

export const pagar: Pagar[] = [
  {
    id: "ap1",
    fornecedor: "AC Raiz Certis",
    descricao: "Repasse por certificado emitido — agosto",
    categoria: "Repasse à AC raiz",
    centroCusto: "Emissão / AR",
    emissao: dia(-2),
    vencimento: dia(3),
    valor: 63_800,
    status: "em aberto",
    metodo: "TED",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "CTR-115",
  },
  {
    id: "ap2",
    fornecedor: "Safe Devices BR",
    descricao: "Tokens A3 — lote 500 un.",
    categoria: "Mídias e tokens",
    centroCusto: "Emissão / AR",
    emissao: dia(-6),
    vencimento: dia(6),
    valor: 24_500,
    status: "agendado",
    metodo: "Boleto",
    recorrente: false,
    aprovacao: "aprovado",
    documento: "NF-e 45011",
  },
  {
    id: "ap3",
    fornecedor: "CloudSign Infra",
    descricao: "HSM dedicado + nuvem",
    categoria: "Infraestrutura e software",
    centroCusto: "Tecnologia",
    emissao: dia(-5),
    vencimento: dia(9),
    valor: 14_870,
    status: "em aberto",
    metodo: "Cartão",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "INV-3402",
  },
  {
    id: "ap4",
    fornecedor: "Agência Norte",
    descricao: "Mídia paga — agosto",
    categoria: "Marketing e aquisição",
    centroCusto: "Comercial & Parcerias",
    emissao: dia(-4),
    vencimento: dia(12),
    valor: 12_400,
    status: "em aberto",
    metodo: "Boleto",
    recorrente: true,
    aprovacao: "pendente",
    documento: "NF-e 7740",
  },
  {
    id: "ap5",
    fornecedor: "Adm. Predial Vega",
    descricao: "Aluguel unidades Centro e Zona Sul",
    categoria: "Ocupação e utilidades",
    centroCusto: "Administrativo",
    emissao: dia(-3),
    vencimento: dia(8),
    valor: 19_300,
    status: "agendado",
    metodo: "Boleto",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "LOC-09",
  },
  {
    id: "ap6",
    fornecedor: "Equipe Certus",
    descricao: "Folha de agosto + encargos",
    categoria: "Folha e encargos",
    centroCusto: "Administrativo",
    emissao: dia(-1),
    vencimento: dia(15),
    valor: 198_400,
    status: "em aberto",
    metodo: "TED",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "FOL-08/26",
  },
  {
    id: "ap7",
    fornecedor: "Contabilidade Prisma",
    descricao: "Honorários contábeis",
    categoria: "Folha e encargos",
    centroCusto: "Administrativo",
    emissao: dia(-9),
    vencimento: dia(-3),
    valor: 5_600,
    status: "vencido",
    metodo: "Pix",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "NF-1180",
  },
  {
    id: "ap8",
    fornecedor: "Rede de parceiros",
    descricao: "Comissões apuradas — julho",
    categoria: "Comissões de parceiros",
    centroCusto: "Comercial & Parcerias",
    emissao: dia(-2),
    vencimento: dia(4),
    valor: 27_940,
    status: "em aberto",
    metodo: "Pix",
    recorrente: true,
    aprovacao: "pendente",
    documento: "COM-08/26",
  },
  {
    id: "ap9",
    fornecedor: "Receita Federal",
    descricao: "Tributos sobre faturamento",
    categoria: "Tributos sobre venda",
    centroCusto: "Administrativo",
    emissao: dia(-1),
    vencimento: dia(18),
    valor: 33_450,
    status: "em aberto",
    metodo: "Boleto",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "DARF-08",
  },
  {
    id: "ap10",
    fornecedor: "Vigilância Sentinela",
    descricao: "Segurança patrimonial das unidades",
    categoria: "Ocupação e utilidades",
    centroCusto: "Administrativo",
    emissao: dia(-12),
    vencimento: dia(-6),
    valor: 4_120,
    status: "pago",
    metodo: "Boleto",
    recorrente: true,
    aprovacao: "aprovado",
    documento: "NF-9021",
  },
  {
    id: "ap11",
    fornecedor: "Treina+ Educação",
    descricao: "Capacitação de agentes de registro",
    categoria: "Folha e encargos",
    centroCusto: "Atendimento & Helpdesk",
    emissao: dia(-7),
    vencimento: dia(21),
    valor: 8_900,
    status: "em aberto",
    metodo: "Pix",
    recorrente: false,
    aprovacao: "pendente",
    documento: "NF-552",
  },
  {
    id: "ap12",
    fornecedor: "Correios Log",
    descricao: "Logística de mídias para AR móvel",
    categoria: "Mídias e tokens",
    centroCusto: "Emissão / AR",
    emissao: dia(-8),
    vencimento: dia(-1),
    valor: 3_240,
    status: "vencido",
    metodo: "Boleto",
    recorrente: false,
    aprovacao: "aprovado",
    documento: "NF-3390",
  },
];

// ----------------------------- Contas a receber -----------------------------

export interface Receber {
  id: string;
  cliente: string;
  documento: string;
  descricao: string;
  origem: "Emissão" | "Renovação" | "Plano" | "Serviço";
  emissao: string;
  vencimento: string;
  valor: number;
  status: Extract<TituloStatus, "em aberto" | "recebido" | "em atraso" | "negociado">;
  metodo: "Pix" | "Boleto" | "Cartão" | "TED";
  parcela: string;
  nf: string;
}

export const receber: Receber[] = [
  {
    id: "ar1",
    cliente: "Construtora Vale Norte LTDA",
    documento: "12.884.301/0001-45",
    descricao: "Renovação e-CNPJ A1 (12 certificados)",
    origem: "Renovação",
    emissao: dia(-4),
    vencimento: dia(9),
    valor: 3_468,
    status: "em aberto",
    metodo: "Boleto",
    parcela: "1/1",
    nf: "NF-20418",
  },
  {
    id: "ar2",
    cliente: "Transportes Iguaçu S/A",
    documento: "08.771.220/0001-02",
    descricao: "Plano Corporate — mensalidade agosto",
    origem: "Plano",
    emissao: dia(-1),
    vencimento: dia(8),
    valor: 8_900,
    status: "em aberto",
    metodo: "Pix",
    parcela: "8/12",
    nf: "NF-20455",
  },
  {
    id: "ar3",
    cliente: "Paula Ferraz Advocacia",
    documento: "471.220.118-90",
    descricao: "e-CPF A3 + token",
    origem: "Emissão",
    emissao: dia(-11),
    vencimento: dia(-4),
    valor: 389,
    status: "em atraso",
    metodo: "Boleto",
    parcela: "1/1",
    nf: "NF-20361",
  },
  {
    id: "ar4",
    cliente: "Clínica Bem Viver ME",
    documento: "31.004.882/0001-77",
    descricao: "Pacote 10 emissões — parcela 2",
    origem: "Plano",
    emissao: dia(-14),
    vencimento: dia(2),
    valor: 1_890,
    status: "em aberto",
    metodo: "Cartão",
    parcela: "2/3",
    nf: "NF-20344",
  },
  {
    id: "ar5",
    cliente: "Ateliê Marcondes ME",
    documento: "22.556.109/0001-31",
    descricao: "Videoconferência de validação avulsa",
    origem: "Serviço",
    emissao: dia(-20),
    vencimento: dia(-12),
    valor: 240,
    status: "em atraso",
    metodo: "Pix",
    parcela: "1/1",
    nf: "NF-20290",
  },
  {
    id: "ar6",
    cliente: "Rede Farma Popular",
    documento: "19.883.400/0001-58",
    descricao: "Contrato AR interna — franquia agosto",
    origem: "Plano",
    emissao: dia(-2),
    vencimento: dia(13),
    valor: 14_200,
    status: "em aberto",
    metodo: "TED",
    parcela: "5/24",
    nf: "NF-20460",
  },
  {
    id: "ar7",
    cliente: "Prefeitura de Vale Verde",
    documento: "05.221.900/0001-14",
    descricao: "Ata de registro — lote 80 certificados",
    origem: "Emissão",
    emissao: dia(-25),
    vencimento: dia(-9),
    valor: 26_400,
    status: "negociado",
    metodo: "Boleto",
    parcela: "1/2",
    nf: "NF-20233",
  },
  {
    id: "ar8",
    cliente: "Contabilidade Prisma",
    documento: "44.019.220/0001-63",
    descricao: "Parceria contábil — repasse líquido",
    origem: "Plano",
    emissao: dia(-3),
    vencimento: dia(5),
    valor: 6_320,
    status: "em aberto",
    metodo: "Pix",
    parcela: "11/12",
    nf: "NF-20449",
  },
  {
    id: "ar9",
    cliente: "Supermercados União",
    documento: "60.114.882/0001-09",
    descricao: "Renovação e-CNPJ A3 (4 certificados)",
    origem: "Renovação",
    emissao: dia(-9),
    vencimento: dia(-2),
    valor: 1_556,
    status: "em atraso",
    metodo: "Boleto",
    parcela: "1/1",
    nf: "NF-20377",
  },
  {
    id: "ar10",
    cliente: "Logística Sul Express",
    documento: "77.220.114/0001-88",
    descricao: "Emissão Nuvem PJ — 6 licenças",
    origem: "Emissão",
    emissao: dia(-6),
    vencimento: dia(1),
    valor: 2_574,
    status: "em aberto",
    metodo: "Cartão",
    parcela: "1/1",
    nf: "NF-20401",
  },
  {
    id: "ar11",
    cliente: "Instituto Aurora",
    documento: "13.900.554/0001-20",
    descricao: "Plano Starter — mensalidade",
    origem: "Plano",
    emissao: dia(-30),
    vencimento: dia(-22),
    valor: 690,
    status: "recebido",
    metodo: "Pix",
    parcela: "3/12",
    nf: "NF-20188",
  },
  {
    id: "ar12",
    cliente: "Auto Peças Trevo",
    documento: "36.771.008/0001-45",
    descricao: "Emissão e-CNPJ A1",
    origem: "Emissão",
    emissao: dia(-1),
    vencimento: dia(14),
    valor: 289,
    status: "em aberto",
    metodo: "Pix",
    parcela: "1/1",
    nf: "NF-20462",
  },
];

export const aging = [
  { faixa: "A vencer", valor: 38_141, titulos: 7 },
  { faixa: "1–15 dias", valor: 1_796, titulos: 2 },
  { faixa: "16–30 dias", valor: 240, titulos: 1 },
  { faixa: "31–60 dias", valor: 26_400, titulos: 1 },
  { faixa: "60+ dias", valor: 4_980, titulos: 3 },
];

// -------------------------- Planos, pacotes, contratos ----------------------

export interface Plano {
  id: string;
  nome: string;
  publico: string;
  preco: number;
  ciclo: "mensal" | "anual" | "pacote";
  inclui: string[];
  assinantes: number;
  mrr: number;
  churn: number;
  margem: number;
  destaque?: boolean;
}

export const planos: Plano[] = [
  {
    id: "pl1",
    nome: "Starter",
    publico: "MEI e autônomos",
    preco: 690,
    ciclo: "anual",
    inclui: ["1 e-CPF A1", "Validação por vídeo", "Suporte em horário comercial"],
    assinantes: 412,
    mrr: 23_690,
    churn: 6.4,
    margem: 41,
  },
  {
    id: "pl2",
    nome: "Business",
    publico: "PME com até 20 certificados",
    preco: 2_490,
    ciclo: "anual",
    inclui: ["Até 10 emissões/ano", "AR móvel 2x", "Suporte prioritário", "Painel de vencimentos"],
    assinantes: 186,
    mrr: 38_595,
    churn: 4.1,
    margem: 52,
    destaque: true,
  },
  {
    id: "pl3",
    nome: "Corporate",
    publico: "Grupos e holdings",
    preco: 8_900,
    ciclo: "mensal",
    inclui: [
      "Emissões ilimitadas por escopo",
      "AR dedicada",
      "SLA 4h",
      "API de emissão",
      "Gestor de contas",
    ],
    assinantes: 24,
    mrr: 213_600,
    churn: 1.8,
    margem: 58,
  },
  {
    id: "pl4",
    nome: "Parceiro Contábil",
    publico: "Escritórios de contabilidade",
    preco: 0,
    ciclo: "mensal",
    inclui: ["Comissão de 18% por emissão", "Portal de indicação", "Materiais de venda"],
    assinantes: 97,
    mrr: 46_310,
    churn: 3.2,
    margem: 34,
  },
  {
    id: "pl5",
    nome: "Pacote 10 emissões",
    publico: "Compra avulsa com desconto",
    preco: 2_690,
    ciclo: "pacote",
    inclui: ["10 créditos de emissão", "Validade de 12 meses", "Transferível entre CNPJs do grupo"],
    assinantes: 138,
    mrr: 30_940,
    churn: 8.9,
    margem: 46,
  },
  {
    id: "pl6",
    nome: "AR Interna (franquia)",
    publico: "Redes com posto próprio",
    preco: 14_200,
    ciclo: "mensal",
    inclui: [
      "Homologação do posto",
      "Treinamento de agentes",
      "Repasse por emissão",
      "Auditoria trimestral",
    ],
    assinantes: 9,
    mrr: 127_800,
    churn: 0.9,
    margem: 61,
  },
];

export interface Contrato {
  id: string;
  cliente: string;
  plano: string;
  inicio: string;
  fim: string;
  valorMensal: number;
  reajuste: string;
  faturamento: "mensal" | "anual" | "por evento";
  status: "ativo" | "em renovação" | "inadimplente" | "encerrado";
  responsavel: string;
  consumo: number; // % do escopo consumido
}

export const contratos: Contrato[] = [
  {
    id: "ct1",
    cliente: "Transportes Iguaçu S/A",
    plano: "Corporate",
    inicio: "2025-12-01",
    fim: dia(120),
    valorMensal: 8_900,
    reajuste: "IPCA anual",
    faturamento: "mensal",
    status: "ativo",
    responsavel: "Marina Duarte",
    consumo: 72,
  },
  {
    id: "ct2",
    cliente: "Rede Farma Popular",
    plano: "AR Interna (franquia)",
    inicio: "2024-04-15",
    fim: dia(58),
    valorMensal: 14_200,
    reajuste: "IGP-M anual",
    faturamento: "mensal",
    status: "em renovação",
    responsavel: "Diego Nunes",
    consumo: 91,
  },
  {
    id: "ct3",
    cliente: "Prefeitura de Vale Verde",
    plano: "Corporate",
    inicio: "2026-01-10",
    fim: dia(160),
    valorMensal: 11_000,
    reajuste: "Sem reajuste (ata)",
    faturamento: "por evento",
    status: "inadimplente",
    responsavel: "Marina Duarte",
    consumo: 48,
  },
  {
    id: "ct4",
    cliente: "Contabilidade Prisma",
    plano: "Parceiro Contábil",
    inicio: "2023-06-01",
    fim: dia(300),
    valorMensal: 6_320,
    reajuste: "Comissionado",
    faturamento: "mensal",
    status: "ativo",
    responsavel: "Rafael Bastos",
    consumo: 64,
  },
  {
    id: "ct5",
    cliente: "Construtora Vale Norte LTDA",
    plano: "Business",
    inicio: "2025-08-02",
    fim: dia(21),
    valorMensal: 2_490 / 12,
    reajuste: "IPCA anual",
    faturamento: "anual",
    status: "em renovação",
    responsavel: "Marina Duarte",
    consumo: 88,
  },
  {
    id: "ct6",
    cliente: "Supermercados União",
    plano: "Business",
    inicio: "2025-03-20",
    fim: dia(-4),
    valorMensal: 2_490 / 12,
    reajuste: "IPCA anual",
    faturamento: "anual",
    status: "inadimplente",
    responsavel: "Diego Nunes",
    consumo: 100,
  },
  {
    id: "ct7",
    cliente: "Instituto Aurora",
    plano: "Starter",
    inicio: "2026-05-01",
    fim: dia(240),
    valorMensal: 690 / 12,
    reajuste: "IPCA anual",
    faturamento: "anual",
    status: "ativo",
    responsavel: "Rafael Bastos",
    consumo: 33,
  },
];

// -------------------------------- Comissões ---------------------------------

export interface Comissao {
  id: string;
  beneficiario: string;
  tipo: "Parceiro contábil" | "Vendedor interno" | "Revenda" | "Indicação";
  competencia: string;
  baseCalculo: number;
  percentual: number;
  valor: number;
  emissoes: number;
  status: "prevista" | "apurada" | "aprovada" | "paga" | "retida";
  pagamento: string;
}

export const comissoes: Comissao[] = [
  {
    id: "cm1",
    beneficiario: "Contabilidade Prisma",
    tipo: "Parceiro contábil",
    competencia: "07/2026",
    baseCalculo: 48_200,
    percentual: 18,
    valor: 8_676,
    emissoes: 158,
    status: "aprovada",
    pagamento: dia(4),
  },
  {
    id: "cm2",
    beneficiario: "Escritório Lumen",
    tipo: "Parceiro contábil",
    competencia: "07/2026",
    baseCalculo: 31_400,
    percentual: 18,
    valor: 5_652,
    emissoes: 102,
    status: "apurada",
    pagamento: dia(4),
  },
  {
    id: "cm3",
    beneficiario: "Marina Duarte",
    tipo: "Vendedor interno",
    competencia: "07/2026",
    baseCalculo: 96_800,
    percentual: 4,
    valor: 3_872,
    emissoes: 61,
    status: "aprovada",
    pagamento: dia(13),
  },
  {
    id: "cm4",
    beneficiario: "Diego Nunes",
    tipo: "Vendedor interno",
    competencia: "07/2026",
    baseCalculo: 74_300,
    percentual: 4,
    valor: 2_972,
    emissoes: 47,
    status: "aprovada",
    pagamento: dia(13),
  },
  {
    id: "cm5",
    beneficiario: "Rafael Bastos",
    tipo: "Vendedor interno",
    competencia: "07/2026",
    baseCalculo: 52_100,
    percentual: 4,
    valor: 2_084,
    emissoes: 38,
    status: "apurada",
    pagamento: dia(13),
  },
  {
    id: "cm6",
    beneficiario: "Revenda Sul Digital",
    tipo: "Revenda",
    competencia: "07/2026",
    baseCalculo: 39_600,
    percentual: 12,
    valor: 4_752,
    emissoes: 126,
    status: "retida",
    pagamento: dia(4),
  },
  {
    id: "cm7",
    beneficiario: "Indicações do portal",
    tipo: "Indicação",
    competencia: "07/2026",
    baseCalculo: 12_900,
    percentual: 5,
    valor: 645,
    emissoes: 44,
    status: "paga",
    pagamento: dia(-12),
  },
  {
    id: "cm8",
    beneficiario: "Contabilidade Prisma",
    tipo: "Parceiro contábil",
    competencia: "06/2026",
    baseCalculo: 44_100,
    percentual: 18,
    valor: 7_938,
    emissoes: 141,
    status: "paga",
    pagamento: dia(-28),
  },
  {
    id: "cm9",
    beneficiario: "Escritório Lumen",
    tipo: "Parceiro contábil",
    competencia: "08/2026",
    baseCalculo: 9_800,
    percentual: 18,
    valor: 1_764,
    emissoes: 31,
    status: "prevista",
    pagamento: dia(34),
  },
];

export interface RegraComissao {
  id: string;
  nome: string;
  regra: string;
  gatilho: string;
  carencia: string;
  teto: string;
  percentual?: number;
  ativa?: boolean;
}

export const regrasComissao: RegraComissao[] = [
  {
    id: "rg1",
    nome: "Parceiro contábil",
    regra: "18% sobre a receita líquida da emissão",
    gatilho: "Pagamento confirmado",
    carencia: "30 dias",
    teto: "Sem teto",
  },
  {
    id: "rg2",
    nome: "Vendedor interno",
    regra: "4% sobre a venda + 1% em renovação assistida",
    gatilho: "Emissão concluída",
    carencia: "Fecha no dia 5",
    teto: "R$ 12.000/mês",
  },
  {
    id: "rg3",
    nome: "Revenda",
    regra: "12% escalonado (15% acima de 150 emissões)",
    gatilho: "Liquidação financeira",
    carencia: "30 dias",
    teto: "Sem teto",
  },
  {
    id: "rg4",
    nome: "Indicação",
    regra: "5% na primeira compra do indicado",
    gatilho: "1ª emissão do indicado",
    carencia: "Imediato",
    teto: "R$ 500/indicação",
  },
  {
    id: "rg5",
    nome: "Estorno",
    regra: "Comissão retida em caso de chargeback ou revogação em 30 dias",
    gatilho: "Evento de estorno",
    carencia: "—",
    teto: "—",
  },
];

// --------------------------------- Séries BI --------------------------------

export const serieFinanceira = [
  { mes: "Fev", receita: 198_400, despesa: 152_100, ebitda: 46_300, caixa: 318_000 },
  { mes: "Mar", receita: 211_900, despesa: 158_700, ebitda: 53_200, caixa: 352_400 },
  { mes: "Abr", receita: 204_300, despesa: 161_200, ebitda: 43_100, caixa: 366_800 },
  { mes: "Mai", receita: 228_700, despesa: 166_400, ebitda: 62_300, caixa: 402_900 },
  { mes: "Jun", receita: 241_100, despesa: 172_900, ebitda: 68_200, caixa: 448_300 },
  { mes: "Jul", receita: 259_400, despesa: 181_600, ebitda: 77_800, caixa: 486_320 },
];

export const projecaoCaixa = [
  { dia: "Hoje", saldo: 486_320, entradas: 34_820, saidas: 61_400 },
  { dia: "+7d", saldo: 462_140, entradas: 58_300, saidas: 82_480 },
  { dia: "+14d", saldo: 501_900, entradas: 96_700, saidas: 56_940 },
  { dia: "+21d", saldo: 388_600, entradas: 61_200, saidas: 174_500 },
  { dia: "+30d", saldo: 441_700, entradas: 128_400, saidas: 75_300 },
  { dia: "+45d", saldo: 512_300, entradas: 142_100, saidas: 71_500 },
  { dia: "+60d", saldo: 559_800, entradas: 138_900, saidas: 91_400 },
];

export const receitaPorLinha = [
  { linha: "Emissão avulsa", valor: 96_400 },
  { linha: "Renovações", valor: 84_200 },
  { linha: "Planos e contratos", valor: 52_600 },
  { linha: "AR móvel / serviços", valor: 18_300 },
  { linha: "Parcerias", valor: 7_900 },
];

export const despesaPorGrupo = [
  { grupo: "Custo direto", valor: 82_400 },
  { grupo: "Pessoas", valor: 52_100 },
  { grupo: "Tecnologia", valor: 16_900 },
  { grupo: "Comercial", valor: 14_800 },
  { grupo: "Estrutura", valor: 9_300 },
  { grupo: "Financeiro", valor: 6_100 },
];

export const dre = [
  { linha: "Receita bruta", valor: 259_400, tipo: "receita" as const },
  { linha: "(–) Deduções e tributos", valor: -33_450, tipo: "deducao" as const },
  { linha: "= Receita líquida", valor: 225_950, tipo: "subtotal" as const },
  { linha: "(–) Custo dos serviços (CPV)", valor: -82_400, tipo: "custo" as const },
  { linha: "= Lucro bruto", valor: 143_550, tipo: "subtotal" as const },
  { linha: "(–) Despesas operacionais", valor: -93_100, tipo: "custo" as const },
  { linha: "(–) Despesas financeiras", valor: -6_100, tipo: "custo" as const },
  { linha: "= EBITDA", valor: 77_800, tipo: "resultado" as const },
  { linha: "(–) Depreciação e amortização", valor: -8_400, tipo: "custo" as const },
  { linha: "= Resultado líquido", valor: 69_400, tipo: "resultado" as const },
];

export const indicadores = {
  saldoTotal: contas.reduce((s, c) => s + c.saldo, 0),
  receitaMes: 259_400,
  receitaVar: 9.6,
  despesaMes: 181_600,
  despesaVar: 5.1,
  ebitda: 77_800,
  margemEbitda: 30,
  margemVar: 2.4,
  mrr: 480_935,
  mrrVar: 4.8,
  inadimplencia: 3.4,
  inadimplenciaVar: -0.6,
  ticketMedio: 306,
  runwayMeses: 6.2,
  cac: 84,
  ltvCac: 5.8,
  prazoMedioRecebimento: 21,
  prazoMedioPagamento: 27,
};
