// Ciclo de vida de uma emissão específica.
// O caso é o contexto; a emissão é a unidade regulada. Pagamento, emissão,
// entrega, instalação e revogação sempre pertencem a UMA emissão.
// Protótipo sem backend — o registro fica no estado global.

export type ResultadoEmissao = "emitida" | "pendente" | "rejeitada" | "erro";

export const resultadosEmissao: { id: ResultadoEmissao; nome: string; descricao: string }[] = [
  {
    id: "emitida",
    nome: "Emitida",
    descricao: "A AC concluiu a emissão e devolveu série e protocolo.",
  },
  {
    id: "pendente",
    nome: "Pendente na AC",
    descricao: "Pedido aceito, aguardando processamento da AC.",
  },
  {
    id: "rejeitada",
    nome: "Rejeitada",
    descricao: "A AC recusou o pedido — exige correção e novo registro.",
  },
  {
    id: "erro",
    nome: "Erro técnico",
    descricao: "Falha no portal ou integração da AC durante a emissão.",
  },
];

export type CicloEmissao =
  | "planejada"
  | "pronta-para-emissao"
  | "aguardando-conferencia"
  | "devolvida"
  | "pendente-na-ac"
  | "rejeitada"
  | "erro"
  | "emitida-confirmada"
  | "entrega-pendente"
  | "entregue"
  | "instalacao-confirmada"
  | "em-uso"
  | "revogada"
  | "bloqueada";

export const rotuloCiclo: Record<CicloEmissao, string> = {
  planejada: "Planejada",
  "pronta-para-emissao": "Pronta para emissão",
  "aguardando-conferencia": "Aguardando conferência",
  devolvida: "Devolvida pelo conferente",
  "pendente-na-ac": "Pendente na AC",
  rejeitada: "Rejeitada pela AC",
  erro: "Erro técnico na AC",
  "emitida-confirmada": "Emitida confirmada",
  "entrega-pendente": "Entrega pendente",
  entregue: "Entregue",
  "instalacao-confirmada": "Instalação/ativação confirmada",
  "em-uso": "Em uso",
  revogada: "Revogada",
  bloqueada: "Bloqueada",
};

/** Sequência oficial após a conferência da emissão. */
export const trilhaCiclo: CicloEmissao[] = [
  "emitida-confirmada",
  "entrega-pendente",
  "entregue",
  "instalacao-confirmada",
  "em-uso",
];

export type ModoEntrega = "ac-envia" | "portal-ac-manual" | "certus-link" | "fisica";

export const modosEntrega: { id: ModoEntrega; nome: string; descricao: string }[] = [
  {
    id: "ac-envia",
    nome: "A AC enviará as instruções",
    descricao:
      "A própria AC comunica o titular pelos canais dela. A AR apenas acompanha a confirmação.",
  },
  {
    id: "portal-ac-manual",
    nome: "Envio disparado manualmente no portal da AC",
    descricao:
      "Um operador dispara o envio dentro do portal da AC e registra aqui o protocolo do disparo.",
  },
  {
    id: "certus-link",
    nome: "Certus enviará instruções / link seguro aprovado",
    descricao:
      "Envio pelo canal homologado da Certus, apenas com instruções e link seguro — nunca o certificado.",
  },
  {
    id: "fisica",
    nome: "Entrega física (mídia criptográfica)",
    descricao: "Aplicável somente a A3 em token ou cartão, com protocolo de retirada assinado.",
  },
];

export function modoEntrega(id: ModoEntrega) {
  return modosEntrega.find((m) => m.id === id) ?? modosEntrega[0]!;
}

/** Aviso obrigatório em todos os formulários de emissão e entrega. */
export const AVISO_SENSIVEL =
  "Nunca informe senha, PIN, chave privada, código de recuperação ou arquivo de certificado (.pfx / .p12). Esses dados não são solicitados, transportados nem armazenados pela AR.";

export interface AutorRegistro {
  id: string;
  nome: string;
  quando: string;
}

export interface RegistroEmissao {
  emissaoId: string;
  requestId: string;
  resultado: ResultadoEmissao;
  ac: string;
  protocoloExterno: string;
  numeroSerie: string;
  dataEmissao: string;
  validade: string;
  comprovante: string;
  observacao?: string;
  registradoPor: AutorRegistro;
  conferencia?: {
    decisao: "confirmada" | "devolvida";
    motivo?: string;
    por: AutorRegistro;
  };
  entrega?: {
    modo: ModoEntrega;
    referencia?: string;
    observacao?: string;
    por: AutorRegistro;
    falha?: string;
  };
  entregue?: AutorRegistro;
  instalacao?: AutorRegistro & { observacao?: string };
  emUso?: AutorRegistro;
  revogacao?: AutorRegistro & { motivo: string };
}

/** Estado do ciclo derivado exclusivamente do registro operacional. */
export function cicloDoRegistro(reg: RegistroEmissao): CicloEmissao {
  if (reg.revogacao) return "revogada";
  if (reg.resultado === "rejeitada") return "rejeitada";
  if (reg.resultado === "erro") return "erro";
  if (reg.resultado === "pendente") return "pendente-na-ac";
  if (!reg.conferencia) return "aguardando-conferencia";
  if (reg.conferencia.decisao === "devolvida") return "devolvida";
  if (reg.emUso) return "em-uso";
  if (reg.instalacao) return "instalacao-confirmada";
  if (reg.entregue) return "entregue";
  if (reg.entrega) return "entrega-pendente";
  return "emitida-confirmada";
}

export function cicloConcluido(c: CicloEmissao) {
  return c === "em-uso" || c === "revogada";
}

/** Tom visual do chip por ciclo — mantém a mesma linguagem do restante da tela. */
export function estadoDoCiclo(
  c: CicloEmissao,
): "concluido" | "pronto" | "pendente" | "bloqueado" | "na" {
  if (c === "em-uso" || c === "instalacao-confirmada") return "concluido";
  if (c === "emitida-confirmada" || c === "entregue" || c === "pronta-para-emissao")
    return "pronto";
  if (
    c === "rejeitada" ||
    c === "erro" ||
    c === "bloqueada" ||
    c === "devolvida" ||
    c === "revogada"
  )
    return "bloqueado";
  if (c === "planejada") return "na";
  return "pendente";
}

export interface PermissaoAcaoEmissao {
  permitido: boolean;
  motivo?: string;
}

const ok: PermissaoAcaoEmissao = { permitido: true };
const nao = (motivo: string): PermissaoAcaoEmissao => ({ permitido: false, motivo });

export function podeRegistrarEmissao(
  ciclo: CicloEmissao,
  contexto: {
    bloqueio?: string | undefined;
    pagamentoOk: boolean;
    dossieOk: boolean;
    validacaoOk: boolean;
  },
): PermissaoAcaoEmissao {
  if (contexto.bloqueio) return nao(contexto.bloqueio);
  if (ciclo === "aguardando-conferencia")
    return nao("Já existe um registro aguardando conferência de outro operador.");
  if (
    cicloConcluido(ciclo) ||
    ciclo === "emitida-confirmada" ||
    ciclo === "entrega-pendente" ||
    ciclo === "entregue" ||
    ciclo === "instalacao-confirmada"
  )
    return nao("Esta emissão já foi confirmada — use as ações de entrega.");
  if (!contexto.pagamentoOk) return nao("Pagamento desta emissão não está liberado.");
  if (!contexto.validacaoOk) return nao("Validação desta emissão ainda não foi concluída.");
  if (!contexto.dossieOk)
    return nao("Portões documentais aplicáveis a esta emissão ainda não foram liberados.");
  return ok;
}

export function podeConferir(
  reg: RegistroEmissao | undefined,
  operadorId: string,
): PermissaoAcaoEmissao {
  if (!reg) return nao("Nenhum registro de emissão manual para conferir.");
  if (cicloDoRegistro(reg) !== "aguardando-conferencia")
    return nao("Só é possível conferir um registro que está aguardando conferência.");
  if (reg.registradoPor.id === operadorId)
    return nao("Quem registrou a emissão não pode conferi-la — troque para outro operador.");
  return ok;
}

export function podeEntregar(ciclo: CicloEmissao): PermissaoAcaoEmissao {
  if (ciclo === "emitida-confirmada" || ciclo === "entrega-pendente") return ok;
  return nao("A entrega só abre depois da emissão confirmada por um segundo operador.");
}

export function podeConfirmarEntregue(ciclo: CicloEmissao): PermissaoAcaoEmissao {
  return ciclo === "entrega-pendente"
    ? ok
    : nao("Escolha primeiro a forma de entrega desta emissão.");
}

export function podeConfirmarInstalacao(ciclo: CicloEmissao): PermissaoAcaoEmissao {
  return ciclo === "entregue"
    ? ok
    : nao("Confirme a entrega ao titular antes da instalação/ativação.");
}

export function podeColocarEmUso(ciclo: CicloEmissao): PermissaoAcaoEmissao {
  return ciclo === "instalacao-confirmada"
    ? ok
    : nao("A instalação/ativação precisa estar confirmada com o titular.");
}

/** Emissão relacionada criada por ação explícita de elegibilidade. */
export interface EmissaoRelacionada {
  id: string;
  requestId: string;
  produto: string;
  titular: string;
  papelTitular: string;
  ac: string;
  modalidade: string;
  condicaoComercial: string;
  valor: number;
  motivoElegibilidade: string;
  criadaPor: AutorRegistro;
}
