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
  | "em_andamento"
  | "aguardando_info"
  | "automatico"
  | "reutilizado"
  | "confirmado"
  | "concluido"
  | "rejeitado"
  | "expirado"
  | "nao_aplicavel";

export type OrigemRegra = "plataforma" | "ac" | "tenant";

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
  em_andamento: "Em andamento",
  aguardando_info: "Aguardando informação",
  automatico: "Atendido automaticamente",
  reutilizado: "Atendido com evidência reutilizada",
  confirmado: "Confirmado manualmente",
  concluido: "Concluído",
  rejeitado: "Rejeitado / divergente",
  expirado: "Expirado",
  nao_aplicavel: "Não aplicável",
};

export const ESTADOS_ATENDIDOS: EstadoRequisito[] = [
  "automatico",
  "reutilizado",
  "confirmado",
  "concluido",
];

export function requisitoAtendido(l: LinhaRequisito) {
  return ESTADOS_ATENDIDOS.includes(l.estado) || l.estado === "nao_aplicavel";
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
export function documentosCompativeis(item: ChecklistItem, cliente?: Client): DocumentFile[] {
  if (!cliente || item.modo !== "documento" || !item.categoriaDoc) return [];
  if (item.reutilizacao === "vedada") return [];
  const cat = categoriaInfo(item.categoriaDoc);
  const validade = item.validadeDias ?? cat.validadeDiasPadrao;
  return cliente.documentos.filter(
    (d) =>
      d.status === "aprovado" &&
      !d.substituido &&
      cat.aceita.some((t) => d.tipo.toLowerCase().includes(t.toLowerCase())) &&
      diasDesde(d.enviadoEm) <= validade,
  );
}

function documentoVencido(item: ChecklistItem, cliente?: Client) {
  if (!cliente || !item.categoriaDoc) return null;
  const cat = categoriaInfo(item.categoriaDoc);
  const validade = item.validadeDias ?? cat.validadeDiasPadrao;
  return (
    cliente.documentos.find(
      (d) =>
        cat.aceita.some((t) => d.tipo.toLowerCase().includes(t.toLowerCase())) &&
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

  if (item.naoAplicavel) {
    return {
      ...base,
      bloqueia: null,
      estado: "nao_aplicavel",
      motivo: item.naoAplicavel.motivo,
      origem: `Regra: ${item.naoAplicavel.regra}`,
      acoes: [{ id: "reabrir", label: "Reavaliar" }],
    };
  }

  if (item.modo === "orientacao") {
    return {
      ...base,
      bloqueia: null,
      estado: "nao_iniciado",
      motivo: item.instrucao ?? "Item informativo — apenas orienta o operador.",
      origem: null,
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
        estado: "em_andamento",
        motivo: `Documento compatível já existe: ${compativeis[0]!.nome}`,
        origem: "Dossiê do cliente — pode ser reutilizado sem novo envio",
        acoes: [
          { id: "reutilizar", label: "Usar documento existente", primaria: true },
          { id: "enviar-documento", label: "Enviar nova versão" },
          { id: "nao-aplicavel", label: "Não se aplica" },
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
        { id: "nao-aplicavel", label: "Não se aplica" },
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
        { id: "nao-aplicavel", label: "Não se aplica" },
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
      { id: "nao-aplicavel", label: "Não se aplica" },
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
    }));
}
