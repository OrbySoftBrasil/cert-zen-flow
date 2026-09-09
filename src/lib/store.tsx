// Estado global do protótipo: transforma os mocks estáticos em dados vivos.
// Persistido em localStorage para que as ações do usuário sobrevivam à navegação
// e ao refresh — é o que faz o protótipo se comportar como produto real.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  agents,
  itensChecklist,
  type ChecklistItem,
  type EspecItem,
  type RegistroHistoricoRequisito,
  appointments as seedAppointments,
  clients as seedClients,
  requests as seedRequests,
  tickets as seedTickets,
  stages,
  type Appointment,
  type Certificate,
  type CertType,
  type Channel,
  type Client,
  type DocumentFile,
  type EvidenciaRequisito,
  type Priority,
  type Request,
  type StageId,
  type Ticket,
  type TicketCategoria,
  type TimelineEvent,
} from "@/lib/mock-data";
import {
  avaliarAcao,
  categoriaInfo,
  documentosCompativeis,
  origemLabel,
  politicaNaoAplicavelDe,
} from "@/lib/checklist-model";
import { emissoesDoCaso } from "@/lib/caso-model";
import { MARCO_POR_STAGE, itensDoPerfil, type PerfilOperacional } from "@/lib/opconfig-model";
import { cenarioAppointments, cenarioRegistros, cenarioRequests } from "@/lib/cenarios";
import {
  type AutorRegistro,
  type EmissaoRelacionada,
  type ModoEntrega,
  type RegistroEmissao,
} from "@/lib/emissao-model";
import { contadores as seedContadores, type Contador } from "@/lib/contadores-data";

import {
  pagar as seedPagar,
  receber as seedReceber,
  planos as seedPlanos,
  contratos as seedContratos,
  comissoes as seedComissoes,
  regrasComissao as seedRegras,
  type Comissao,
  type Contrato,
  type Pagar,
  type Plano,
  type Receber,
  type RegraComissao,
} from "@/lib/finance-data";

const STORAGE_KEY = "certus-ac-estado-v3";

export const USUARIO_ATUAL = { id: "a1", nome: "Marina Duarte", papel: "Agente de Registro" };

export interface AppState {
  clients: Client[];
  requests: Request[];
  tickets: Ticket[];
  appointments: Appointment[];
  contadores: Contador[];
  pagar: Pagar[];
  receber: Receber[];
  planos: Plano[];
  contratos: Contrato[];
  comissoes: Comissao[];
  regrasComissao: RegraComissao[];
  /** Ciclo operacional de cada emissão, por id da emissão. */
  emissoes: Record<string, RegistroEmissao>;
  /** Emissões criadas por ação explícita de elegibilidade, por caso. */
  emissoesExtras: Record<string, EmissaoRelacionada[]>;
  /** Operador em uso — permite demonstrar a segregação entre registro e conferência. */
  operadorId: string;
}

function seed(): AppState {
  return {
    clients: seedClients,
    requests: [...cenarioRequests, ...seedRequests],
    tickets: seedTickets,
    appointments: [...cenarioAppointments, ...seedAppointments],

    contadores: seedContadores,
    pagar: seedPagar,
    receber: seedReceber,
    planos: seedPlanos,
    contratos: seedContratos,
    comissoes: seedComissoes,
    regrasComissao: seedRegras,
    emissoes: Object.fromEntries(cenarioRegistros.map((r) => [r.emissaoId, r])),
    emissoesExtras: {},
    operadorId: USUARIO_ATUAL.id,
  };
}

function agora() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

function evento(
  titulo: string,
  detalhe?: string,
  tipo: TimelineEvent["tipo"] = "humano",
): TimelineEvent {
  return {
    id: uid("ev"),
    quando: agora(),
    autor: USUARIO_ATUAL.nome,
    titulo,
    tipo,
    ...(detalhe ? { detalhe } : {}),
  };
}

function autorDe(agenteId: string): AutorRegistro {
  const a = agents.find((x) => x.id === agenteId);
  return { id: agenteId, nome: a?.nome ?? USUARIO_ATUAL.nome, quando: agora() };
}

/** Acrescenta um evento à trilha do caso preservando a autoria informada. */
function comEvento(
  s: AppState,
  requestId: string,
  titulo: string,
  detalhe: string | undefined,
  tipo: TimelineEvent["tipo"],
  autor: string,
): Request[] {
  return s.requests.map((r) =>
    r.id === requestId
      ? {
          ...r,
          timeline: [
            ...r.timeline,
            {
              id: uid("ev"),
              quando: agora(),
              autor,
              titulo,
              tipo,
              ...(detalhe ? { detalhe } : {}),
            },
          ],
        }
      : r,
  );
}

export interface NovaSolicitacaoInput {
  clienteId: string;
  tipo: CertType;
  valor: number;
  canal: Channel;
  prioridade: Priority;
  responsavelId: string;
  slaHoras: number;
  observacao?: string;
}

export interface NovoClienteInput {
  nome: string;
  documento: string;
  tipoPessoa: "PF" | "PJ";
  email: string;
  telefone: string;
  cidade: string;
  gestor: string;
  contadorId?: string;
}

export interface NovoChamadoInput {
  clienteId: string;
  assunto: string;
  categoria: TicketCategoria;
  subcategoria: string;
  canal: Channel;
  prioridade: Priority;
  responsavelId: string;
  descricao: string;
  contato?: string;
  clienteNome?: string;
  tags?: string[];
}

export interface NovoAgendamentoInput {
  clienteId: string;
  tipo: CertType;
  agenteId: string;
  dia: string;
  hora: string;
  duracaoMin: number;
  sala: string;
  clienteNome?: string;
}

interface Actions {
  reset: () => void;
  // clientes
  addClient: (input: NovoClienteInput) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  addClientNote: (id: string, texto: string) => void;
  setDocumentStatus: (
    clienteId: string,
    docId: string,
    status: DocumentFile["status"],
    motivo?: string,
  ) => void;
  addDocument: (clienteId: string, doc: Omit<DocumentFile, "id">) => void;
  revokeCertificate: (clienteId: string, certId: string, motivo: string) => void;
  // solicitações
  addRequest: (input: NovaSolicitacaoInput) => Request;
  updateRequest: (id: string, patch: Partial<Request>) => void;
  /**
   * Move a etapa. Quando `guard.acao` é informado, o portão do checklist é
   * reavaliado no momento da execução e a transição é recusada se bloqueada.
   */
  moveRequest: (
    id: string,
    stage: StageId,
    detalhe?: string,
    guard?: { acao: string; emissaoId?: string },
  ) => void;
  /** Avaliação central de portões para uma ação protegida do caso. */
  avaliarAcaoDoCaso: (
    requestId: string,
    acao: string,
    emissaoId?: string,
  ) => import("@/lib/checklist-model").AvaliacaoAcao;
  /** Satisfaz um requisito com a evidência do modo configurado. */
  cumprirRequisito: (
    requestId: string,
    itemId: string,
    evidencia: Omit<EvidenciaRequisito, "por" | "registradoEm">,
    opcoes?: { anexarAoDossie?: boolean },
  ) => void;
  /** Vincula um documento já existente do dossiê ao requisito (sem duplicar arquivo). */
  reutilizarDocumento: (requestId: string, itemId: string, documentoId: string) => void;
  /**
   * Marca o requisito como não aplicável por regra do produto ou dispensado por
   * exceção controlada. Requisitos de plataforma/AC recusam a dispensa.
   */
  naoAplicarRequisito: (
    requestId: string,
    itemId: string,
    motivo: string,
    regra: string,
    tipo?: "regra" | "excecao",
  ) => void;
  /** Pede o item ao cliente — o requisito fica aguardando informação. */
  solicitarAoCliente: (requestId: string, itemId: string, mensagem: string) => void;
  reabrirRequisito: (requestId: string, itemId: string, motivo: string) => void;
  logRequest: (
    requestId: string,
    titulo: string,
    detalhe?: string,
    tipo?: TimelineEvent["tipo"],
  ) => void;
  // emissões (ciclo por emissão)
  setOperador: (agenteId: string) => void;
  registrarEmissaoManual: (
    requestId: string,
    emissaoId: string,
    dados: Pick<
      RegistroEmissao,
      | "resultado"
      | "ac"
      | "protocoloExterno"
      | "numeroSerie"
      | "dataEmissao"
      | "validade"
      | "comprovante"
    > & { observacao?: string; produto?: string },
  ) => void;
  conferirEmissao: (
    emissaoId: string,
    decisao: "confirmada" | "devolvida",
    motivo?: string,
  ) => void;
  definirEntrega: (
    emissaoId: string,
    modo: ModoEntrega,
    referencia?: string,
    observacao?: string,
  ) => void;
  registrarFalhaEntrega: (emissaoId: string, motivo: string) => void;
  confirmarEntregue: (emissaoId: string, observacao?: string) => void;
  confirmarInstalacao: (emissaoId: string, observacao?: string) => void;
  confirmarEmUso: (emissaoId: string) => void;
  revogarEmissao: (emissaoId: string, motivo: string) => void;
  criarEmissaoRelacionada: (
    requestId: string,
    dados: Omit<EmissaoRelacionada, "id" | "requestId" | "criadaPor">,
  ) => void;
  issueCertificate: (requestId: string) => Certificate | undefined;
  // agenda
  addAppointment: (input: NovoAgendamentoInput) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  // chamados
  addTicket: (input: NovoChamadoInput) => Ticket;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  addTicketMessage: (
    id: string,
    texto: string,
    papel?: "cliente" | "suporte" | "sistema",
    autor?: string,
  ) => void;
  // financeiro
  addPagar: (t: Omit<Pagar, "id">) => void;
  addReceber: (t: Omit<Receber, "id">) => void;
  updatePagar: (id: string, patch: Partial<Pagar>) => void;
  updateReceber: (id: string, patch: Partial<Receber>) => void;
  addPlano: (p: Omit<Plano, "id">) => Plano;
  updatePlano: (id: string, patch: Partial<Plano>) => void;
  removePlano: (id: string) => void;
  addContrato: (c: Omit<Contrato, "id">) => Contrato;
  updateContrato: (id: string, patch: Partial<Contrato>) => void;
  addComissao: (c: Omit<Comissao, "id">) => Comissao;
  updateComissao: (id: string, patch: Partial<Comissao>) => void;
  addRegraComissao: (r: Omit<RegraComissao, "id">) => RegraComissao;
  updateRegraComissao: (id: string, patch: Partial<RegraComissao>) => void;
  removeRegraComissao: (id: string) => void;
  // parceiros
  addContador: (
    c: Pick<
      Contador,
      | "nome"
      | "razaoSocial"
      | "cnpj"
      | "crc"
      | "responsavel"
      | "email"
      | "telefone"
      | "cidade"
      | "gestor"
      | "comissaoPercentual"
      | "metaMes"
    >,
  ) => Contador;
  updateContador: (id: string, patch: Partial<Contador>) => void;
}

const Ctx = createContext<(AppState & Actions) | null>(null);

const checklistPorEtapa: Record<StageId, EspecItem[]> = {
  novo: [
    { label: "Confirmar dados do titular", modo: "confirmacao", escopo: "titular" },
    {
      label: "Pagamento da emissão",
      modo: "derivado",
      chaveDerivada: "pagamento",
      escopo: "emissao",
      bloqueia: "Aprovar emissão",
    },
  ],
  documentacao: [
    {
      label: "Documento de identidade",
      modo: "documento",
      categoriaDoc: "identidade",
      escopo: "titular",
      bloqueia: "Enviar dossiê para verificação",
    },
    {
      label: "Comprovante de endereço",
      modo: "documento",
      categoriaDoc: "endereco",
      escopo: "titular",
      validadeDias: 90,
      bloqueia: "Enviar dossiê para verificação",
    },
    {
      label: "Contrato social / procuração",
      modo: "documento",
      categoriaDoc: "contrato-social",
      escopo: "organizacao",
      obrigatorio: false,
    },
  ],
  validacao: [
    {
      label: "Consulta à Lista Negativa",
      modo: "acao",
      acaoProduto: "registrar-consulta",
      escopo: "titular",
      bloqueia: "Aprovar emissão",
    },
    {
      label: "Resultado da validação",
      modo: "acao",
      acaoProduto: "registrar-validacao",
      escopo: "emissao",
      bloqueia: "Aprovar emissão",
    },
    {
      label: "Parecer do agente de registro",
      modo: "decisao",
      escopo: "caso",
      exigeAprovacao: true,
      bloqueia: "Aprovar emissão",
    },
  ],
  agendamento: [
    {
      label: "Agendamento criado",
      modo: "derivado",
      chaveDerivada: "agendamento",
      escopo: "atendimento",
    },
    {
      label: "Titular orientado sobre o horário",
      modo: "confirmacao",
      escopo: "atendimento",
      obrigatorio: false,
    },
  ],
  videoconferencia: [
    {
      label: "Gravação da sessão",
      modo: "documento",
      categoriaDoc: "gravacao",
      escopo: "atendimento",
    },
    {
      label: "Termo de titularidade assinado",
      modo: "documento",
      categoriaDoc: "termo-assinado",
      escopo: "titular",
    },
  ],
  emissao: [
    {
      label: "Emissão registrada",
      modo: "acao",
      acaoProduto: "registrar-emissao-manual",
      escopo: "emissao",
      bloqueia: "Liberar entrega",
    },
    { label: "Entrega confirmada", modo: "derivado", chaveDerivada: "entrega", escopo: "emissao" },
  ],
  concluido: [
    {
      label: "Instalação e funcionamento confirmados",
      modo: "derivado",
      chaveDerivada: "instalacao",
      escopo: "emissao",
    },
    {
      label: "Orientar o titular a manter o token conectado",
      modo: "orientacao",
      obrigatorio: false,
    },
  ],
  bloqueado: [{ label: "Registrar impedimento", modo: "confirmacao", observacaoObrigatoria: true }],
};

/** Lê o perfil operacional PUBLICADO (a mesma fonte de "Operação & perfis"). */
function perfilPublicado(): { versao: string; perfil: PerfilOperacional } | null {
  try {
    const raw = window.localStorage.getItem("certus-opconfig-v1");
    if (!raw) return null;
    const p = JSON.parse(raw) as { publicada?: PerfilOperacional & { numero?: string } };
    if (!p.publicada?.etapas?.length) return null;
    return { versao: p.publicada.numero ?? "v1", perfil: p.publicada };
  } catch {
    return null;
  }
}

/**
 * Requisitos da etapa. A configuração publicada é a fonte; a lista interna só
 * atende ambientes sem configuração salva (primeiro acesso).
 */
function itensDeEtapa(stage: StageId) {
  const pub = perfilPublicado();
  const marco = MARCO_POR_STAGE[stage];
  const doPerfil = pub && marco ? itensDoPerfil(pub.perfil, marco) : [];
  const base = doPerfil.length > 0 ? doPerfil : (checklistPorEtapa[stage] ?? []);
  return itensChecklist(base as never).map((i) => ({ ...i, id: uid("ck") }));
}

/** Versão do perfil que originou o fluxo do caso (casos antigos não mudam). */
function versaoPerfilAtual() {
  return perfilPublicado()?.versao ?? "v1";
}

function comHistorico(
  c: ChecklistItem,
  acao: string,
  detalhe?: string,
): RegistroHistoricoRequisito[] {
  return [
    ...(c.historico ?? []),
    {
      id: uid("h"),
      quando: agora(),
      por: USUARIO_ATUAL.nome,
      acao,
      ...(detalhe ? { detalhe } : {}),
    },
  ];
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(seed);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...seed(), ...(JSON.parse(raw) as AppState) });
    } catch {
      /* estado inicial */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* cota indisponível */
    }
  }, [state]);

  const patchClient = useCallback((id: string, fn: (c: Client) => Client) => {
    setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? fn(c) : c)) }));
  }, []);

  const patchRequest = useCallback((id: string, fn: (r: Request) => Request) => {
    setState((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? fn(r) : r)) }));
  }, []);

  const actions = useMemo<Actions>(() => {
    const A: Actions = {
      reset: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
        setState(seed());
      },

      addClient: (input) => {
        const cliente: Client = {
          id: uid("c"),
          nome: input.nome,
          documento: input.documento,
          tipoPessoa: input.tipoPessoa,
          email: input.email,
          telefone: input.telefone,
          cidade: input.cidade,
          desde: hojeIso(),
          ltv: 0,
          saude: 80,
          gestor: input.gestor,
          certificados: [],
          faturas: [],
          documentos: [],
          notas: [
            {
              id: uid("n"),
              quando: agora(),
              autor: USUARIO_ATUAL.nome,
              texto: "Cliente cadastrado no sistema.",
            },
          ],
        };
        setState((s) => ({ ...s, clients: [cliente, ...s.clients] }));
        return cliente;
      },

      updateClient: (id, patch) => patchClient(id, (c) => ({ ...c, ...patch })),

      addClientNote: (id, texto) =>
        patchClient(id, (c) => ({
          ...c,
          notas: [{ id: uid("n"), quando: agora(), autor: USUARIO_ATUAL.nome, texto }, ...c.notas],
        })),

      setDocumentStatus: (clienteId, docId, status, motivo) =>
        patchClient(clienteId, (c) => ({
          ...c,
          documentos: c.documentos.map((d) =>
            d.id === docId ? { ...d, status, ...(motivo ? { motivo } : {}) } : d,
          ),
        })),

      addDocument: (clienteId, doc) =>
        patchClient(clienteId, (c) => ({
          ...c,
          documentos: [{ id: uid("d"), ...doc }, ...c.documentos],
        })),

      revokeCertificate: (clienteId, certId, motivo) =>
        patchClient(clienteId, (c) => ({
          ...c,
          certificados: c.certificados.map((x) =>
            x.id === certId ? { ...x, status: "revogado" } : x,
          ),
          notas: [
            {
              id: uid("n"),
              quando: agora(),
              autor: USUARIO_ATUAL.nome,
              texto: `Certificado revogado — ${motivo}`,
            },
            ...c.notas,
          ],
        })),

      addRequest: (input) => {
        let cliente: Client | undefined;
        setState((s) => {
          cliente = s.clients.find((c) => c.id === input.clienteId);
          return s;
        });
        const alvo = cliente ?? seedClients.find((c) => c.id === input.clienteId);
        const nova: Request = {
          id: uid("r"),
          protocolo: `SOL-${Math.floor(10000 + Math.random() * 89999)}`,
          clienteId: input.clienteId,
          cliente: alvo?.nome ?? "Cliente",
          documento: alvo?.documento ?? "",
          tipo: input.tipo,
          valor: input.valor,
          stage: "novo",
          responsavelId: input.responsavelId,
          canal: input.canal,
          prioridade: input.prioridade,
          abertoEm: hojeIso(),
          slaHoras: input.slaHoras,
          slaRestanteHoras: input.slaHoras,
          tags: ["nova"],
          checklist: itensDeEtapa("novo"),
          perfilVersao: versaoPerfilAtual(),
          timeline: [
            evento("Solicitação criada", `${input.tipo} · canal ${input.canal}`, "sistema"),
            ...(input.observacao ? [evento("Observação de abertura", input.observacao)] : []),
          ],
        };
        setState((s) => ({ ...s, requests: [nova, ...s.requests] }));
        return nova;
      },

      updateRequest: (id, patch) => patchRequest(id, (r) => ({ ...r, ...patch })),

      avaliarAcaoDoCaso: (requestId, acao, emissaoId) => {
        const r = state.requests.find((x) => x.id === requestId);
        if (!r) return { permitida: true, portoes: [], explicacao: null };
        const cli = state.clients.find((c) => c.id === r.clienteId);
        return avaliarAcao(
          acao,
          {
            request: r,
            ...(cli ? { cliente: cli } : {}),
            emissoes: emissoesDoCaso(r, state.emissoesExtras[r.id] ?? []),
          },
          emissaoId ? { emissaoId } : {},
        );
      },

      moveRequest: (id, stage, detalhe, guard) =>
        patchRequest(id, (r) => {
          // Revalidação no momento da execução: uma tela desatualizada não
          // pode contornar um portão obrigatório.
          if (guard?.acao) {
            const cli = state.clients.find((c) => c.id === r.clienteId);
            const ctx = {
              request: r,
              ...(cli ? { cliente: cli } : {}),
              emissoes: emissoesDoCaso(r, state.emissoesExtras[r.id] ?? []),
            };
            const av = avaliarAcao(
              guard.acao,
              ctx,
              guard.emissaoId ? { emissaoId: guard.emissaoId } : {},
            );
            if (!av.permitida) {
              return {
                ...r,
                timeline: [
                  ...r.timeline,
                  evento(`Ação bloqueada: ${guard.acao}`, av.explicacao ?? undefined, "alerta"),
                ],
              };
            }
          }
          const nome = stages.find((s) => s.id === stage)?.nome ?? stage;
          const novos = itensDeEtapa(stage).filter(
            (n) => !r.checklist.some((c) => c.label === n.label),
          );
          return {
            ...r,
            stage,
            checklist: [...r.checklist, ...novos],
            timeline: [
              ...r.timeline,
              evento(
                `Etapa alterada para ${nome}`,
                detalhe,
                stage === "bloqueado" ? "alerta" : "sistema",
              ),
            ],
          };
        }),

      cumprirRequisito: (requestId, itemId, dados, opcoes) => {
        const evidencia: EvidenciaRequisito = {
          ...dados,
          por: USUARIO_ATUAL.nome,
          registradoEm: agora(),
        };
        setState((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          const item = req?.checklist.find((c) => c.id === itemId);
          if (!req || !item) return s;
          const detalhe = [
            evidencia.referencia,
            evidencia.arquivo,
            evidencia.fonte,
            evidencia.resultado,
            evidencia.valor,
            evidencia.observacao,
          ]
            .filter(Boolean)
            .join(" · ");
          // Só novos envios viram documento do dossiê. Reutilização nunca duplica arquivo.
          const anexo =
            opcoes?.anexarAoDossie !== false && evidencia.origem === "nova"
              ? evidencia.arquivo
              : undefined;
          const categoria = item.categoriaDoc
            ? categoriaInfo(item.categoriaDoc).nome
            : (evidencia.referencia ?? item.label);
          return {
            ...s,
            requests: s.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    checklist: r.checklist.map((c) =>
                      c.id === itemId
                        ? {
                            ...c,
                            done: true,
                            evidencia,
                            historico: comHistorico(
                              c,
                              `Requisito atendido (${origemLabel(evidencia.origem)})`,
                              detalhe || undefined,
                            ),
                          }
                        : c,
                    ),
                    timeline: [
                      ...r.timeline,
                      evento(
                        `${origemLabel(evidencia.origem)}: ${item.label}`,
                        detalhe || undefined,
                        "humano",
                      ),
                    ],
                  }
                : r,
            ),
            clients: anexo
              ? s.clients.map((c) =>
                  c.id === req.clienteId
                    ? {
                        ...c,
                        documentos: [
                          {
                            id: uid("d"),
                            nome: anexo,
                            tipo: categoria,
                            enviadoEm: hojeIso(),
                            status: "em análise" as const,
                          },
                          // versões anteriores da mesma categoria ficam marcadas
                          ...c.documentos.map((d) =>
                            d.tipo === categoria ? { ...d, substituido: true } : d,
                          ),
                        ],
                      }
                    : c,
                )
              : s.clients,
          };
        });
      },

      reutilizarDocumento: (requestId, itemId, documentoId) =>
        setState((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          const item = req?.checklist.find((c) => c.id === itemId);
          const cliente = s.clients.find((c) => c.id === req?.clienteId);
          const doc = cliente?.documentos.find((d) => d.id === documentoId);
          if (!req || !item || !doc || !cliente) return s;
          // Reutilização só vale se o documento continuar compatível em
          // categoria, escopo, sujeito, validade, status e política.
          const compativel = documentosCompativeis(item, cliente).some((d) => d.id === doc.id);
          if (!compativel) {
            return {
              ...s,
              requests: s.requests.map((r) =>
                r.id === requestId
                  ? {
                      ...r,
                      timeline: [
                        ...r.timeline,
                        evento(
                          `Reutilização recusada: ${item.label}`,
                          `${doc.nome} não é compatível com o requisito (categoria, escopo, sujeito, validade ou status).`,
                          "alerta",
                        ),
                      ],
                    }
                  : r,
              ),
            };
          }
          const evidencia: EvidenciaRequisito = {
            tipo: item.categoriaDoc ?? "documento",
            origem: "reutilizada",
            arquivo: doc.nome,
            documentoId: doc.id,
            referencia: doc.tipo,
            observacao: `Versão de ${doc.enviadoEm}, aprovada — política de reutilização permitida`,
            por: USUARIO_ATUAL.nome,
            registradoEm: agora(),
          };
          return {
            ...s,
            requests: s.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    checklist: r.checklist.map((c) =>
                      c.id === itemId
                        ? {
                            ...c,
                            done: true,
                            evidencia,
                            historico: comHistorico(
                              c,
                              "Evidência reutilizada",
                              `${doc.nome} · enviada em ${doc.enviadoEm}`,
                            ),
                          }
                        : c,
                    ),
                    timeline: [
                      ...r.timeline,
                      evento(
                        `Evidência reutilizada: ${item.label}`,
                        `${doc.nome} — arquivo não duplicado, versão original vinculada`,
                        "sistema",
                      ),
                    ],
                  }
                : r,
            ),
          };
        }),

      naoAplicarRequisito: (requestId, itemId, motivo, regra, tipo = "regra") =>
        patchRequest(requestId, (r) => {
          const item = r.checklist.find((c) => c.id === itemId);
          if (!item) return r;
          // Regra de plataforma ou AC nunca é dispensada pelo tenant.
          if (politicaNaoAplicavelDe(item) === "nao_permitida") {
            return {
              ...r,
              timeline: [
                ...r.timeline,
                evento(
                  `Dispensa recusada: ${item.label}`,
                  "Requisito de plataforma/AC — a não aplicabilidade não é permitida nesta configuração.",
                  "alerta",
                ),
              ],
            };
          }
          const rotulo = tipo === "excecao" ? "Dispensado por exceção" : "Não aplicável por regra";
          return {
            ...r,
            checklist: r.checklist.map((c) =>
              c.id === itemId
                ? {
                    ...c,
                    done: false,
                    naoAplicavel: {
                      motivo,
                      regra,
                      tipo,
                      por: USUARIO_ATUAL.nome,
                      quando: agora(),
                    },
                    historico: comHistorico(c, rotulo, `${motivo} · ${regra}`),
                  }
                : c,
            ),
            timeline: [
              ...r.timeline,
              evento(
                `${rotulo}: ${item.label}`,
                `${motivo} · ${regra} · ${USUARIO_ATUAL.nome}`,
                tipo === "excecao" ? "alerta" : "sistema",
              ),
            ],
          };
        }),

      solicitarAoCliente: (requestId, itemId, mensagem) =>
        patchRequest(requestId, (r) => {
          const item = r.checklist.find((c) => c.id === itemId);
          return {
            ...r,
            checklist: r.checklist.map((c) =>
              c.id === itemId
                ? { ...c, historico: comHistorico(c, "Solicitado ao cliente", mensagem) }
                : c,
            ),
            timeline: item
              ? [...r.timeline, evento(`Solicitado ao cliente: ${item.label}`, mensagem, "humano")]
              : r.timeline,
          };
        }),

      reabrirRequisito: (requestId, itemId, motivo) =>
        patchRequest(requestId, (r) => {
          const item = r.checklist.find((c) => c.id === itemId);
          return {
            ...r,
            checklist: r.checklist.map((c) => {
              if (c.id !== itemId) return c;
              const { evidencia, naoAplicavel, ...resto } = c;
              const anterior = evidencia
                ? `Evidência anterior preservada: ${[evidencia.arquivo, evidencia.referencia, evidencia.resultado].filter(Boolean).join(" · ")} (${evidencia.por}, ${evidencia.registradoEm})`
                : naoAplicavel
                  ? `Não aplicabilidade anterior: ${naoAplicavel.motivo}`
                  : undefined;
              return {
                ...resto,
                done: false,
                historico: comHistorico(c, `Requisito reaberto — ${motivo}`, anterior),
              };
            }),
            timeline: item
              ? [
                  ...r.timeline,
                  evento(
                    `Requisito reaberto: ${item.label}`,
                    `${motivo} — histórico e evidência anteriores preservados`,
                    "alerta",
                  ),
                ]
              : r.timeline,
          };
        }),

      setOperador: (agenteId) => setState((s) => ({ ...s, operadorId: agenteId })),

      registrarEmissaoManual: (requestId, emissaoId, dados) =>
        setState((s) => {
          const autor = autorDe(s.operadorId);
          const registro: RegistroEmissao = {
            emissaoId,
            requestId,
            resultado: dados.resultado,
            ac: dados.ac,
            protocoloExterno: dados.protocoloExterno,
            numeroSerie: dados.numeroSerie,
            dataEmissao: dados.dataEmissao,
            validade: dados.validade,
            comprovante: dados.comprovante,
            ...(dados.observacao ? { observacao: dados.observacao } : {}),
            registradoPor: autor,
          };
          return {
            ...s,
            emissoes: { ...s.emissoes, [emissaoId]: registro },
            requests: comEvento(
              s,
              requestId,
              `Emissão manual registrada — ${dados.produto ?? emissaoId}`,
              `Resultado: ${dados.resultado} · AC ${dados.ac} · protocolo ${dados.protocoloExterno} · série ${dados.numeroSerie} · aguardando conferência de outro operador`,
              "humano",
              autor.nome,
            ),
          };
        }),

      conferirEmissao: (emissaoId, decisao, motivo) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg) return s;
          const autor = autorDe(s.operadorId);
          if (reg.registradoPor.id === autor.id) return s;
          const atualizado: RegistroEmissao = {
            ...reg,
            conferencia: { decisao, ...(motivo ? { motivo } : {}), por: autor },
          };
          return {
            ...s,
            emissoes: { ...s.emissoes, [emissaoId]: atualizado },
            requests: comEvento(
              s,
              reg.requestId,
              decisao === "confirmada"
                ? "Emissão manual conferida e confirmada"
                : "Emissão manual devolvida na conferência",
              `${reg.numeroSerie} · registrada por ${reg.registradoPor.nome}${motivo ? ` · ${motivo}` : ""}`,
              decisao === "confirmada" ? "humano" : "alerta",
              autor.nome,
            ),
          };
        }),

      definirEntrega: (emissaoId, modo, referencia, observacao) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg) return s;
          const autor = autorDe(s.operadorId);
          return {
            ...s,
            emissoes: {
              ...s.emissoes,
              [emissaoId]: {
                ...reg,
                entrega: {
                  modo,
                  ...(referencia ? { referencia } : {}),
                  ...(observacao ? { observacao } : {}),
                  por: autor,
                },
              },
            },
            requests: comEvento(
              s,
              reg.requestId,
              "Forma de entrega definida",
              `${modo}${referencia ? ` · ${referencia}` : ""}`,
              "humano",
              autor.nome,
            ),
          };
        }),

      registrarFalhaEntrega: (emissaoId, motivo) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg?.entrega) return s;
          const autor = autorDe(s.operadorId);
          return {
            ...s,
            emissoes: {
              ...s.emissoes,
              [emissaoId]: { ...reg, entrega: { ...reg.entrega, falha: motivo } },
            },
            requests: comEvento(
              s,
              reg.requestId,
              "Falha no envio — tarefa manual aberta",
              motivo,
              "alerta",
              autor.nome,
            ),
          };
        }),

      confirmarEntregue: (emissaoId, observacao) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg) return s;
          const autor = autorDe(s.operadorId);
          return {
            ...s,
            emissoes: { ...s.emissoes, [emissaoId]: { ...reg, entregue: autor } },
            requests: comEvento(
              s,
              reg.requestId,
              "Entrega confirmada com o titular",
              observacao,
              "humano",
              autor.nome,
            ),
          };
        }),

      confirmarInstalacao: (emissaoId, observacao) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg) return s;
          const autor = autorDe(s.operadorId);
          return {
            ...s,
            emissoes: {
              ...s.emissoes,
              [emissaoId]: {
                ...reg,
                instalacao: { ...autor, ...(observacao ? { observacao } : {}) },
              },
            },
            requests: comEvento(
              s,
              reg.requestId,
              "Instalação/ativação confirmada",
              observacao,
              "humano",
              autor.nome,
            ),
          };
        }),

      confirmarEmUso: (emissaoId) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg) return s;
          const autor = autorDe(s.operadorId);
          return {
            ...s,
            emissoes: { ...s.emissoes, [emissaoId]: { ...reg, emUso: autor } },
            requests: comEvento(
              s,
              reg.requestId,
              "Certificado em uso pelo titular",
              `Série ${reg.numeroSerie}`,
              "humano",
              autor.nome,
            ),
          };
        }),

      revogarEmissao: (emissaoId, motivo) =>
        setState((s) => {
          const reg = s.emissoes[emissaoId];
          if (!reg) return s;
          const autor = autorDe(s.operadorId);
          return {
            ...s,
            emissoes: { ...s.emissoes, [emissaoId]: { ...reg, revogacao: { ...autor, motivo } } },
            requests: comEvento(
              s,
              reg.requestId,
              "Revogação registrada nesta emissão",
              motivo,
              "alerta",
              autor.nome,
            ),
          };
        }),

      criarEmissaoRelacionada: (requestId, dados) =>
        setState((s) => {
          const autor = autorDe(s.operadorId);
          const nova: EmissaoRelacionada = { id: uid("em"), requestId, ...dados, criadaPor: autor };
          return {
            ...s,
            emissoesExtras: {
              ...s.emissoesExtras,
              [requestId]: [...(s.emissoesExtras[requestId] ?? []), nova],
            },
            requests: comEvento(
              s,
              requestId,
              `Emissão relacionada criada — ${dados.produto}`,
              `Elegibilidade: ${dados.motivoElegibilidade} · ciclo próprio, sem herdar pagamento ou validação`,
              "humano",
              autor.nome,
            ),
          };
        }),

      logRequest: (requestId, titulo, detalhe, tipo = "humano") =>
        patchRequest(requestId, (r) => ({
          ...r,
          timeline: [...r.timeline, evento(titulo, detalhe, tipo)],
        })),

      issueCertificate: (requestId) => {
        let emitido: Certificate | undefined;
        setState((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          if (!req) return s;
          const validade = new Date();
          validade.setFullYear(validade.getFullYear() + (req.tipo.includes("A3") ? 3 : 1));
          const cert: Certificate = {
            id: uid("cert"),
            tipo: req.tipo,
            serie: `S-${Math.floor(100000 + Math.random() * 899999)}`,
            emitidoEm: hojeIso(),
            validoAte: validade.toISOString().slice(0, 10),
            status: "ativo",
          };
          emitido = cert;
          return {
            ...s,
            clients: s.clients.map((c) =>
              c.id === req.clienteId
                ? { ...c, certificados: [cert, ...c.certificados], ltv: c.ltv + req.valor }
                : c,
            ),
            requests: s.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    stage: "concluido",
                    timeline: [
                      ...r.timeline,
                      evento(
                        "Certificado emitido",
                        `Série ${cert.serie} · válido até ${cert.validoAte}`,
                        "sistema",
                      ),
                    ],
                  }
                : r,
            ),
          };
        });
        return emitido;
      },

      addAppointment: (input) => {
        const cliente = seedClients.find((c) => c.id === input.clienteId);
        const novo: Appointment = {
          id: uid("ag"),
          clienteId: input.clienteId,
          cliente: input.clienteNome ?? cliente?.nome ?? "Cliente",
          tipo: input.tipo,
          agenteId: input.agenteId,
          dia: input.dia,
          hora: input.hora,
          duracaoMin: input.duracaoMin,
          sala: input.sala,
          status: "pendente",
        };
        setState((s) => ({
          ...s,
          appointments: [
            ...s.appointments,
            {
              ...novo,
              cliente:
                input.clienteNome ??
                s.clients.find((c) => c.id === input.clienteId)?.nome ??
                novo.cliente,
            },
          ],
        }));
        return novo;
      },

      updateAppointment: (id, patch) =>
        setState((s) => ({
          ...s,
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      addTicket: (input) => {
        const cliente = seedClients.find((c) => c.id === input.clienteId);
        const novo: Ticket = {
          id: uid("t"),
          numero: `CH-${Math.floor(4000 + Math.random() * 5999)}`,
          clienteId: input.clienteId,
          cliente: input.clienteNome ?? cliente?.nome ?? "Cliente",
          contato: input.contato ?? cliente?.email ?? "",
          assunto: input.assunto,
          categoria: input.categoria,
          subcategoria: input.subcategoria,
          canal: input.canal,
          prioridade: input.prioridade,
          status: "aberto",
          responsavelId: input.responsavelId,
          abertoEm: agora(),
          atualizadoEm: agora(),
          slaRestanteHoras:
            input.prioridade === "critica" ? 4 : input.prioridade === "alta" ? 8 : 24,
          tags: input.tags ?? [],
          mensagens: [
            {
              id: uid("m"),
              autor: input.clienteNome ?? cliente?.nome ?? "Cliente",
              papel: "cliente",
              quando: agora(),
              texto: input.descricao,
            },
          ],
        };
        setState((s) => ({
          ...s,
          tickets: [
            {
              ...novo,
              cliente:
                input.clienteNome ??
                s.clients.find((c) => c.id === input.clienteId)?.nome ??
                novo.cliente,
            },
            ...s.tickets,
          ],
        }));
        return novo;
      },

      updateTicket: (id, patch) =>
        setState((s) => ({
          ...s,
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, ...patch, atualizadoEm: agora() } : t,
          ),
        })),

      addTicketMessage: (id, texto, papel = "suporte", autor = USUARIO_ATUAL.nome) =>
        setState((s) => ({
          ...s,
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  atualizadoEm: agora(),
                  mensagens: [
                    ...t.mensagens,
                    { id: uid("m"), autor, papel, quando: agora(), texto },
                  ],
                }
              : t,
          ),
        })),

      addPagar: (t) => setState((s) => ({ ...s, pagar: [{ id: uid("ap"), ...t }, ...s.pagar] })),
      addReceber: (t) =>
        setState((s) => ({ ...s, receber: [{ id: uid("ar"), ...t }, ...s.receber] })),
      updatePagar: (id, patch) =>
        setState((s) => ({
          ...s,
          pagar: s.pagar.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      updateReceber: (id, patch) =>
        setState((s) => ({
          ...s,
          receber: s.receber.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      addPlano: (p) => {
        const novo: Plano = { ...p, id: uid("pl") };
        setState((s) => ({ ...s, planos: [...s.planos, novo] }));
        return novo;
      },
      updatePlano: (id, patch) =>
        setState((s) => ({
          ...s,
          planos: s.planos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePlano: (id) => setState((s) => ({ ...s, planos: s.planos.filter((p) => p.id !== id) })),

      addContrato: (c) => {
        const novo: Contrato = { ...c, id: uid("ct") };
        setState((s) => ({ ...s, contratos: [novo, ...s.contratos] }));
        return novo;
      },
      updateContrato: (id, patch) =>
        setState((s) => ({
          ...s,
          contratos: s.contratos.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      addComissao: (c) => {
        const novo: Comissao = { ...c, id: uid("cm") };
        setState((s) => ({ ...s, comissoes: [novo, ...s.comissoes] }));
        return novo;
      },
      updateComissao: (id, patch) =>
        setState((s) => ({
          ...s,
          comissoes: s.comissoes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      addRegraComissao: (r) => {
        const nova: RegraComissao = { ...r, id: uid("rg") };
        setState((s) => ({ ...s, regrasComissao: [...s.regrasComissao, nova] }));
        return nova;
      },
      updateRegraComissao: (id, patch) =>
        setState((s) => ({
          ...s,
          regrasComissao: s.regrasComissao.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      removeRegraComissao: (id) =>
        setState((s) => ({ ...s, regrasComissao: s.regrasComissao.filter((r) => r.id !== id) })),

      addContador: (c) => {
        const base = seedContadores[0] as Contador;
        const novo: Contador = {
          ...base,
          id: uid("k"),
          nome: c.nome,
          razaoSocial: c.razaoSocial,
          cnpj: c.cnpj,
          crc: c.crc,
          responsavel: c.responsavel,
          email: c.email,
          telefone: c.telefone,
          cidade: c.cidade,
          gestor: c.gestor,
          comissaoPercentual: c.comissaoPercentual,
          metaMes: c.metaMes,
          status: "em credenciamento",
          tier: "Bronze",
          desde: hojeIso(),
          emissoesMes: 0,
          emissoesAno: 0,
          receitaMes: 0,
          receitaAno: 0,
          ticketMedio: 0,
          comissaoMes: 0,
          comissaoAberta: 0,
          comissaoAcumulada: 0,
          inadimplencia: 0,
          conversao: 0,
          churnCarteira: 0,
          ultimaAtividade: hojeIso(),
          observacao: "Parceiro em processo de credenciamento.",
          serie: base.serie.map((s) => ({ ...s, emissoes: 0, receita: 0, comissao: 0 })),
          carteira: [],
          pedidos: [],
          extrato: [],
          documentos: [
            { id: uid("dc"), nome: "Contrato de credenciamento", tipo: "PDF", status: "pendente" },
            {
              id: uid("dc"),
              nome: "Certidão de regularidade do CRC",
              tipo: "PDF",
              status: "pendente",
            },
            { id: uid("dc"), nome: "Cartão CNPJ", tipo: "PDF", status: "pendente" },
          ],
          contatos: [
            {
              id: uid("ct"),
              nome: c.responsavel,
              papel: "Responsável",
              email: c.email,
              telefone: c.telefone,
            },
          ],
          atividades: [
            {
              id: uid("at"),
              quando: agora(),
              autor: USUARIO_ATUAL.nome,
              texto: "Parceiro cadastrado — credenciamento iniciado.",
              tipo: "sistema",
            },
          ],
        };
        setState((s) => ({ ...s, contadores: [novo, ...s.contadores] }));
        return novo;
      },

      updateContador: (id, patch) =>
        setState((s) => ({
          ...s,
          contadores: s.contadores.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        })),
    };
    return A;
  }, [patchClient, patchRequest]);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore precisa estar dentro de <AppStoreProvider>");
  return ctx;
}

export function useCliente(id: string) {
  const { clients } = useStore();
  return clients.find((c) => c.id === id);
}

export function useSolicitacao(id: string) {
  const { requests } = useStore();
  return requests.find((r) => r.id === id);
}
