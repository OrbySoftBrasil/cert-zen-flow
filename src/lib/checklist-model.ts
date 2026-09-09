// Checklist híbrido e tipado.
// O comportamento de um requisito vem SEMPRE da sua configuração explícita
// (modo de cumprimento), nunca do texto do rótulo. Renomear um item não muda
// nada do que ele exige.
import type { EmissaoCaso } from "@/lib/caso-model";
import type { ChecklistItem, Client, DocumentFile, Request } from "@/lib/mock-data";

// ------------------------------------------------------------------- tipos

export type ModoCumprimento =
  | "orientacao"
  | "confirmacao"
  | "documento"
  | "derivado"
  | "acao"
  | "decisao";

export type EscopoRequisito =
  | "caso"
  | "emissao"
  | "titular"
  | "organizacao"
  | "representante"
  | "atendimento";

export type EstadoRequisito =
  | "nao_iniciado"
  | "informativo"
  | "disponivel_reutilizacao"
  | "em_andamento"
  | "aguardando_info"
  | "automatico"
  | "reutilizado"
  | "confirmado"
  | "concluido"
  | "rejeitado"
  | "expirado"
  | "nao_aplicavel"
  | "dispensado";

export type OrigemRegra = "plataforma" | "ac" | "tenant";

/**
 * Política de não aplicabilidade do requisito. Regras de plataforma e AC não
 * podem ser dispensadas pelo tenant; exceções exigem alçada e justificativa.
 */
export type PoliticaNaoAplicavel = "nao_permitida" | "automatica" | "excecao_controlada";

export const POLITICAS_NA: { id: PoliticaNaoAplicavel; nome: string; hint: string }[] = [
  {
    id: "nao_permitida",
    nome: "Não permitida",
    hint: "Requisito regulatório: nenhum operador pode dispensá-lo neste caso.",
  },
  {
    id: "automatica",
    nome: "Determinada por regra",
    hint: "O próprio produto/modalidade decide se o requisito se aplica.",
  },
  {
    id: "excecao_controlada",
    nome: "Exceção controlada",
    hint: "Dispensa possível com permissão, justificativa e alçada registradas.",
  },
];

export const MODOS: {
  id: ModoCumprimento;
  nome: string;
  descricao: string;
  acao: string;
}[] = [
  {
    id: "orientacao",
    nome: "Orientação",
    descricao: "Apenas informativo. Não tem ação de conclusão e não bloqueia nada.",
    acao: "—",
  },
  {
    id: "confirmacao",
    nome: "Confirmação manual",
    descricao: "Atividade humana de baixo risco que o sistema não consegue verificar.",
    acao: "Confirmar realização",
  },
  {
    id: "documento",
    nome: "Documento existente ou novo",
    descricao: "Exige um documento de uma categoria. Reaproveita documento válido já enviado.",
    acao: "Enviar documento",
  },
  {
    id: "derivado",
    nome: "Estado derivado do sistema",
    descricao: "Concluído sozinho quando o registro correspondente existe. Nada é redigitado.",
    acao: "Ver registro",
  },
  {
    id: "acao",
    nome: "Ação estruturada do produto",
    descricao: "Leva o operador a uma ação conhecida do Certus e usa o resultado dela.",
    acao: "Executar ação",
  },
  {
    id: "decisao",
    nome: "Decisão ou aprovação controlada",
    descricao: "Exige permissão, motivo e — quando configurado — segundo operador.",
    acao: "Registrar decisão",
  },
];

export function modoInfo(m: ModoCumprimento) {
  return MODOS.find((x) => x.id === m) ?? MODOS[1]!;
}

export const ESCOPOS: { id: EscopoRequisito; nome: string }[] = [
  { id: "caso", nome: "Caso" },
  { id: "emissao", nome: "Emissão específica" },
  { id: "titular", nome: "Titular" },
  { id: "organizacao", nome: "Organização" },
  { id: "representante", nome: "Representante" },
  { id: "atendimento", nome: "Ato de atendimento" },
];

// ----------------------------------------------------- catálogo documental

export type CategoriaDoc =
  | "identidade"
  | "endereco"
  | "contrato-social"
  | "procuracao"
  | "comprovante-pagamento"
  | "termo-assinado"
  | "gravacao";

export const CATEGORIAS_DOC: {
  id: CategoriaDoc;
  nome: string;
  aceita: string[];
  validadeDiasPadrao: number;
}[] = [
  { id: "identidade", nome: "Documento de identidade", aceita: ["Identificação", "RG", "CNH", "Identidade"], validadeDiasPadrao: 3650 },
  { id: "endereco", nome: "Comprovante de endereço", aceita: ["Endereço", "Comprovante de endereço"], validadeDiasPadrao: 90 },
  { id: "contrato-social", nome: "Contrato social", aceita: ["Contrato social", "Societário"], validadeDiasPadrao: 1095 },
  { id: "procuracao", nome: "Procuração", aceita: ["Procuração"], validadeDiasPadrao: 365 },
  { id: "comprovante-pagamento", nome: "Comprovante de pagamento", aceita: ["Pagamento", "Comprovante"], validadeDiasPadrao: 365 },
  { id: "termo-assinado", nome: "Termo assinado", aceita: ["Termo"], validadeDiasPadrao: 3650 },
  { id: "gravacao", nome: "Gravação de videoconferência", aceita: ["Gravação", "Vídeo"], validadeDiasPadrao: 3650 },
];

export function categoriaInfo(c: CategoriaDoc) {
  return CATEGORIAS_DOC.find((x) => x.id === c) ?? CATEGORIAS_DOC[0]!;
}

// ------------------------------------------------------- estados derivados

export type ChaveDerivada =
  | "pagamento"
  | "agendamento"
  | "mensagem"
  | "entrega"
  | "instalacao"
  | "validacao"
  | "consulta-integrada";

export const DERIVADOS: { id: ChaveDerivada; nome: string; ver: string }[] = [
  { id: "pagamento", nome: "Pagamento confirmado", ver: "Ver pagamento" },
  { id: "agendamento", nome: "Agendamento criado", ver: "Ver agendamento" },
  { id: "mensagem", nome: "Mensagem enviada", ver: "Ver mensagem" },
  { id: "entrega", nome: "Entrega confirmada", ver: "Ver entrega" },
  { id: "instalacao", nome: "Instalação confirmada", ver: "Ver instalação" },
  { id: "validacao", nome: "Validação registrada", ver: "Ver validação" },
  { id: "consulta-integrada", nome: "Consulta integrada recebida", ver: "Ver retorno" },
];

// -------------------------------------------------- ações estruturadas

export type AcaoProduto =
  | "registrar-consulta"
  | "registrar-validacao"
  | "registrar-pagamento-manual"
  | "registrar-emissao-manual"
  | "registrar-entrega";

export const ACOES_PRODUTO: { id: AcaoProduto; nome: string }[] = [
  { id: "registrar-consulta", nome: "Registrar consulta" },
  { id: "registrar-validacao", nome: "Registrar resultado da validação" },
  { id: "registrar-pagamento-manual", nome: "Registrar pagamento manual" },
  { id: "registrar-emissao-manual", nome: "Registrar emissão manual" },
  { id: "registrar-entrega", nome: "Registrar entrega" },
];

export const RESULTADOS_CONSULTA = [
  "Nada consta",
  "Consta restrição",
  "Divergência de dados",
  "Inconclusivo",
] as const;

// ------------------------------------------------------------------- linha

export interface AcaoRequisito {
  id:
    | "confirmar"
    | "enviar-documento"
    | "reutilizar"
    | "solicitar-cliente"
    | "ver-evidencia"
    | "substituir"
    | "registrar-consulta"
    | "acao-produto"
    | "decidir"
    | "ver-registro"
    | "reabrir"
    | "nao-aplicavel";
  label: string;
  primaria?: boolean;
}

export interface LinhaRequisito {
  item: ChecklistItem;
  estado: EstadoRequisito;
  /** Motivo da pendência ou da conclusão. */
  motivo: string;
  /** Origem da evidência / do estado. */
  origem: string | null;
  acoes: AcaoRequisito[];
  /** Ação protegida que este item bloqueia enquanto não é atendido. */
  bloqueia: string | null;
  reutilizaveis: DocumentFile[];
}

export const rotuloEstadoRequisito: Record<EstadoRequisito, string> = {
  nao_iniciado: "Não iniciado",
  informativo: "Orientação",
  disponivel_reutilizacao: "Documento disponível para reutilização",
  em_andamento: "Em andamento",
  aguardando_info: "Aguardando informação",
  automatico: "Atendido automaticamente",
  reutilizado: "Atendido com evidência reutilizada",
  confirmado: "Confirmado manualmente",
  concluido: "Concluído",
  rejeitado: "Rejeitado / divergente",
  expirado: "Expirado",
  nao_aplicavel: "Não aplicável por regra",
  dispensado: "Dispensado por exceção",
};

export const ESTADOS_ATENDIDOS: EstadoRequisito[] = [
  "automatico",
  "reutilizado",
  "confirmado",
  "concluido",
];

/** Requisito resolvido: atendido, não aplicável por regra ou dispensado. */
export function requisitoAtendido(l: LinhaRequisito) {
  return (
    ESTADOS_ATENDIDOS.includes(l.estado) ||
    l.estado === "nao_aplicavel" ||
    l.estado === "dispensado"
  );
}

/** Itens que entram no denominador do progresso: fora orientação e não aplicáveis. */
export function contaNoProgresso(l: LinhaRequisito) {
  return (
    l.item.modo !== "orientacao" && l.estado !== "nao_aplicavel" && l.estado !== "informativo"
  );
}

export function progressoChecklist(linhas: LinhaRequisito[]) {
  const consideradas = linhas.filter(contaNoProgresso);
  const atendidos = consideradas.filter(requisitoAtendido).length;
  const total = consideradas.length;
  return { atendidos, total, pct: total ? Math.round((atendidos / total) * 100) : 100 };
}

/** Política efetiva: regra de plataforma/AC nunca é dispensável pelo tenant. */
export function politicaNaoAplicavelDe(item: ChecklistItem): PoliticaNaoAplicavel {
  if (item.politicaNaoAplicavel) return item.politicaNaoAplicavel;
  if (item.origemRegra === "plataforma" || item.origemRegra === "ac") return "nao_permitida";
  if (item.modo === "orientacao") return "nao_permitida";
  return "excecao_controlada";
}

// ----------------------------------------------------------- reutilização

function diasDesde(iso: string) {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.floor((Date.now() - d) / 86400000);
}

/**
 * Documentos já existentes que atendem o requisito: mesma categoria, status
 * aprovado, dentro da validade, não substituídos e não rejeitados.
 */
function mesmaCategoria(d: DocumentFile, item: ChecklistItem) {
  const cat = categoriaInfo(item.categoriaDoc ?? "identidade");
  if (d.categoria) return d.categoria === cat.id;
  return cat.aceita.some((t) => d.tipo.toLowerCase().includes(t.toLowerCase()));
}

/** Escopo exigido pelo requisito x escopo do documento. */
function escopoCompativel(d: DocumentFile, item: ChecklistItem) {
  const exigido = item.escopo ?? "caso";
  if (!d.escopo) return true; // documento legado do protótipo: escopo não declarado
  if (exigido === "caso" || exigido === "atendimento") return true;
  return d.escopo === exigido;
}

/** Sujeito proprietário: identidade de um titular não atende outro sujeito. */
function sujeitoCompativel(d: DocumentFile, item: ChecklistItem, cliente: Client) {
  if (d.sujeitoId && d.sujeitoId !== cliente.id) return false;
  if ((item.escopo ?? "caso") === "emissao" && item.emissaoId) {
    // Evidência vinculada a outra emissão nunca libera esta.
    return !d.emissaoId || d.emissaoId === item.emissaoId;
  }
  return true;
}

export function validadeRestanteDias(d: DocumentFile, item: ChecklistItem) {
  const cat = categoriaInfo(item.categoriaDoc ?? "identidade");
  const validade = item.validadeDias ?? cat.validadeDiasPadrao;
  return validade - diasDesde(d.enviadoEm);
}

/** Frase curta explicando por que o documento serve para este requisito. */
export function motivoCompatibilidade(d: DocumentFile, item: ChecklistItem, cliente?: Client) {
  const cat = categoriaInfo(item.categoriaDoc ?? "identidade");
  const restante = validadeRestanteDias(d, item);
  return [
    `Categoria ${cat.nome.toLowerCase()}`,
    `escopo ${d.escopo ?? item.escopo ?? "caso"}`,
    `sujeito ${d.sujeitoNome ?? cliente?.nome ?? "—"}`,
    "status aprovado",
    `${restante} dia(s) de validade restante`,
  ].join(" · ");
}

/**
 * Documentos existentes que atendem o requisito: tenant, categoria, escopo,
 * sujeito correto, status aprovado, validade vigente, versão não substituída e
 * política de reutilização permitida.
 */
export function documentosCompativeis(item: ChecklistItem, cliente?: Client): DocumentFile[] {
  if (!cliente || item.modo !== "documento" || !item.categoriaDoc) return [];
  if (item.reutilizacao === "vedada") return [];
  const validade = item.validadeDias ?? categoriaInfo(item.categoriaDoc).validadeDiasPadrao;
  return cliente.documentos.filter(
    (d) =>
      d.status === "aprovado" &&
      !d.substituido &&
      mesmaCategoria(d, item) &&
      escopoCompativel(d, item) &&
      sujeitoCompativel(d, item, cliente) &&
      diasDesde(d.enviadoEm) <= validade,
  );
}

function documentoVencido(item: ChecklistItem, cliente?: Client) {
  if (!cliente || !item.categoriaDoc) return null;
  const validade = item.validadeDias ?? categoriaInfo(item.categoriaDoc).validadeDiasPadrao;
  return (
    cliente.documentos.find(
      (d) =>
        mesmaCategoria(d, item) &&
        escopoCompativel(d, item) &&
        sujeitoCompativel(d, item, cliente) &&
        (d.status === "reprovado" || diasDesde(d.enviadoEm) > validade),
    ) ?? null
  );
}

// -------------------------------------------------------------- derivados

export interface FatoDerivado {
  presente: boolean;
  detalhe: string;
}

function fatoDe(
  chave: ChaveDerivada,
  emissao: EmissaoCaso | undefined,
  r: Request,
): FatoDerivado {
  switch (chave) {
    case "pagamento":
      return emissao?.pagamento.estado === "concluido"
        ? { presente: true, detalhe: emissao.pagamento.detalhe }
        : { presente: false, detalhe: emissao?.pagamento.detalhe ?? "Pagamento ainda não confirmado" };
    case "validacao":
      return emissao?.validacao === "concluido"
        ? { presente: true, detalhe: "Validação registrada nesta emissão" }
        : { presente: false, detalhe: "Validação ainda não registrada" };
    case "entrega":
      return emissao?.entrega === "concluido"
        ? { presente: true, detalhe: "Entrega confirmada" }
        : { presente: false, detalhe: "Entrega ainda não confirmada" };
    case "instalacao":
      return emissao?.instalacao === "concluido"
        ? { presente: true, detalhe: "Instalação e funcionamento confirmados" }
        : { presente: false, detalhe: "Instalação ainda não confirmada" };
    case "agendamento": {
      const ev = r.timeline.find((t) => /agend/i.test(t.titulo));
      return ev
        ? { presente: true, detalhe: `${ev.titulo} · ${ev.quando}` }
        : { presente: false, detalhe: "Nenhum agendamento criado para este caso" };
    }
    case "mensagem": {
      const ev = r.timeline.find((t) => /mensagem|instruç|enviad/i.test(t.titulo));
      return ev
        ? { presente: true, detalhe: `${ev.titulo} · ${ev.quando}` }
        : { presente: false, detalhe: "Nenhuma mensagem registrada" };
    }
    case "consulta-integrada":
    default:
      return { presente: false, detalhe: "Retorno automático ainda não recebido" };
  }
}

// ------------------------------------------------------------ estado final

export interface ContextoChecklist {
  request: Request;
  cliente?: Client;
  emissoes: EmissaoCaso[];
}

export function linhaRequisito(item: ChecklistItem, ctx: ContextoChecklist): LinhaRequisito {
  const bloqueia = item.obrigatorio === false ? null : (item.bloqueia ?? null);
  const base = { item, bloqueia, reutilizaveis: [] as DocumentFile[] };

  const politica = politicaNaoAplicavelDe(item);
  const acaoNA: AcaoRequisito[] =
    politica === "nao_permitida" ? [] : [{ id: "nao-aplicavel", label: "Não se aplica" }];

  if (item.naoAplicavel) {
    const excecao = item.naoAplicavel.tipo === "excecao";
    return {
      ...base,
      bloqueia: null,
      estado: excecao ? "dispensado" : "nao_aplicavel",
      motivo: item.naoAplicavel.motivo,
      origem: `${excecao ? "Exceção autorizada" : "Regra"}: ${item.naoAplicavel.regra}${
        item.naoAplicavel.por ? ` · ${item.naoAplicavel.por}` : ""
      }${item.naoAplicavel.quando ? ` · ${item.naoAplicavel.quando}` : ""}`,
      acoes: [{ id: "reabrir", label: "Reavaliar" }],
    };
  }

  if (item.modo === "orientacao") {
    return {
      ...base,
      bloqueia: null,
      estado: "informativo",
      motivo: item.instrucao ?? "Item informativo — apenas orienta o operador.",
      origem: "Orientação: não entra no progresso e não bloqueia ações",
      acoes: [],
    };
  }

  const ev = item.evidencia;
  if (ev) {
    const estado: EstadoRequisito =
      ev.origem === "reutilizada"
        ? "reutilizado"
        : ev.origem === "automatica"
          ? "automatico"
          : ev.origem === "confirmacao"
            ? "confirmado"
            : "concluido";
    const partes = [ev.referencia, ev.arquivo, ev.resultado, ev.valor, ev.observacao].filter(Boolean);
    return {
      ...base,
      bloqueia: null,
      estado,
      motivo: partes.join(" · ") || "Requisito atendido",
      origem: `${origemLabel(ev.origem)} · ${ev.por} · ${ev.registradoEm}`,
      acoes: [
        ...(ev.arquivo || ev.documentoId
          ? ([{ id: "ver-evidencia", label: "Ver documento" }] as AcaoRequisito[])
          : ([{ id: "ver-evidencia", label: "Ver registro" }] as AcaoRequisito[])),
        ...(item.modo === "documento"
          ? ([{ id: "substituir", label: "Substituir" }] as AcaoRequisito[])
          : []),
        { id: "reabrir", label: "Reabrir" },
      ],
    };
  }

  if (item.modo === "derivado" && item.chaveDerivada) {
    const emissao =
      ctx.emissoes.find((e) => e.id === item.emissaoId) ??
      ctx.emissoes.find((e) => e.principal) ??
      ctx.emissoes[0];
    const fato = fatoDe(item.chaveDerivada, emissao, ctx.request);
    const nome = DERIVADOS.find((d) => d.id === item.chaveDerivada);
    if (fato.presente) {
      return {
        ...base,
        bloqueia: null,
        estado: "automatico",
        motivo: fato.detalhe,
        origem: `Registro do sistema${emissao && item.emissaoId ? ` · ${emissao.produto}` : ""}`,
        acoes: [{ id: "ver-registro", label: nome?.ver ?? "Ver registro" }],
      };
    }
    return {
      ...base,
      estado: "aguardando_info",
      motivo: fato.detalhe,
      origem: "Aguardando registro do sistema — nada é redigitado aqui",
      acoes: [{ id: "ver-registro", label: nome?.ver ?? "Ver registro" }],
    };
  }

  if (item.modo === "documento") {
    const compativeis = documentosCompativeis(item, ctx.cliente);
    const vencido = documentoVencido(item, ctx.cliente);
    if (compativeis.length > 0) {
      return {
        ...base,
        reutilizaveis: compativeis,
        estado: "disponivel_reutilizacao",
        motivo: `Documento compatível já existe: ${compativeis[0]!.nome}`,
        origem: "Dossiê do cliente — pode ser reutilizado sem novo envio",
        acoes: [
          { id: "reutilizar", label: "Usar documento existente", primaria: true },
          { id: "enviar-documento", label: "Enviar nova versão" },
          ...acaoNA,
        ],
      };
    }
    return {
      ...base,
      estado: vencido ? "expirado" : "nao_iniciado",
      motivo: vencido
        ? vencido.status === "reprovado"
          ? `Documento anterior rejeitado (${vencido.nome})`
          : `Documento anterior vencido (${vencido.nome}, de ${vencido.enviadoEm})`
        : `Nenhum documento compatível de ${categoriaInfo(item.categoriaDoc ?? "identidade").nome.toLowerCase()}.`,
      origem: null,
      acoes: [
        { id: "enviar-documento", label: vencido ? "Enviar nova versão" : "Enviar documento", primaria: true },
        { id: "solicitar-cliente", label: "Solicitar ao cliente" },
        ...acaoNA,
      ],
    };
  }

  if (item.modo === "acao") {
    const acao = ACOES_PRODUTO.find((a) => a.id === item.acaoProduto);
    return {
      ...base,
      estado: "nao_iniciado",
      motivo: `Concluído a partir do resultado da ação “${acao?.nome ?? "ação do produto"}”.`,
      origem: null,
      acoes: [
        item.acaoProduto === "registrar-consulta"
          ? { id: "registrar-consulta", label: "Registrar consulta", primaria: true }
          : { id: "acao-produto", label: acao?.nome ?? "Executar ação", primaria: true },
        ...acaoNA,
      ],
    };
  }

  if (item.modo === "decisao") {
    return {
      ...base,
      estado: "nao_iniciado",
      motivo: `Decisão controlada — exige motivo${item.exigeSegundoOperador ? " e segundo operador" : ""}.`,
      origem: null,
      acoes: [{ id: "decidir", label: "Registrar decisão", primaria: true }],
    };
  }

  // confirmação manual
  return {
    ...base,
    estado: "nao_iniciado",
    motivo: item.instrucao ?? "Atividade humana — o sistema não consegue verificar sozinho.",
    origem: null,
    acoes: [
      { id: "confirmar", label: "Confirmar realização", primaria: true },
      ...acaoNA,
    ],
  };
}

export function origemLabel(o: string): string {
  switch (o) {
    case "reutilizada":
      return "Reutilizado";
    case "automatica":
      return "Verificado automaticamente";
    case "manual":
      return "Registrado manualmente";
    case "confirmacao":
      return "Confirmado manualmente";
    case "decisao":
      return "Decisão registrada";
    default:
      return "Evidência nova";
  }
}

export function linhasDoCaso(ctx: ContextoChecklist): LinhaRequisito[] {
  return ctx.request.checklist.map((i) => linhaRequisito(i, ctx));
}

/** Portões: só o que é obrigatório e não atendido bloqueia — e só a ação configurada. */
export function portoesAtivos(linhas: LinhaRequisito[]) {
  return linhas
    .filter((l) => l.item.obrigatorio !== false && l.bloqueia && !requisitoAtendido(l))
    .map((l) => ({
      acao: l.bloqueia!,
      item: l.item.label,
      motivo: l.motivo,
      responsavel: l.item.responsavel ?? "Agente de registro",
      emissaoId: l.item.emissaoId ?? null,
      comoResolver: l.acoes.map((a) => a.label).join(" · ") || "Aguardar registro do sistema",
    }));
}

/** Ações protegidas canônicas: o portão do item aponta para uma delas. */
export const ACOES_PROTEGIDAS = [
  "Enviar dossiê para verificação",
  "Aprovar emissão",
  "Registrar emissão manual",
  "Confirmar emissão manual",
  "Registrar entrega",
  "Confirmar instalação",
  "Concluir caso",
] as const;

function normalizarAcao(a: string) {
  return a
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export interface Portao {
  acao: string;
  item: string;
  motivo: string;
  responsavel: string;
  emissaoId: string | null;
  comoResolver: string;
}

export interface AvaliacaoAcao {
  permitida: boolean;
  portoes: Portao[];
  /** Texto único para tooltip/aviso de bloqueio. */
  explicacao: string | null;
}

/**
 * Função central de avaliação: usada pelo checklist, pela prontidão, pelos
 * botões do cabeçalho, pelo painel de ações, pelas emissões e pela execução
 * final no store. Nenhuma ação protegida pode ser executada por outro caminho.
 */
export function avaliarAcao(
  acao: string,
  ctxOuLinhas: ContextoChecklist | LinhaRequisito[],
  opts: { emissaoId?: string } = {},
): AvaliacaoAcao {
  const linhas = Array.isArray(ctxOuLinhas) ? ctxOuLinhas : linhasDoCaso(ctxOuLinhas);
  const alvo = normalizarAcao(acao);
  const portoes = portoesAtivos(linhas).filter((p) => {
    const cfg = normalizarAcao(p.acao);
    if (cfg !== alvo && !cfg.startsWith(alvo) && !alvo.startsWith(cfg)) return false;
    // Requisito de uma emissão nunca bloqueia outra emissão.
    if (p.emissaoId && opts.emissaoId && p.emissaoId !== opts.emissaoId) return false;
    return true;
  });
  if (portoes.length === 0) return { permitida: true, portoes: [], explicacao: null };
  const p = portoes[0]!;
  const extra = portoes.length > 1 ? ` (+${portoes.length - 1} outro(s) requisito(s))` : "";
  return {
    permitida: false,
    portoes,
    explicacao: `Bloqueado por “${p.item}”: ${p.motivo}. Responsável: ${p.responsavel}. Como resolver: ${p.comoResolver}.${extra}`,
  };
}
