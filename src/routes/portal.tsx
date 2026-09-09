// Portal público (sem login): abertura de chamado com identificação do cliente
// e autoagendamento da videoconferência de validação nos horários livres.
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  LifeBuoy,
  LifeBuoy as Life,
  Paperclip,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Chip } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { agents, type CertType, type Priority, type TicketCategoria } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Portal do cliente — Abrir chamado e agendar | Certus AC" },
      {
        name: "description",
        content:
          "Abra um chamado de suporte para seu certificado digital ou agende sua videoconferência de validação nos horários disponíveis. Sem cadastro e sem login.",
      },
      { property: "og:title", content: "Portal do cliente — Abrir chamado e agendar | Certus AC" },
      {
        property: "og:description",
        content: "Suporte e autoagendamento da validação do certificado digital, sem login.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portal,
});

const prioridades: Priority[] = ["baixa", "normal", "alta", "critica"];
const horariosBase = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:30",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
const nomesDia = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const tiposCert: CertType[] = ["e-CPF A1", "e-CPF A3", "e-CNPJ A1", "e-CNPJ A3", "Nuvem PJ"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function apenasDigitos(v: string) {
  return v.replace(/\D/g, "");
}
function documentoValido(v: string) {
  const n = apenasDigitos(v).length;
  return n === 11 || n === 14;
}
function emailValido(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
function telefoneValido(v: string) {
  return apenasDigitos(v).length >= 10;
}

interface Identificacao {
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  empresa: string;
}

const identificacaoVazia: Identificacao = {
  nome: "",
  documento: "",
  email: "",
  telefone: "",
  empresa: "",
};

function CampoTexto({
  label,
  valor,
  onChange,
  placeholder,
  erro,
  maxLength,
  className,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  erro?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={valor}
        maxLength={maxLength ?? 140}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className={cn(
          "mt-1 w-full rounded-md border bg-card px-2.5 py-2 text-sm outline-none transition-colors focus:border-primary",
          erro ? "border-alert" : "border-border",
        )}
      />
      {erro && <span className="text-[11px] text-alert">{erro}</span>}
    </label>
  );
}

function BlocoIdentificacao({
  dados,
  onChange,
  mostrarErros,
}: {
  dados: Identificacao;
  onChange: (d: Identificacao) => void;
  mostrarErros: boolean;
}) {
  const set = (k: keyof Identificacao) => (v: string) => onChange({ ...dados, [k]: v });
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Seus dados
      </p>
      <p className="mb-3 text-[11px] text-muted-foreground">
        Precisamos identificar você para localizar o certificado e responder com segurança.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <CampoTexto
          label="Nome completo"
          valor={dados.nome}
          onChange={set("nome")}
          placeholder="Ana Paula Ribeiro"
          {...(mostrarErros && dados.nome.trim().length < 3
            ? { erro: "Informe seu nome completo" }
            : {})}
        />
        <CampoTexto
          label="CPF ou CNPJ"
          valor={dados.documento}
          onChange={set("documento")}
          placeholder="000.000.000-00"
          maxLength={18}
          {...(mostrarErros && !documentoValido(dados.documento)
            ? { erro: "CPF ou CNPJ inválido" }
            : {})}
        />
        <CampoTexto
          label="E-mail"
          valor={dados.email}
          onChange={set("email")}
          placeholder="voce@empresa.com.br"
          {...(mostrarErros && !emailValido(dados.email) ? { erro: "E-mail inválido" } : {})}
        />
        <CampoTexto
          label="Telefone / WhatsApp"
          valor={dados.telefone}
          onChange={set("telefone")}
          placeholder="(11) 90000-0000"
          maxLength={20}
          {...(mostrarErros && !telefoneValido(dados.telefone)
            ? { erro: "Telefone inválido" }
            : {})}
        />
        <CampoTexto
          label="Empresa (opcional)"
          valor={dados.empresa}
          onChange={set("empresa")}
          placeholder="Construtora Vale Norte LTDA"
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}

function identificacaoOk(d: Identificacao) {
  return (
    d.nome.trim().length >= 3 &&
    documentoValido(d.documento) &&
    emailValido(d.email) &&
    telefoneValido(d.telefone)
  );
}

function Portal() {
  const { addTicket, addAppointment, appointments } = useStore();
  const { settings } = useSettings();
  const [aba, setAba] = useState<"chamado" | "agenda">("chamado");

  const classificacoes = settings.classificacoes.filter((c) => c.ativo && c.visivelPortal);
  const artigos = settings.conhecimento.filter((d) => d.publicadoNoPortal);

  // ---------- chamado ----------
  const [identChamado, setIdentChamado] = useState<Identificacao>(identificacaoVazia);
  const [erros, setErros] = useState(false);
  const [categoria, setCategoria] = useState(classificacoes[0]?.nome ?? "Outros");
  const classe = classificacoes.find((c) => c.nome === categoria);
  const [sub, setSub] = useState(classificacoes[0]?.subcategorias[0] ?? "");
  const [prioridade, setPrioridade] = useState<Priority>("normal");
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anexos, setAnexos] = useState<string[]>([]);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sugestoes = artigos.filter((a) => a.classificacao === categoria);

  function enviarChamado() {
    const formOk =
      identificacaoOk(identChamado) && assunto.trim().length >= 5 && descricao.trim().length >= 10;
    if (!formOk) {
      setErros(true);
      toast.error("Revise os campos destacados antes de enviar.");
      return;
    }
    const novo = addTicket({
      clienteId: "publico",
      clienteNome: identChamado.empresa.trim() || identChamado.nome.trim(),
      contato: `${identChamado.email.trim()} · ${identChamado.telefone.trim()}`,
      assunto: assunto.trim(),
      categoria: categoria as TicketCategoria,
      subcategoria: sub || "Dúvida geral",
      canal: "Site",
      prioridade,
      responsavelId: "a1",
      tags: ["portal público", identChamado.documento.trim()],
      descricao: `${descricao.trim()}\n\n— ${identChamado.nome.trim()} · ${identChamado.documento.trim()}${
        anexos.length ? `\nAnexos: ${anexos.join(", ")}` : ""
      }`,
    });
    setProtocolo(novo.numero);
    toast.success("Chamado aberto", {
      description: `Protocolo ${novo.numero} — enviamos a confirmação para ${identChamado.email.trim()}.`,
    });
    setAssunto("");
    setDescricao("");
    setAnexos([]);
    setErros(false);
  }

  // ---------- agendamento (autoatendimento) ----------
  const [identAgenda, setIdentAgenda] = useState<Identificacao>(identificacaoVazia);
  const [errosAgenda, setErrosAgenda] = useState(false);
  const [tipo, setTipo] = useState<CertType>("e-CNPJ A1");
  const [semana, setSemana] = useState(0);
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [horaSel, setHoraSel] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{ dia: string; hora: string; sala: string } | null>(
    null,
  );

  const dias = useMemo(() => {
    const out: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const cursor = new Date(base);
    cursor.setDate(cursor.getDate() + 1 + semana * 5);
    while (out.length < 5) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [semana]);

  function ocupados(diaIso: string) {
    return appointments
      .filter((a) => a.dia === diaIso && a.status !== "no-show")
      .map((a) => a.hora);
  }

  function confirmarAgendamento() {
    if (!identificacaoOk(identAgenda) || !diaSel || !horaSel) {
      setErrosAgenda(true);
      toast.error("Preencha seus dados e escolha um horário.");
      return;
    }
    const sala = `sala-${Math.floor(100 + Math.random() * 800)}`;
    addAppointment({
      clienteId: "publico",
      clienteNome: identAgenda.empresa.trim() || identAgenda.nome.trim(),
      tipo,
      agenteId: agents[0]?.id ?? "a1",
      dia: diaSel,
      hora: horaSel,
      duracaoMin: 30,
      sala,
    });
    setConfirmado({ dia: diaSel, hora: horaSel, sala });
    toast.success("Videoconferência agendada", {
      description: `${diaSel.slice(8, 10)}/${diaSel.slice(5, 7)} às ${horaSel} — link enviado por e-mail e WhatsApp.`,
    });
    setDiaSel(null);
    setHoraSel(null);
    setErrosAgenda(false);
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-4">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Certus AC · Portal do cliente</p>
            <p className="text-[11px] text-muted-foreground">
              Atendimento público — não é necessário login
            </p>
          </div>
          <Link to="/chamados" className="ml-auto text-xs text-primary hover:underline">
            Acesso interno
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Como podemos ajudar?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra um chamado de suporte ou reserve o horário da sua videoconferência de validação.
          Atendimento das 8h às 20h em dias úteis.
        </p>

        <div className="mt-5 inline-flex rounded-lg border border-border bg-card p-1">
          {(
            [
              ["chamado", "Abrir chamado", Life],
              ["agenda", "Agendar validação", CalendarClock],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                aba === id
                  ? "bg-primary-soft font-medium text-primary-deep"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          {aba === "chamado" ? (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-sm font-semibold">Novo chamado</h2>

              {protocolo && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-primary-soft px-3 py-2.5 text-sm text-primary-deep">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Chamado <strong>{protocolo}</strong> registrado. Guarde este protocolo: as
                    atualizações chegam por e-mail e WhatsApp. Primeira resposta prevista em até{" "}
                    {classe?.slaRespostaHoras ?? 4} horas úteis.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-4">
                <BlocoIdentificacao
                  dados={identChamado}
                  onChange={setIdentChamado}
                  mostrarErros={erros}
                />

                <div>
                  <span className="text-xs text-muted-foreground">Classificação</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {classificacoes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCategoria(c.nome);
                          setSub(c.subcategorias[0] ?? "");
                          setPrioridade(c.prioridadePadrao as Priority);
                        }}
                        className={cn(
                          "rounded-md px-2.5 py-1.5 text-xs transition-colors",
                          categoria === c.nome
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:border-primary",
                        )}
                      >
                        {c.nome}
                      </button>
                    ))}
                  </div>
                  {classe?.descricao && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{classe.descricao}</p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Assunto específico</span>
                    <select
                      value={sub}
                      onChange={(e) => setSub(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                    >
                      {(classe?.subcategorias ?? ["Dúvida geral"]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Urgência</span>
                    <select
                      value={prioridade}
                      onChange={(e) => setPrioridade(e.target.value as Priority)}
                      className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm capitalize outline-none focus:border-primary"
                    >
                      {prioridades.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <CampoTexto
                  label="Título do chamado"
                  valor={assunto}
                  onChange={setAssunto}
                  placeholder="Ex.: certificado não aparece no e-CAC"
                  {...(erros && assunto.trim().length < 5
                    ? { erro: "Descreva o assunto em poucas palavras" }
                    : {})}
                />

                <label className="block">
                  <span className="text-xs text-muted-foreground">Descrição</span>
                  <textarea
                    value={descricao}
                    maxLength={2000}
                    rows={5}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o que aconteceu, mensagens de erro e o que já tentou."
                    className={cn(
                      "mt-1 w-full resize-none rounded-md border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary",
                      erros && descricao.trim().length < 10 ? "border-alert" : "border-border",
                    )}
                  />
                  <span className="tabular text-[11px] text-muted-foreground">
                    {descricao.length}/2000
                  </span>
                </label>

                {anexos.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {anexos.map((a) => (
                      <li
                        key={a}
                        className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px]"
                      >
                        {a}
                        <button
                          aria-label={`Remover ${a}`}
                          onClick={() => setAnexos((x) => x.filter((n) => n !== a))}
                          className="text-muted-foreground hover:text-alert"
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary"
                  >
                    <Paperclip className="size-3.5" /> Anexar print ou documento
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const nomes = Array.from(e.target.files ?? []).map((f) => f.name);
                      setAnexos((x) => [...new Set([...x, ...nomes])]);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  />
                  <button
                    onClick={enviarChamado}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Abrir chamado
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-sm font-semibold">
                Agendar videoconferência de validação
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha o melhor horário. A validação leva cerca de 30 minutos e exige documento com
                foto em mãos.
              </p>

              {confirmado && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-primary-soft px-3 py-2.5 text-sm text-primary-deep">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Agendado para{" "}
                    <strong>
                      {confirmado.dia.slice(8, 10)}/{confirmado.dia.slice(5, 7)}
                    </strong>{" "}
                    às <strong>{confirmado.hora}</strong> · {confirmado.sala}. O link da sala foi
                    enviado ao seu e-mail e WhatsApp. Você pode remarcar respondendo a essa
                    mensagem.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-4">
                <BlocoIdentificacao
                  dados={identAgenda}
                  onChange={setIdentAgenda}
                  mostrarErros={errosAgenda}
                />

                <label className="block">
                  <span className="text-xs text-muted-foreground">Tipo de certificado</span>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as CertType)}
                    className="mt-1 w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none focus:border-primary"
                  >
                    {tiposCert.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Horários disponíveis</span>
                    <div className="flex items-center gap-1">
                      <button
                        aria-label="Dias anteriores"
                        disabled={semana === 0}
                        onClick={() => setSemana((s) => Math.max(0, s - 1))}
                        className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground hover:border-primary disabled:opacity-40"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <button
                        aria-label="Próximos dias"
                        onClick={() => setSemana((s) => s + 1)}
                        className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground hover:border-primary"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {dias.map((d) => {
                      const chave = iso(d);
                      const cheios = ocupados(chave);
                      const livres = horariosBase.filter((h) => !cheios.includes(h));
                      return (
                        <div
                          key={chave}
                          className={cn(
                            "rounded-md border p-2",
                            diaSel === chave
                              ? "border-primary bg-primary-soft/40"
                              : "border-border",
                          )}
                        >
                          <p className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                            {nomesDia[d.getDay()]}
                          </p>
                          <p className="tabular text-center text-sm font-semibold">
                            {String(d.getDate()).padStart(2, "0")}/
                            {String(d.getMonth() + 1).padStart(2, "0")}
                          </p>
                          <div className="mt-2 space-y-1">
                            {livres.length === 0 && (
                              <p className="py-2 text-center text-[10px] text-muted-foreground">
                                Sem vagas
                              </p>
                            )}
                            {livres.map((h) => {
                              const ativo = diaSel === chave && horaSel === h;
                              return (
                                <button
                                  key={h}
                                  onClick={() => {
                                    setDiaSel(chave);
                                    setHoraSel(h);
                                  }}
                                  className={cn(
                                    "tabular block w-full rounded px-1 py-1 text-[11px] transition-colors",
                                    ativo
                                      ? "bg-primary text-primary-foreground font-medium"
                                      : "border border-border text-muted-foreground hover:border-primary hover:text-foreground",
                                  )}
                                >
                                  {h}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    {diaSel && horaSel ? (
                      <>
                        <Clock3 className="mr-1 inline size-3.5" />
                        {diaSel.slice(8, 10)}/{diaSel.slice(5, 7)} às {horaSel} · 30 min · online
                      </>
                    ) : (
                      "Selecione um horário para continuar"
                    )}
                  </p>
                  <button
                    onClick={confirmarAgendamento}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Video className="size-4" /> Confirmar agendamento
                  </button>
                </div>
              </div>
            </section>
          )}

          <aside className="space-y-4">
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-sm font-semibold">Talvez resolva agora</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {(sugestoes.length ? sugestoes : artigos.slice(0, 4)).map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => toast.info("Abrindo material", { description: a.arquivo })}
                      className="flex w-full items-start gap-2 text-left hover:text-primary"
                    >
                      <FileText className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="leading-snug">
                        {a.titulo}
                        <span className="block text-[11px] text-muted-foreground">
                          {a.formato} · {a.tamanhoKb} KB
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {artigos.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    Nenhum material publicado ainda.
                  </li>
                )}
              </ul>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-display text-sm font-semibold">Prazos de atendimento</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {classificacoes.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs">{c.nome}</span>
                    <Chip tone="blue">{c.slaRespostaHoras}h</Chip>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <LifeBuoy className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Acompanhamento dos chamados é enviado por e-mail e WhatsApp — este portal é público
                e não exibe histórico por segurança.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
