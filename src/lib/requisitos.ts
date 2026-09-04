// Gates de requisito: cada item de checklist exige uma ação concreta no
// sistema (anexo, registro de pagamento, agendamento, parecer...).
// Marcar "concluído" sem a evidência correspondente não é permitido.
import type { ChecklistItem, Request } from "@/lib/mock-data";

export type TipoEvidencia =
  | "documento"
  | "pagamento"
  | "agendamento"
  | "gravacao"
  | "assinatura"
  | "parecer"
  | "biometria"
  | "consulta"
  | "chave"
  | "entrega"
  | "contato";

export interface CampoEvidencia {
  id: "arquivo" | "referencia" | "valor" | "quando" | "observacao";
  label: string;
  hint?: string;
  tipo: "arquivo" | "texto" | "moeda" | "data" | "textarea";
  obrigatorio: boolean;
}

export interface RegraEvidencia {
  tipo: TipoEvidencia;
  acao: string; // rótulo do botão de ação
  titulo: string; // título do diálogo
  exigencia: string; // o que precisa acontecer
  campos: CampoEvidencia[];
  /** Anexos deste tipo entram também no dossiê do cliente. */
  vaiParaDossie?: boolean;
}

const arquivo = (label: string, hint: string): CampoEvidencia => ({
  id: "arquivo",
  label,
  hint,
  tipo: "arquivo",
  obrigatorio: true,
});

const obs: CampoEvidencia = {
  id: "observacao",
  label: "Observação",
  tipo: "textarea",
  obrigatorio: false,
};

export const regras: Record<TipoEvidencia, RegraEvidencia> = {
  documento: {
    tipo: "documento",
    acao: "Anexar documento",
    titulo: "Anexar documento do titular",
    exigencia: "É obrigatório anexar o arquivo legível e informar o tipo do documento.",
    vaiParaDossie: true,
    campos: [
      arquivo("Arquivo", "PDF ou imagem legível, frente e verso quando aplicável"),
      { id: "referencia", label: "Tipo / número do documento", tipo: "texto", obrigatorio: true },
      obs,
    ],
  },
  pagamento: {
    tipo: "pagamento",
    acao: "Registrar pagamento",
    titulo: "Registrar confirmação de pagamento",
    exigencia: "Informe o valor confirmado e o identificador da transação.",
    campos: [
      { id: "valor", label: "Valor confirmado", tipo: "moeda", obrigatorio: true },
      { id: "referencia", label: "Identificador da transação", hint: "Ex.: E2E do Pix, NSU do cartão", tipo: "texto", obrigatorio: true },
      { id: "arquivo", label: "Comprovante (opcional)", tipo: "arquivo", obrigatorio: false },
      obs,
    ],
  },
  agendamento: {
    tipo: "agendamento",
    acao: "Registrar agendamento",
    titulo: "Registrar agendamento com o titular",
    exigencia: "Informe data e hora combinadas e o canal de confirmação.",
    campos: [
      { id: "quando", label: "Data e hora", tipo: "data", obrigatorio: true },
      { id: "referencia", label: "Canal de confirmação", hint: "Ex.: WhatsApp do titular, e-mail", tipo: "texto", obrigatorio: true },
      obs,
    ],
  },
  gravacao: {
    tipo: "gravacao",
    acao: "Arquivar gravação",
    titulo: "Arquivar gravação da videoconferência",
    exigencia: "Anexe o arquivo da gravação e informe a duração da sessão.",
    vaiParaDossie: true,
    campos: [
      arquivo("Arquivo da gravação", "Vídeo da sessão de identificação"),
      { id: "referencia", label: "Duração / sala", tipo: "texto", obrigatorio: true },
      obs,
    ],
  },
  assinatura: {
    tipo: "assinatura",
    acao: "Coletar assinatura",
    titulo: "Registrar termo assinado",
    exigencia: "Anexe o termo assinado pelo titular.",
    vaiParaDossie: true,
    campos: [
      arquivo("Termo assinado", "Documento assinado digitalmente ou digitalizado"),
      { id: "referencia", label: "Assinado por", tipo: "texto", obrigatorio: true },
      obs,
    ],
  },
  parecer: {
    tipo: "parecer",
    acao: "Emitir parecer",
    titulo: "Registrar parecer do agente de registro",
    exigencia: "Escreva o parecer com no mínimo 20 caracteres — ele fica na trilha de auditoria.",
    campos: [
      { id: "observacao", label: "Parecer", hint: "Fundamente a decisão", tipo: "textarea", obrigatorio: true },
      { id: "referencia", label: "Agente responsável", tipo: "texto", obrigatorio: true },
    ],
  },
  biometria: {
    tipo: "biometria",
    acao: "Registrar conferência",
    titulo: "Registrar conferência biométrica",
    exigencia: "Anexe a captura utilizada e informe o resultado da conferência.",
    vaiParaDossie: true,
    campos: [
      arquivo("Captura facial", "Imagem usada na comparação"),
      { id: "referencia", label: "Resultado da comparação", hint: "Ex.: Similaridade 0,94 — aprovado", tipo: "texto", obrigatorio: true },
      obs,
    ],
  },
  consulta: {
    tipo: "consulta",
    acao: "Registrar consulta",
    titulo: "Registrar consulta em base pública",
    exigencia: "Informe a base consultada e o retorno obtido.",
    campos: [
      { id: "referencia", label: "Base consultada", hint: "Ex.: Receita Federal — CPF regular", tipo: "texto", obrigatorio: true },
      { id: "arquivo", label: "Print / retorno (opcional)", tipo: "arquivo", obrigatorio: false },
      obs,
    ],
  },
  chave: {
    tipo: "chave",
    acao: "Registrar geração",
    titulo: "Registrar geração do par de chaves",
    exigencia: "Informe a mídia e o identificador da chave gerada. O segredo nunca é armazenado aqui.",
    campos: [
      { id: "referencia", label: "Mídia / identificador da chave", tipo: "texto", obrigatorio: true },
      obs,
    ],
  },
  entrega: {
    tipo: "entrega",
    acao: "Confirmar entrega",
    titulo: "Confirmar entrega ao titular",
    exigencia: "Informe quem recebeu e como foi entregue.",
    campos: [
      { id: "referencia", label: "Recebido por / forma de entrega", tipo: "texto", obrigatorio: true },
      { id: "arquivo", label: "Protocolo de entrega (opcional)", tipo: "arquivo", obrigatorio: false },
      obs,
    ],
  },
  contato: {
    tipo: "contato",
    acao: "Registrar contato",
    titulo: "Registrar contato com o titular",
    exigencia: "Informe o canal usado e o retorno do titular.",
    campos: [
      { id: "referencia", label: "Canal do contato", hint: "Ex.: WhatsApp, ligação", tipo: "texto", obrigatorio: true },
      { id: "observacao", label: "Retorno do titular", tipo: "textarea", obrigatorio: true },
    ],
  },
};

const mapa: { termos: string[]; tipo: TipoEvidencia }[] = [
  { termos: ["pagamento", "cobrança", "financeir", "boleto", "pix", "fatura", "inadimpl", "regulariza"], tipo: "pagamento" },
  { termos: ["documento", "comprovante", "contrato social", "procuração", "identidade", "dossiê"], tipo: "documento" },
  { termos: ["biométr", "biometr", "facial"], tipo: "biometria" },
  { termos: ["base", "consulta", "checagem", "receita"], tipo: "consulta" },
  { termos: ["parecer", "conferência", "verificação", "validar dados"], tipo: "parecer" },
  { termos: ["convite", "agend", "disponibilidade", "remarcar"], tipo: "agendamento" },
  { termos: ["gravação", "videoconfer"], tipo: "gravacao" },
  { termos: ["termo", "assinat"], tipo: "assinatura" },
  { termos: ["chave", "par de chaves", "csr"], tipo: "chave" },
  { termos: ["entregar", "entrega", "mídia", "instalação"], tipo: "entrega" },
  { termos: ["confirmar dados", "contato", "titular", "pesquisa", "impedimento"], tipo: "contato" },
];

/** Tipo de evidência exigido por um item de checklist (determinístico pelo rótulo). */
export function tipoDoRequisito(item: ChecklistItem): TipoEvidencia {
  if (item.evidencia && item.evidencia.tipo in regras) return item.evidencia.tipo as TipoEvidencia;
  const label = item.label.toLowerCase();
  for (const m of mapa) if (m.termos.some((t) => label.includes(t))) return m.tipo;
  return "contato";
}

export function regraDoRequisito(item: ChecklistItem): RegraEvidencia {
  return regras[tipoDoRequisito(item)];
}

/** Itens que ainda não têm evidência registrada. */
export function requisitosPendentes(r: Request) {
  return r.checklist.filter((c) => !c.done);
}

export function resumoEvidencia(item: ChecklistItem): string | null {
  const e = item.evidencia;
  if (!e) return null;
  const partes = [e.referencia, e.arquivo, e.valor ? `R$ ${e.valor}` : "", e.observacao].filter(Boolean);
  return partes.join(" · ") || "Evidência registrada";
}
