// Modelo de leitura da área Operação: marcos, prontidão, ações permitidas e fila de tarefas.
// Tudo derivado de forma determinística das solicitações — protótipo sem backend.
import {
  agentById,
  agents,
  stages,
  type Priority,
  type Request,
  type StageId,
} from "@/lib/mock-data";
import { contadorDoCliente } from "@/lib/contadores-data";

export type MarcoId = "captacao" | "preparacao" | "validacao" | "emissao" | "entrega" | "emuso";

export const marcos: { id: MarcoId; nome: string; descricao: string }[] = [
  { id: "captacao", nome: "Captação", descricao: "Pedido recebido e qualificado" },
  { id: "preparacao", nome: "Preparação", descricao: "Dossiê em montagem" },
  { id: "validacao", nome: "Validação", descricao: "Conferência e identificação" },
  { id: "emissao", nome: "Emissão", descricao: "Geração do certificado" },
  { id: "entrega", nome: "Entrega", descricao: "Instalação e repasse ao titular" },
  { id: "emuso", nome: "Em uso", descricao: "Certificado ativo com o titular" },
];

const ordemStage = (s: StageId) => stages.findIndex((x) => x.id === s);

export function marcoDe(r: Request): MarcoId {
  if (r.stage === "bloqueado") {
    const ratio = r.checklist.length ? r.checklist.filter((c) => c.done).length / r.checklist.length : 0;
    return ratio < 0.34 ? "preparacao" : ratio < 0.67 ? "validacao" : "emissao";
  }
  switch (r.stage) {
    case "novo":
      return "captacao";
    case "documentacao":
      return "preparacao";
    case "validacao":
    case "agendamento":
    case "videoconferencia":
      return "validacao";
    case "emissao":
      return "emissao";
    default:
      return r.checklist.every((c) => c.done) ? "emuso" : "entrega";
  }
}

// ---------------------------------------------------------------- prontidão

export type EstadoProntidao = "pronto" | "pendente" | "bloqueado" | "na";
export type TrilhaId = "comercial" | "atendimento" | "regulatoria" | "emissao" | "entrega";

export const trilhas: { id: TrilhaId; nome: string; curto: string }[] = [
  { id: "comercial", nome: "Comercial", curto: "Com" },
  { id: "atendimento", nome: "Atendimento", curto: "Atd" },
  { id: "regulatoria", nome: "Regulatória", curto: "Reg" },
  { id: "emissao", nome: "Emissão", curto: "Emi" },
  { id: "entrega", nome: "Entrega", curto: "Ent" },
];

export const rotuloProntidao: Record<EstadoProntidao, string> = {
  pronto: "Pronto",
  pendente: "Pendente",
  bloqueado: "Bloqueado",
  na: "Não aplicável",
};

export function prontidaoDe(r: Request): Record<TrilhaId, EstadoProntidao> {
  const idx = ordemStage(r.stage);
  const travado = r.stage === "bloqueado";
  const feitos = r.checklist.filter((c) => c.done).length;
  const completo = r.checklist.length > 0 && feitos === r.checklist.length;

  return {
    comercial: idx >= 1 || travado ? "pronto" : "pendente",
    atendimento: travado ? "bloqueado" : idx >= 2 ? "pronto" : idx >= 1 ? "pendente" : "na",
    regulatoria: travado ? "bloqueado" : idx >= 5 ? "pronto" : idx >= 2 ? "pendente" : "na",
    emissao: idx >= 6 ? "pronto" : idx === 5 ? "pendente" : "na",
    entrega: idx >= 6 ? (completo ? "pronto" : "pendente") : "na",
  };
}

// -------------------------------------------------------- ações e bloqueios

export interface AcaoCaso {
  id: string;
  label: string;
  descricao: string;
  destino?: StageId;
  destrutiva?: boolean;
  regulatoria?: boolean;
}

const proximoStage: Partial<Record<StageId, StageId>> = {
  novo: "documentacao",
  documentacao: "validacao",
  validacao: "agendamento",
  agendamento: "videoconferencia",
  videoconferencia: "emissao",
  emissao: "concluido",
};

export function acoesDe(r: Request): AcaoCaso[] {
  const lista: AcaoCaso[] = [];
  const destino = proximoStage[r.stage];
  if (r.stage === "bloqueado") {
    lista.push({
      id: "retomar",
      label: "Retomar caso",
      descricao: "Devolve o caso para a preparação do dossiê.",
      destino: "documentacao",
    });
  } else if (destino) {
    const nome = stages.find((s) => s.id === destino)?.nome ?? destino;
    lista.push({
      id: "avancar",
      label: `Avançar para ${nome}`,
      descricao: "Conclui a etapa atual e transfere a responsabilidade.",
      destino,
      regulatoria: destino === "videoconferencia" || destino === "emissao",
    });
  }
  lista.push({
    id: "assumir",
    label: "Assumir o caso",
    descricao: "Você passa a ser o responsável atual pelo atendimento.",
  });
  lista.push({
    id: "priorizar",
    label: r.prioridade === "critica" ? "Reduzir para alta" : "Elevar prioridade",
    descricao: "Altera a posição do caso nas filas de trabalho.",
  });
  if (r.stage !== "bloqueado" && r.stage !== "concluido") {
    lista.push({
      id: "bloquear",
      label: "Registrar bloqueio",
      descricao: "Sinaliza impedimento e retira o caso da fila produtiva.",
      destino: "bloqueado",
      destrutiva: true,
    });
  }
  return lista;
}

export function pendenciasDe(r: Request) {
  return r.checklist.filter((c) => !c.done);
}

/** Motivo pelo qual uma ação de avanço está impedida — null quando liberada. */
export function impedimentoDe(r: Request, acao: AcaoCaso): string | null {
  if (!acao.destino || acao.destino === "bloqueado" || acao.id === "retomar") return null;
  const pendentes = pendenciasDe(r);
  if (pendentes.length === 0) return null;
  return `${pendentes.length} requisito(s) da etapa ainda não concluído(s): ${pendentes
    .slice(0, 3)
    .map((p) => p.label)
    .join(", ")}${pendentes.length > 3 ? "…" : ""}`;
}

export function bloqueioPrincipal(r: Request): string {
  if (r.stage === "bloqueado") return "Impedimento operacional registrado";
  const pendentes = pendenciasDe(r);
  if (pendentes.length === 0) return "Sem bloqueio — pronto para avançar";
  return pendentes[0]!.label;
}

export function proximaAcaoLabel(r: Request): string {
  const acoes = acoesDe(r);
  return acoes[0]?.label ?? "Acompanhar";
}

// ------------------------------------------------------------------- perfis

export type PerfilId = "vd" | "vi" | "agr" | "montadora" | "verificadora" | "financeiro" | "entrega";

export const perfis: { id: PerfilId; sigla: string; nome: string; descricao: string; agenteId: string }[] = [
  { id: "vd", sigla: "VD", nome: "Vendas Diretas", descricao: "Captação própria e balcão", agenteId: "a4" },
  { id: "vi", sigla: "VI", nome: "Vendas Indiretas", descricao: "Casos vindos de contabilidades", agenteId: "a4" },
  { id: "agr", sigla: "AGR", nome: "Agente de Registro", descricao: "Identificação e emissão", agenteId: "a1" },
  { id: "montadora", sigla: "MD", nome: "Montadora de dossiê", descricao: "Coleta e organização documental", agenteId: "a3" },
  { id: "verificadora", sigla: "VF", nome: "Verificadora", descricao: "Conferência documental", agenteId: "a3" },
  { id: "financeiro", sigla: "FIN", nome: "Financeiro", descricao: "Pagamento e liberação", agenteId: "a5" },
  { id: "entrega", sigla: "SE", nome: "Suporte de entrega", descricao: "Instalação e pós-emissão", agenteId: "a2" },
];

export function perfilById(id: PerfilId) {
  return perfis.find((p) => p.id === id) ?? perfis[0]!;
}

/** Papel que o fluxo espera na etapa atual do caso. */
export function papelEsperado(r: Request): PerfilId {
  if (r.stage === "bloqueado") return "financeiro";
  switch (r.stage) {
    case "novo":
      return r.canal === "Parceiro" ? "vi" : "vd";
    case "documentacao":
      return "montadora";
    case "validacao":
      return "verificadora";
    case "agendamento":
    case "videoconferencia":
    case "emissao":
      return "agr";
    default:
      return "entrega";
  }
}

// -------------------------------------------------------------------- fila

export type TipoPendencia = "documento" | "conferencia" | "identificacao" | "pagamento" | "entrega" | "contato";

export interface Tarefa {
  id: string;
  request: Request;
  acao: string;
  papel: PerfilId;
  tipo: TipoPendencia;
  motivo: string;
  aguardando: string;
  proximoResponsavel: string;
  prazoHoras: number;
  prioridade: Priority;
  origem: string;
  atribuida: boolean;
}

const tipoPorPapel: Record<PerfilId, TipoPendencia> = {
  vd: "contato",
  vi: "contato",
  montadora: "documento",
  verificadora: "conferencia",
  agr: "identificacao",
  financeiro: "pagamento",
  entrega: "entrega",
};

export function origemDe(r: Request): string {
  const contador = contadorDoCliente(r.clienteId);
  if (contador) return `Contabilidade ${contador.nome}`;
  return `Canal ${r.canal}`;
}

export function tarefaDe(r: Request): Tarefa {
  const papel = papelEsperado(r);
  const responsavel = agentById(r.responsavelId);
  const perfil = perfilById(papel);
  const esperado = agentById(perfil.agenteId);
  return {
    id: `tk-${r.id}`,
    request: r,
    acao: proximaAcaoLabel(r),
    papel,
    tipo: tipoPorPapel[papel],
    motivo: bloqueioPrincipal(r),
    aguardando:
      r.stage === "bloqueado"
        ? "Operação aguarda o cliente regularizar"
        : `${perfil.nome} aguarda ${r.stage === "novo" ? "o cliente" : "a etapa anterior"}`,
    proximoResponsavel: esperado.nome,
    prazoHoras: r.slaRestanteHoras,
    prioridade: r.prioridade,
    origem: origemDe(r),
    atribuida: responsavel.id === perfil.agenteId,
  };
}

export function tarefasDe(requests: Request[]): Tarefa[] {
  return requests.filter((r) => r.stage !== "concluido").map(tarefaDe);
}

export const unidades = ["Matriz São Paulo", "Filial Campinas", "Filial Belo Horizonte", "Remoto"] as const;

/** Unidade determinística por caso (protótipo). */
export function unidadeDe(r: Request) {
  const soma = [...r.id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return unidades[soma % unidades.length]!;
}

export const agentesOperacao = agents;
