// Modelo de leitura do "Workspace do Caso".
// O caso é o contexto compartilhado (relacionamento + operação + auditoria) e
// pode conter várias emissões, cada uma com ciclo próprio e independente.
// Tudo derivado de forma determinística — protótipo sem backend.
import { agentById, brl, type CertType, type Client, type Request } from "@/lib/mock-data";
import { contadorDoCliente } from "@/lib/contadores-data";
import { cenarioDe } from "@/lib/cenarios";
import { origemDe, papelEsperado, pendenciasDe, perfilById, unidadeDe } from "@/lib/operacao-model";
import {
  cicloConcluido,
  cicloDoRegistro,
  type CicloEmissao,
  type EmissaoRelacionada,
  type RegistroEmissao,
} from "@/lib/emissao-model";

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

// ------------------------------------------------------------------ estados

export type EstadoItem = "concluido" | "pronto" | "pendente" | "bloqueado" | "na";

export const rotuloEstado: Record<EstadoItem, string> = {
  concluido: "Concluído",
  pronto: "Pronto",
  pendente: "Pendente",
  bloqueado: "Bloqueado",
  na: "Não aplicável",
};

// ---------------------------------------------------------------- emissões

export interface EmissaoCaso {
  id: string;
  produto: string;
  titular: string;
  papelTitular: string;
  ac: string;
  modalidade: string;
  condicaoComercial: string;
  valor: number;
  pagamento: { estado: EstadoItem; detalhe: string };
  validacao: EstadoItem;
  dossie: EstadoItem;
  emissao: EstadoItem;
  entrega: EstadoItem;
  instalacao: EstadoItem;
  revogacao: { estado: EstadoItem; detalhe: string };
  bloqueio?: string;
  principal?: boolean;
  /** Ciclo declarado (cenários demonstrativos). Sem registro operacional, é o estado atual. */
  ciclo?: CicloEmissao;
  motivoElegibilidade?: string;
}

const acs = ["AC Certus RFB", "AC Soluti Multipla", "AC Serasa RFB"];

function modalidadeDe(tipo: CertType) {
  if (tipo === "Nuvem PJ") return "Nuvem (assinatura remota)";
  return tipo.endsWith("A3") ? "A3 · token/cartão" : "A1 · arquivo";
}

export function emissoesDoCaso(r: Request, extras: EmissaoRelacionada[] = []): EmissaoCaso[] {
  const cen = cenarioDe(r.id);
  const relacionadas: EmissaoCaso[] = extras.map((x) => ({
    id: x.id,
    produto: x.produto,
    titular: x.titular,
    papelTitular: x.papelTitular,
    ac: x.ac,
    modalidade: x.modalidade,
    condicaoComercial: x.condicaoComercial,
    valor: x.valor,
    pagamento: {
      estado: "pendente",
      detalhe: "Pagamento próprio — não herda nada da emissão original",
    },
    validacao: "pendente",
    dossie: "pendente",
    emissao: "bloqueado",
    entrega: "na",
    instalacao: "na",
    revogacao: { estado: "na", detalhe: "—" },
    ciclo: "planejada",
    motivoElegibilidade: x.motivoElegibilidade,
    bloqueio:
      "Emissão relacionada com ciclo próprio — precisa de pagamento, dossiê e validação próprios",
  }));

  if (cen) return [...cen.emissoes, ...relacionadas];

  const h = hash(r.id);
  const idx = pendenciasDe(r).length;
  const pago = h % 3 !== 0;
  const principalOk = r.stage === "concluido";

  // Um caso comum nasce com UMA emissão. Emissões adicionais só existem por
  // ação explícita de elegibilidade (ver criarEmissaoRelacionada).
  const principal: EmissaoCaso = {
    id: `${r.id}-e1`,
    produto: r.tipo,
    titular: r.cliente,
    papelTitular:
      r.tipo.includes("CNPJ") || r.tipo === "Nuvem PJ" ? "Representante legal" : "Titular",
    ac: acs[h % acs.length]!,
    modalidade: modalidadeDe(r.tipo),
    condicaoComercial: `Tabela balcão · ${brl(r.valor)}`,
    valor: r.valor,
    pagamento: pago
      ? { estado: "concluido", detalhe: "Pix confirmado na abertura" }
      : { estado: "pendente", detalhe: "Boleto em aberto — libera após compensação" },
    validacao: principalOk ? "concluido" : idx === 0 ? "pronto" : "pendente",
    dossie: idx === 0 ? "concluido" : "pendente",
    emissao: principalOk ? "concluido" : pago && idx === 0 ? "pronto" : "bloqueado",
    entrega: principalOk ? "concluido" : "na",
    instalacao: principalOk ? "concluido" : "na",
    revogacao: { estado: "na", detalhe: "Sem pedido de revogação" },
    principal: true,
    ciclo: principalOk ? "em-uso" : pago && idx === 0 ? "pronta-para-emissao" : "planejada",
    ...(pago ? {} : { bloqueio: "Pagamento desta emissão não compensado" }),
  };

  return [principal, ...relacionadas];
}

/** Estado atual do ciclo: registro operacional tem precedência sobre o mock. */
export function cicloDaEmissao(e: EmissaoCaso, reg?: RegistroEmissao): CicloEmissao {
  if (reg) return cicloDoRegistro(reg);
  if (e.ciclo) return e.ciclo;
  if (e.revogacao.estado === "concluido") return "revogada";
  if (e.bloqueio || e.emissao === "bloqueado") return "bloqueada";
  if (e.instalacao === "concluido") return "em-uso";
  if (e.entrega === "concluido") return "entregue";
  if (e.emissao === "concluido") return "entrega-pendente";
  if (e.emissao === "pronto") return "pronta-para-emissao";
  return "planejada";
}

/** O caso só conclui quando todas as emissões planejadas estão em uso. */
export function conclusaoDoCaso(
  emissoes: EmissaoCaso[],
  registros: Record<string, RegistroEmissao>,
  pendentesObrigatorios: string[],
): { pode: boolean; motivo: string | null } {
  const abertas = emissoes.filter((e) => !cicloConcluido(cicloDaEmissao(e, registros[e.id])));
  if (abertas.length)
    return {
      pode: false,
      motivo: `${abertas.length} emissão(ões) ainda não estão em uso: ${abertas.map((e) => e.produto).join(", ")}`,
    };
  if (pendentesObrigatorios.length)
    return {
      pode: false,
      motivo: `Tarefas obrigatórias em aberto: ${pendentesObrigatorios.join(", ")}`,
    };
  return { pode: true, motivo: null };
}

// --------------------------------------------------------------- prontidão

export type TrilhaCaso =
  "comercial" | "atendimento" | "regulatoria" | "emissao" | "entrega" | "financeira";

export interface DetalheProntidao {
  id: TrilhaCaso;
  nome: string;
  curto: string;
  estado: EstadoItem;
  concluido: string[];
  falta: string[];
  quemAge: string;
  acaoBloqueada: string;
  regra: string;
  regraObrigatoria?: boolean;
}

export function prontidaoCaso(r: Request, cliente?: Client): DetalheProntidao[] {
  const pend = pendenciasDe(r);
  const feitos = r.checklist.filter((c) => c.done).map((c) => c.label);
  const faltam = pend.map((c) => c.label);
  const emissoes = emissoesDoCaso(r);
  const pagosOk = emissoes.every((e) => e.pagamento.estado === "concluido");
  const perfil = perfilById(papelEsperado(r));
  const docsPend = cliente?.documentos.filter((d) => d.status !== "aprovado") ?? [];
  const travado = r.stage === "bloqueado";
  const concluido = r.stage === "concluido";
  const ciclos = emissoes.map((e) => cicloDaEmissao(e));
  const todasEmUso = ciclos.length > 0 && ciclos.every((c) => cicloConcluido(c));
  const emEntrega = ciclos.filter((c) =>
    ["emitida-confirmada", "entrega-pendente", "entregue", "instalacao-confirmada"].includes(c),
  );
  const aguardandoConferencia = ciclos.filter(
    (c) => c === "aguardando-conferencia" || c === "devolvida",
  ).length;

  return [
    {
      id: "comercial",
      nome: "Prontidão comercial",
      curto: "Comercial",
      estado: emissoes.some((e) => e.pagamento.estado === "bloqueado") ? "pendente" : "concluido",
      concluido: ["Pedido qualificado", `Origem: ${origemDe(r)}`, `Condição: ${brl(r.valor)}`],
      falta: emissoes
        .filter((e) => e.pagamento.estado === "bloqueado")
        .map((e) => `Liberação comercial da emissão ${e.produto}`),
      quemAge: "Vendas Diretas (VD)",
      acaoBloqueada: "Autorizar exceção comercial",
      regra: "Cada emissão precisa da própria liberação comercial.",
    },
    {
      id: "atendimento",
      nome: "Prontidão de atendimento",
      curto: "Atendimento",
      estado: travado ? "bloqueado" : r.stage === "novo" ? "pendente" : "concluido",
      concluido: ["Contato inicial registrado", "Canal de retorno confirmado"],
      falta: r.stage === "novo" ? ["Confirmar dados do titular com o cliente"] : [],
      quemAge: "Vendas Indiretas (VI)",
      acaoBloqueada: "Agendar atendimento",
      regra: "O agendamento só abre após a confirmação de contato.",
    },
    {
      id: "regulatoria",
      nome: "Prontidão regulatória",
      curto: "Regulatória",
      estado: todasEmUso
        ? "concluido"
        : travado
          ? "bloqueado"
          : faltam.length
            ? "pendente"
            : "pronto",
      concluido: feitos.length ? feitos : ["Nenhum requisito concluído ainda"],
      falta: todasEmUso ? [] : faltam,
      quemAge: "Agente de Registro (AGR) e Verificadora",
      acaoBloqueada: "Registrar resultado da validação",
      regra: "Quem verifica precisa ser diferente de quem identificou ou montou o dossiê.",
      regraObrigatoria: true,
    },
    {
      id: "emissao",
      nome: "Prontidão para emissão",
      curto: "Emissão",
      estado: todasEmUso
        ? "concluido"
        : aguardandoConferencia
          ? "pendente"
          : faltam.length || !pagosOk
            ? "bloqueado"
            : "pronto",
      concluido: [
        ...(pagosOk ? ["Pagamentos das emissões liberadas"] : []),
        ...emEntrega.map(
          (_, i) => `Emissão confirmada: ${emissoes[ciclos.indexOf(emEntrega[i]!)]?.produto ?? ""}`,
        ),
      ],
      falta: todasEmUso
        ? []
        : [
            ...(aguardandoConferencia
              ? [`${aguardandoConferencia} emissão(ões) aguardando conferência de outro operador`]
              : []),
            ...(faltam.length ? ["Requisitos regulatórios pendentes"] : []),
            ...(pagosOk ? [] : ["Pagamento de emissão pendente"]),
          ],
      quemAge: "Agente de Registro (AGR)",
      acaoBloqueada: "Registrar emissão manual",
      regra: "Emissão exige dossiê aprovado e pagamento da própria emissão.",
      regraObrigatoria: true,
    },
    {
      id: "entrega",
      nome: "Prontidão para entrega",
      curto: "Entrega",
      estado: todasEmUso ? "concluido" : emEntrega.length ? "pendente" : "na",
      concluido: ciclos
        .map((c, i) => ({ c, e: emissoes[i]! }))
        .filter((x) => ["entregue", "instalacao-confirmada", "em-uso"].includes(x.c))
        .map((x) => `${x.e.produto} · ${x.c === "em-uso" ? "em uso" : "entregue"}`),
      falta: todasEmUso
        ? []
        : emEntrega.length
          ? emEntrega.map(
              (_, i) =>
                `Concluir entrega e instalação de ${emissoes[ciclos.indexOf(emEntrega[i]!)]?.produto ?? ""}`,
            )
          : ["Aguardando emissão confirmada por um segundo operador"],
      quemAge: "Suporte de entrega",
      acaoBloqueada: "Definir entrega",
      regra: "A entrega só abre após a emissão ser confirmada na conferência.",
    },
    {
      id: "financeira",
      nome: "Prontidão financeira",
      curto: "Financeira",
      estado: pagosOk ? "concluido" : "pendente",
      concluido: emissoes
        .filter((e) => e.pagamento.estado === "concluido")
        .map((e) => `${e.produto} · ${e.pagamento.detalhe}`),
      falta: emissoes
        .filter((e) => e.pagamento.estado !== "concluido")
        .map((e) => `${e.produto} · ${e.pagamento.detalhe}`),
      quemAge: "Financeiro",
      acaoBloqueada: "Confirmar pagamento",
      regra: "Pagamento não é compartilhado entre emissões do mesmo caso.",
      regraObrigatoria: true,
    },
  ].map((p) => ({
    ...p,
    falta: p.falta.length ? p.falta : [],
    concluido: p.concluido.length ? p.concluido : [],
    ...(docsPend.length && p.id === "regulatoria"
      ? { falta: [...p.falta, ...docsPend.map((d) => `Documento ${d.nome} (${d.status})`)] }
      : {}),
    quemAge:
      p.id === "regulatoria"
        ? `${perfil.nome} · ${agentById(perfilById(papelEsperado(r)).agenteId).nome}`
        : p.quemAge,
    ...((cenarioDe(r.id)?.prontidao?.[p.id as TrilhaCaso] ?? {}) as Partial<DetalheProntidao>),
  })) as DetalheProntidao[];
}

/** Bloqueio que nenhuma exceção comercial supera (ex.: suspeita de fraude). */
export function bloqueioAbsolutoDe(r: Request): string | null {
  return cenarioDe(r.id)?.bloqueioAbsoluto ?? null;
}

// ------------------------------------------------------------------ frentes

export interface Frente {
  id: string;
  nome: string;
  papel: string;
  estado: EstadoItem;
  resumo: string;
  proxima: string;
}

export function frentesDe(r: Request): Frente[] {
  const p = prontidaoCaso(r);
  const get = (id: TrilhaCaso) => p.find((x) => x.id === id)!;
  return [
    {
      id: "comercial",
      nome: "Comercial",
      papel: "VD",
      estado: get("comercial").estado,
      resumo: get("comercial").falta[0] ?? "Condições comerciais liberadas",
      proxima: "Autorizar exceção comercial",
    },
    {
      id: "atendimento",
      nome: "Atendimento",
      papel: "VI",
      estado: get("atendimento").estado,
      resumo: get("atendimento").falta[0] ?? "Cliente respondendo no prazo",
      proxima: "Agendar atendimento",
    },
    {
      id: "validacao",
      nome: "Validação e dossiê",
      papel: "AGR · montadora · verificadora",
      estado: get("regulatoria").estado,
      resumo: get("regulatoria").falta[0] ?? "Dossiê conferido",
      proxima: "Enviar para verificação",
    },
    {
      id: "conclusao",
      nome: "Conclusão",
      papel: "Suporte · financeiro",
      estado: get("entrega").estado,
      resumo: get("entrega").falta[0] ?? "Pronto para entrega",
      proxima: "Enviar ao cliente",
    },
  ];
}

// ------------------------------------------------------------------- dossiê

export interface ItemDossie {
  id: string;
  nome: string;
  obrigatorio: boolean;
  versao: number;
  origem: string;
  status: "aprovado" | "em conferência" | "divergente" | "ausente";
  divergencia?: string;
}

export interface Dossie {
  produto: string;
  motivo: string;
  montadora: string;
  verificadora: string;
  itens: ItemDossie[];
  devolucoes: { id: string; quando: string; por: string; motivo: string }[];
  segregacaoOk: boolean;
}

const origens = ["Portal do cliente", "WhatsApp", "Contabilidade parceira", "Balcão"];

export function dossieDe(r: Request, cliente?: Client): Dossie {
  const h = hash(r.id);
  const pj = r.tipo.includes("CNPJ") || r.tipo === "Nuvem PJ";
  const base = pj
    ? [
        "Contrato social consolidado",
        "Documento de identidade do representante",
        "CPF do representante",
        "Cartão CNPJ",
        "Procuração (se aplicável)",
      ]
    : ["Documento de identidade", "CPF", "Comprovante de endereço", "Selfie de prova de vida"];

  const docs = cliente?.documentos ?? [];
  const itens: ItemDossie[] = base.map((nome, i) => {
    const doc = docs[i];
    const status: ItemDossie["status"] = doc
      ? doc.status === "aprovado"
        ? "aprovado"
        : doc.status === "reprovado"
          ? "divergente"
          : "em conferência"
      : i === base.length - 1 && nome.includes("Procuração")
        ? "aprovado"
        : (h + i) % 4 === 0
          ? "ausente"
          : "aprovado";
    return {
      id: `${r.id}-d${i}`,
      nome,
      obrigatorio: !nome.includes("Procuração"),
      versao: ((h + i) % 3) + 1,
      origem: origens[(h + i) % origens.length]!,
      status,
      ...(status === "divergente"
        ? { divergencia: doc?.motivo ?? "Imagem ilegível na conferência" }
        : {}),
    };
  });

  const montadora = agentById("a3").nome;
  // Segregação de funções: a verificadora só coincide com a montadora em casos
  // irregulares — o workspace sinaliza o bloqueio quando isso acontece.
  const verificadora = agentById(h % 5 === 0 ? "a3" : h % 2 === 0 ? "a1" : "a2").nome;

  const base2: Dossie = {
    produto: r.tipo,
    motivo: r.tags[0] ? `Motivo: ${r.tags[0]}` : "Motivo: primeira emissão",
    montadora,
    verificadora,
    itens,
    devolucoes: itens
      .filter((i) => i.status === "divergente")
      .map((i, n) => ({
        id: `${i.id}-dev`,
        quando: `há ${n + 1} dia(s)`,
        por: verificadora,
        motivo: i.divergencia ?? "Divergência documental",
      })),
    segregacaoOk: montadora !== verificadora,
  };

  const cen = cenarioDe(r.id);
  if (cen) {
    // Nos casos demonstrativos o dossiê acompanha a emissão principal: se ela
    // já está conferida, nenhum item obrigatório pode aparecer pendente.
    const principal = cen.emissoes.find((e) => e.principal) ?? cen.emissoes[0];
    if (principal?.dossie === "concluido") {
      base2.itens = base2.itens.map((i) => ({ ...i, status: "aprovado" as const }));
      base2.devolucoes = [];
    }
  }
  return { ...base2, ...(cen?.dossie ?? {}) };
}

export function dossieBloqueado(d: Dossie) {
  const faltando = d.itens.filter((i) => i.obrigatorio && i.status !== "aprovado");
  if (!faltando.length) return null;
  return `${faltando.length} item(ns) obrigatório(s) sem aprovação: ${faltando.map((i) => i.nome).join(", ")}`;
}

// -------------------------------------------------------------- ações do caso

export type GrupoAcao =
  "Atendimento" | "Validação" | "Dossiê" | "Comercial" | "Emissão" | "Entrega" | "Conformidade";

export interface AcaoWorkspace {
  id: string;
  label: string;
  grupo: GrupoAcao;
  oQueAcontece: string;
  evidencia: string;
  proximoResponsavel: string;
  liberadas: string[];
  bloqueadas: string[];
  motivoObrigatorio?: boolean;
  destrutiva?: boolean;
  regulatoria?: boolean;
  /** Ação que só existe dentro de uma emissão específica — vive na aba Emissões. */
  porEmissao?: boolean;
}

export const acoesWorkspace: AcaoWorkspace[] = [
  {
    id: "registrar-contato",
    label: "Registrar contato",
    grupo: "Atendimento",
    oQueAcontece: "Registra a tentativa de contato e reinicia o relógio de espera do cliente.",
    evidencia: "Nota de contato com canal, horário e autor.",
    proximoResponsavel: "Vendas Indiretas (VI)",
    liberadas: ["Solicitar informação", "Agendar atendimento"],
    bloqueadas: [],
  },
  {
    id: "solicitar-informacao",
    label: "Solicitar informação",
    grupo: "Atendimento",
    oQueAcontece: "Envia pedido de informação ao titular e coloca o caso em espera do cliente.",
    evidencia: "Mensagem enviada + item de pendência aberto.",
    proximoResponsavel: "Cliente",
    liberadas: ["Registrar contato"],
    bloqueadas: ["Enviar para verificação"],
    motivoObrigatorio: true,
  },
  {
    id: "agendar",
    label: "Agendar atendimento",
    grupo: "Atendimento",
    oQueAcontece: "Reserva horário de videoconferência com o agente de registro.",
    evidencia: "Agendamento na agenda operacional com link e responsável.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: ["Reagendar", "Registrar no-show"],
    bloqueadas: [],
  },
  {
    id: "no-show",
    label: "Registrar no-show",
    grupo: "Atendimento",
    oQueAcontece: "Marca a ausência do titular e devolve o caso para reagendamento.",
    evidencia: "Registro de ausência com horário previsto e tolerância.",
    proximoResponsavel: "Vendas Indiretas (VI)",
    liberadas: ["Reagendar"],
    bloqueadas: ["Registrar resultado da validação"],
    motivoObrigatorio: true,
  },
  {
    id: "reagendar",
    label: "Reagendar",
    grupo: "Atendimento",
    oQueAcontece: "Substitui o horário atual por um novo, mantendo o histórico.",
    evidencia: "Novo agendamento + motivo da remarcação.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: ["Registrar no-show"],
    bloqueadas: [],
    motivoObrigatorio: true,
  },
  {
    id: "resultado-validacao",
    label: "Registrar resultado da validação",
    grupo: "Validação",
    oQueAcontece: "Conclui a identificação presencial ou por vídeo e libera a emissão.",
    evidencia: "Ata de validação com agente, data e modalidade.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: ["Registrar emissão manual"],
    bloqueadas: ["Aprovar diretamente"],
    regulatoria: true,
  },
  {
    id: "aprovar-direto",
    label: "Aprovar diretamente",
    grupo: "Validação",
    oQueAcontece: "Aprova a validação sem nova coleta, quando o dossiê já é suficiente.",
    evidencia: "Justificativa de aprovação direta e responsável.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: ["Registrar emissão manual"],
    bloqueadas: [],
    motivoObrigatorio: true,
    regulatoria: true,
  },
  {
    id: "abrir-dossie",
    label: "Abrir montagem de dossiê",
    grupo: "Dossiê",
    oQueAcontece: "Atribui a montagem à montadora e abre o checklist do produto.",
    evidencia: "Checklist instanciado por produto e motivo.",
    proximoResponsavel: "Montadora de dossiê",
    liberadas: ["Enviar para verificação"],
    bloqueadas: [],
  },
  {
    id: "enviar-verificacao",
    label: "Enviar para verificação",
    grupo: "Dossiê",
    oQueAcontece: "Encaminha o dossiê para conferência independente.",
    evidencia: "Snapshot das versões dos documentos enviados.",
    proximoResponsavel: "Verificadora",
    liberadas: ["Registrar divergência", "Registrar resultado da validação"],
    bloqueadas: ["Abrir montagem de dossiê"],
    regulatoria: true,
  },
  {
    id: "divergencia",
    label: "Registrar divergência",
    grupo: "Dossiê",
    oQueAcontece: "Devolve o dossiê à montagem com apontamento do item divergente.",
    evidencia: "Item, motivo e histórico de devolução.",
    proximoResponsavel: "Montadora de dossiê",
    liberadas: ["Abrir montagem de dossiê"],
    bloqueadas: ["Registrar emissão manual"],
    motivoObrigatorio: true,
  },
  {
    id: "confirmar-pagamento",
    porEmissao: true,
    label: "Confirmar pagamento",
    grupo: "Comercial",
    oQueAcontece: "Confirma o pagamento de uma emissão específica do caso.",
    evidencia: "Comprovante e conciliação financeira da emissão.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: ["Registrar emissão manual"],
    bloqueadas: [],
  },
  {
    id: "excecao-comercial",
    porEmissao: true,
    label: "Autorizar exceção comercial",
    grupo: "Comercial",
    oQueAcontece: "Libera a emissão com condição especial (cortesia, dispensa ou desconto).",
    evidencia: "Autorização nominal com valor, motivo e alçada.",
    proximoResponsavel: "Financeiro",
    liberadas: ["Registrar emissão manual"],
    bloqueadas: [],
    motivoObrigatorio: true,
  },
  {
    id: "emissao-manual",
    porEmissao: true,
    label: "Registrar emissão manual",
    grupo: "Emissão",
    oQueAcontece:
      "Registra a emissão feita no portal da AC e deixa a emissão Aguardando conferência.",
    evidencia: "Resultado, AC, protocolo externo, série, datas e comprovante.",
    proximoResponsavel: "Segundo operador (conferência)",
    liberadas: ["Conferir emissão manual"],
    bloqueadas: ["Registrar resultado da validação"],
    regulatoria: true,
  },
  {
    id: "conferir-emissao",
    porEmissao: true,
    label: "Conferir emissão manual",
    grupo: "Emissão",
    oQueAcontece: "Um segundo operador confere os dados e o comprovante e confirma ou devolve o registro.",
    evidencia: "Decisão, motivo, autor e horário da conferência.",
    proximoResponsavel: "Suporte de entrega",
    liberadas: ["Definir entrega"],
    bloqueadas: [],
    regulatoria: true,
  },
  {
    id: "confirmar-entrega",
    porEmissao: true,
    label: "Confirmar entrega ao titular",
    grupo: "Entrega",
    oQueAcontece: "Confirma que o titular recebeu as instruções de acesso desta emissão.",
    evidencia: "Confirmação com canal, horário e autor.",
    proximoResponsavel: "Suporte de entrega",
    liberadas: ["Confirmar instalação e funcionamento"],
    bloqueadas: [],
  },
  {
    id: "reprocessar",
    porEmissao: true,
    label: "Reprocessar integração",
    grupo: "Emissão",
    oQueAcontece: "Reenvia o pedido à integração da AC após falha técnica.",
    evidencia: "Log da tentativa e código de retorno.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: [],
    bloqueadas: [],
  },
  {
    id: "enviar-cliente",
    porEmissao: true,
    label: "Definir entrega",
    grupo: "Entrega",
    oQueAcontece:
      "Define quem envia as instruções de acesso ao titular — a AR nunca transporta o certificado.",
    evidencia: "Forma de entrega, referência do envio, canal e horário.",
    proximoResponsavel: "Cliente",
    liberadas: ["Confirmar funcionamento"],
    bloqueadas: [],
  },
  {
    id: "envio-manual",
    porEmissao: true,
    label: "Abrir envio manual",
    grupo: "Entrega",
    oQueAcontece: "Cria tarefa de envio manual quando a entrega automática falha.",
    evidencia: "Tarefa de entrega com responsável e prazo.",
    proximoResponsavel: "Suporte de entrega",
    liberadas: ["Confirmar funcionamento"],
    bloqueadas: [],
    motivoObrigatorio: true,
  },
  {
    id: "agendar-instalacao",
    porEmissao: true,
    label: "Agendar instalação",
    grupo: "Entrega",
    oQueAcontece: "Marca suporte remoto para instalação do certificado.",
    evidencia: "Agendamento de suporte com horário e técnico.",
    proximoResponsavel: "Suporte de entrega",
    liberadas: ["Confirmar funcionamento"],
    bloqueadas: [],
  },
  {
    id: "confirmar-funcionamento",
    porEmissao: true,
    label: "Confirmar instalação e funcionamento",
    grupo: "Entrega",
    oQueAcontece:
      "Confirma instalação e funcionamento desta emissão. O caso segue aberto até todas as emissões ficarem em uso.",
    evidencia: "Confirmação do titular e teste de assinatura.",
    proximoResponsavel: "Suporte de entrega",
    liberadas: ["Solicitar revogação"],
    bloqueadas: ["Enviar ao cliente"],
  },
  {
    id: "solicitar-revogacao",
    porEmissao: true,
    label: "Solicitar revogação",
    grupo: "Conformidade",
    oQueAcontece: "Abre pedido de revogação do certificado emitido.",
    evidencia: "Pedido com motivo, solicitante e vínculo com o titular.",
    proximoResponsavel: "Conformidade",
    liberadas: ["Autorizar revogação"],
    bloqueadas: [],
    motivoObrigatorio: true,
  },
  {
    id: "autorizar-revogacao",
    porEmissao: true,
    label: "Autorizar revogação",
    grupo: "Conformidade",
    oQueAcontece: "Confirma a revogação junto à AC e encerra o ciclo do certificado.",
    evidencia: "Autorização nominal e protocolo de revogação.",
    proximoResponsavel: "Agente de Registro (AGR)",
    liberadas: [],
    bloqueadas: ["Enviar ao cliente"],
    destrutiva: true,
    motivoObrigatorio: true,
    regulatoria: true,
  },
  {
    id: "fraude",
    label: "Escalar suspeita de fraude",
    grupo: "Conformidade",
    oQueAcontece: "Congela o caso e envia à conformidade para apuração.",
    evidencia: "Alerta de fraude com indícios e responsável.",
    proximoResponsavel: "Conformidade",
    liberadas: [],
    bloqueadas: ["Registrar emissão manual", "Definir entrega"],
    destrutiva: true,
    motivoObrigatorio: true,
    regulatoria: true,
  },
];

// ------------------------------------------------------------------ cabeçalho

export interface CabecalhoCaso {
  numero: string;
  titular: string;
  organizacao: string;
  indicador: string;
  vd: string;
  vi: string;
  unidade: string;
  aguardandoClienteHoras: number;
  estadoGeral: string;
}

export function cabecalhoDe(r: Request): CabecalhoCaso {
  const contador = contadorDoCliente(r.clienteId);
  const h = hash(r.id);
  return {
    numero: r.protocolo,
    titular: r.cliente,
    organizacao: r.tipo.includes("CPF") ? "Pessoa física" : r.cliente,
    indicador: contador ? contador.nome : `Canal ${r.canal}`,
    vd: agentById("a4").nome,
    vi: agentById(contador ? "a2" : "a4").nome,
    unidade: unidadeDe(r),
    aguardandoClienteHoras: h % 37,
    estadoGeral:
      r.stage === "bloqueado"
        ? "Bloqueado"
        : r.stage === "concluido"
          ? "Concluído"
          : pendenciasDe(r).length
            ? "Em andamento com pendências"
            : "Em andamento",
  };
}
