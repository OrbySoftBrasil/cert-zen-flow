// Estado global do protótipo: transforma os mocks estáticos em dados vivos.
// Persistido em localStorage para que as ações do usuário sobrevivam à navegação
// e ao refresh — é o que faz o protótipo se comportar como produto real.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
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
import { cenarioAppointments, cenarioRequests } from "@/lib/cenarios";
import {
  contadores as seedContadores,
  type Contador,
} from "@/lib/contadores-data";

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

const STORAGE_KEY = "certus-ac-estado-v2";

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
  };
}

function agora() {
  return new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

function evento(titulo: string, detalhe?: string, tipo: TimelineEvent["tipo"] = "humano"): TimelineEvent {
  return { id: uid("ev"), quando: agora(), autor: USUARIO_ATUAL.nome, titulo, tipo, ...(detalhe ? { detalhe } : {}) };
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
  setDocumentStatus: (clienteId: string, docId: string, status: DocumentFile["status"], motivo?: string) => void;
  addDocument: (clienteId: string, doc: Omit<DocumentFile, "id">) => void;
  revokeCertificate: (clienteId: string, certId: string, motivo: string) => void;
  // solicitações
  addRequest: (input: NovaSolicitacaoInput) => Request;
  updateRequest: (id: string, patch: Partial<Request>) => void;
  moveRequest: (id: string, stage: StageId, detalhe?: string) => void;
  cumprirRequisito: (
    requestId: string,
    itemId: string,
    evidencia: Omit<EvidenciaRequisito, "por" | "registradoEm">,
  ) => void;
  reabrirRequisito: (requestId: string, itemId: string, motivo: string) => void;
  logRequest: (requestId: string, titulo: string, detalhe?: string, tipo?: TimelineEvent["tipo"]) => void;
  issueCertificate: (requestId: string) => Certificate | undefined;
  // agenda
  addAppointment: (input: NovoAgendamentoInput) => Appointment;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  // chamados
  addTicket: (input: NovoChamadoInput) => Ticket;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  addTicketMessage: (id: string, texto: string, papel?: "cliente" | "suporte" | "sistema", autor?: string) => void;
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
  addContador: (c: Pick<Contador, "nome" | "razaoSocial" | "cnpj" | "crc" | "responsavel" | "email" | "telefone" | "cidade" | "gestor" | "comissaoPercentual" | "metaMes">) => Contador;
  updateContador: (id: string, patch: Partial<Contador>) => void;
}

const Ctx = createContext<(AppState & Actions) | null>(null);

const checklistPorEtapa: Record<StageId, string[]> = {
  novo: ["Confirmar dados do titular", "Validar forma de pagamento"],
  documentacao: ["Documento de identidade", "Comprovante de endereço", "Contrato social / procuração"],
  validacao: ["Conferência biométrica", "Checagem em bases públicas", "Parecer do agente de registro"],
  agendamento: ["Enviar convite de videoconferência", "Confirmar disponibilidade do titular"],
  videoconferencia: ["Gravação arquivada", "Termo de titularidade assinado"],
  emissao: ["Gerar par de chaves", "Entregar mídia ao titular"],
  concluido: ["Pesquisa de satisfação enviada"],
  bloqueado: ["Registrar impedimento"],
};

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
          notas: [{ id: uid("n"), quando: agora(), autor: USUARIO_ATUAL.nome, texto: "Cliente cadastrado no sistema." }],
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
        patchClient(clienteId, (c) => ({ ...c, documentos: [{ id: uid("d"), ...doc }, ...c.documentos] })),

      revokeCertificate: (clienteId, certId, motivo) =>
        patchClient(clienteId, (c) => ({
          ...c,
          certificados: c.certificados.map((x) => (x.id === certId ? { ...x, status: "revogado" } : x)),
          notas: [
            { id: uid("n"), quando: agora(), autor: USUARIO_ATUAL.nome, texto: `Certificado revogado — ${motivo}` },
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
          checklist: (checklistPorEtapa.novo ?? []).map((label) => ({ id: uid("ck"), label, done: false })),
          timeline: [
            evento("Solicitação criada", `${input.tipo} · canal ${input.canal}`, "sistema"),
            ...(input.observacao ? [evento("Observação de abertura", input.observacao)] : []),
          ],
        };
        setState((s) => ({ ...s, requests: [nova, ...s.requests] }));
        return nova;
      },

      updateRequest: (id, patch) => patchRequest(id, (r) => ({ ...r, ...patch })),

      moveRequest: (id, stage, detalhe) =>
        patchRequest(id, (r) => {
          const nome = stages.find((s) => s.id === stage)?.nome ?? stage;
          const novosItens = (checklistPorEtapa[stage] ?? []).filter(
            (label) => !r.checklist.some((c) => c.label === label),
          );
          return {
            ...r,
            stage,
            checklist: [...r.checklist, ...novosItens.map((label) => ({ id: uid("ck"), label, done: false }))],
            timeline: [
              ...r.timeline,
              evento(`Etapa alterada para ${nome}`, detalhe, stage === "bloqueado" ? "alerta" : "sistema"),
            ],
          };
        }),

      cumprirRequisito: (requestId, itemId, dados) => {
        const evidencia: EvidenciaRequisito = {
          ...dados,
          por: USUARIO_ATUAL.nome,
          registradoEm: agora(),
        };
        setState((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          const item = req?.checklist.find((c) => c.id === itemId);
          if (!req || !item) return s;
          const detalhe = [evidencia.referencia, evidencia.arquivo, evidencia.valor, evidencia.observacao]
            .filter(Boolean)
            .join(" · ");
          const anexo = evidencia.arquivo;
          return {
            ...s,
            requests: s.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    checklist: r.checklist.map((c) =>
                      c.id === itemId ? { ...c, done: true, evidencia } : c,
                    ),
                    timeline: [
                      ...r.timeline,
                      evento(`Requisito cumprido: ${item.label}`, detalhe || undefined, "humano"),
                    ],
                  }
                : r,
            ),
            // Anexos entram no dossiê do cliente para não haver duas verdades.
            clients: anexo
              ? s.clients.map((c) =>
                  c.id === req.clienteId
                    ? {
                        ...c,
                        documentos: [
                          {
                            id: uid("d"),
                            nome: anexo,
                            tipo: evidencia.referencia ?? item.label,
                            enviadoEm: hojeIso(),
                            status: "em análise" as const,
                          },
                          ...c.documentos,
                        ],
                      }
                    : c,
                )
              : s.clients,
          };
        });
      },

      reabrirRequisito: (requestId, itemId, motivo) =>
        patchRequest(requestId, (r) => {
          const item = r.checklist.find((c) => c.id === itemId);
          return {
            ...r,
            checklist: r.checklist.map((c) =>
              c.id === itemId ? { id: c.id, label: c.label, done: false } : c,
            ),
            timeline: item
              ? [...r.timeline, evento(`Requisito reaberto: ${item.label}`, motivo, "alerta")]
              : r.timeline,
          };
        }),

      logRequest: (requestId, titulo, detalhe, tipo = "humano") =>
        patchRequest(requestId, (r) => ({ ...r, timeline: [...r.timeline, evento(titulo, detalhe, tipo)] })),

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
                      evento("Certificado emitido", `Série ${cert.serie} · válido até ${cert.validoAte}`, "sistema"),
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
          appointments: [...s.appointments, { ...novo, cliente: input.clienteNome ?? s.clients.find((c) => c.id === input.clienteId)?.nome ?? novo.cliente }],
        }));
        return novo;
      },

      updateAppointment: (id, patch) =>
        setState((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

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
          slaRestanteHoras: input.prioridade === "critica" ? 4 : input.prioridade === "alta" ? 8 : 24,
          tags: input.tags ?? [],
          mensagens: [
            { id: uid("m"), autor: input.clienteNome ?? cliente?.nome ?? "Cliente", papel: "cliente", quando: agora(), texto: input.descricao },
          ],
        };
        setState((s) => ({
          ...s,
          tickets: [{ ...novo, cliente: input.clienteNome ?? s.clients.find((c) => c.id === input.clienteId)?.nome ?? novo.cliente }, ...s.tickets],
        }));
        return novo;
      },

      updateTicket: (id, patch) =>
        setState((s) => ({
          ...s,
          tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch, atualizadoEm: agora() } : t)),
        })),

      addTicketMessage: (id, texto, papel = "suporte", autor = USUARIO_ATUAL.nome) =>
        setState((s) => ({
          ...s,
          tickets: s.tickets.map((t) =>
            t.id === id
              ? {
                  ...t,
                  atualizadoEm: agora(),
                  mensagens: [...t.mensagens, { id: uid("m"), autor, papel, quando: agora(), texto }],
                }
              : t,
          ),
        })),

      addPagar: (t) => setState((s) => ({ ...s, pagar: [{ id: uid("ap"), ...t }, ...s.pagar] })),
      addReceber: (t) => setState((s) => ({ ...s, receber: [{ id: uid("ar"), ...t }, ...s.receber] })),
      updatePagar: (id, patch) =>
        setState((s) => ({ ...s, pagar: s.pagar.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      updateReceber: (id, patch) =>
        setState((s) => ({ ...s, receber: s.receber.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      addPlano: (p) => {
        const novo: Plano = { ...p, id: uid("pl") };
        setState((s) => ({ ...s, planos: [...s.planos, novo] }));
        return novo;
      },
      updatePlano: (id, patch) =>
        setState((s) => ({ ...s, planos: s.planos.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePlano: (id) => setState((s) => ({ ...s, planos: s.planos.filter((p) => p.id !== id) })),

      addContrato: (c) => {
        const novo: Contrato = { ...c, id: uid("ct") };
        setState((s) => ({ ...s, contratos: [novo, ...s.contratos] }));
        return novo;
      },
      updateContrato: (id, patch) =>
        setState((s) => ({ ...s, contratos: s.contratos.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      addComissao: (c) => {
        const novo: Comissao = { ...c, id: uid("cm") };
        setState((s) => ({ ...s, comissoes: [novo, ...s.comissoes] }));
        return novo;
      },
      updateComissao: (id, patch) =>
        setState((s) => ({ ...s, comissoes: s.comissoes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

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
            { id: uid("dc"), nome: "Certidão de regularidade do CRC", tipo: "PDF", status: "pendente" },
            { id: uid("dc"), nome: "Cartão CNPJ", tipo: "PDF", status: "pendente" },
          ],
          contatos: [
            { id: uid("ct"), nome: c.responsavel, papel: "Responsável", email: c.email, telefone: c.telefone },
          ],
          atividades: [
            { id: uid("at"), quando: agora(), autor: USUARIO_ATUAL.nome, texto: "Parceiro cadastrado — credenciamento iniciado.", tipo: "sistema" },
          ],
        };
        setState((s) => ({ ...s, contadores: [novo, ...s.contadores] }));
        return novo;
      },

      updateContador: (id, patch) =>
        setState((s) => ({ ...s, contadores: s.contadores.map((k) => (k.id === id ? { ...k, ...patch } : k)) })),
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
