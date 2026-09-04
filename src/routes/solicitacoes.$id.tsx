// Workspace do Caso — contexto compartilhado de relacionamento, operação e auditoria.
// Um caso pode conter várias emissões, cada uma com ciclo próprio e independente.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  FileStack,
  MessageSquarePlus,
  Paperclip,
  ShieldAlert,

} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { NovoAgendamentoDialog } from "@/components/dialogs";
import { Btn, Field, Modal, SelectInput, TextArea } from "@/components/forms";
import { AvisoBloqueio, BotaoAcao, EstadoChip, LinhaDado, RegraObrigatoria } from "@/components/caso-kit";
import { Chip, Panel, SlaBadge } from "@/components/ui-kit";
import {
  acoesWorkspace,
  bloqueioAbsolutoDe,
  cabecalhoDe,
  dossieBloqueado,
  dossieDe,
  emissoesDoCaso,
  frentesDe,
  prontidaoCaso,
  rotuloEstado,
  type AcaoWorkspace,
  type DetalheProntidao,
  type EmissaoCaso,
} from "@/lib/caso-model";
import { cenarioDe } from "@/lib/cenarios";
import { agentById, agents, brl, requestById } from "@/lib/mock-data";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/solicitacoes/$id")({
  validateSearch: (search: Record<string, unknown>): { aba?: string } =>
    typeof search["aba"] === "string" ? { aba: search["aba"] } : {},
  loader: ({ params }) => {
    const r = requestById(params.id) ?? cenarioDe(params.id)?.request;
    return { protocolo: r?.protocolo ?? "Caso", cliente: r?.cliente ?? "" };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.protocolo} — Workspace do Caso` : "Workspace do Caso" },
      {
        name: "description",
        content:
          "Workspace do caso: prontidão por frente, emissões independentes, dossiê auditável e ações operacionais explícitas.",
      },
      { property: "og:title", content: loaderData ? `${loaderData.protocolo} — Workspace do Caso` : "Workspace do Caso" },
      { property: "og:description", content: "Prontidão, emissões, dossiê e trilha de auditoria do caso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});


const abas = [
  { id: "visao", label: "Visão geral" },
  { id: "emissoes", label: "Emissões" },
  { id: "atendimento", label: "Atendimento e agenda" },
  { id: "dossie", label: "Dossiê" },
  { id: "comercial", label: "Comercial" },
  { id: "mensagens", label: "Mensagens e documentos" },
  { id: "entrega", label: "Entrega e suporte" },
  { id: "historico", label: "Histórico" },
] as const;

type AbaId = (typeof abas)[number]["id"];

function Workspace() {
  const { id } = Route.useParams();
  const { aba: abaUrl } = Route.useSearch();
  const navigate = useNavigate();
  const store = useStore();
  const caso = store.requests.find((r) => r.id === id);
  const cliente = store.clients.find((c) => c.id === caso?.clienteId);
  const cenario = cenarioDe(id);

  const abaInicial = abas.some((a) => a.id === abaUrl) ? (abaUrl as AbaId) : "visao";
  const [aba, setAbaEstado] = useState<AbaId>(abaInicial);
  const [acao, setAcao] = useState<AcaoWorkspace | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState<string | null>(null);
  const [trilha, setTrilha] = useState<DetalheProntidao | null>(null);
  const [agendando, setAgendando] = useState(false);
  const [nota, setNota] = useState("");

  // Mantém a aba sincronizada com a URL para que links externos abram direto na
  // aba certa (Emissões, Dossiê…) e o botão voltar funcione.
  useEffect(() => {
    if (abaUrl && abas.some((a) => a.id === abaUrl) && abaUrl !== aba) setAbaEstado(abaUrl as AbaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaUrl]);

  function setAba(proxima: AbaId) {
    setAbaEstado(proxima);
    void navigate({ to: "/solicitacoes/$id", params: { id }, search: { aba: proxima }, replace: true });
  }

  const prontidao = useMemo(() => (caso ? prontidaoCaso(caso, cliente) : []), [caso, cliente]);
  const emissoes = useMemo(() => (caso ? emissoesDoCaso(caso) : []), [caso]);
  const dossie = useMemo(() => (caso ? dossieDe(caso, cliente) : null), [caso, cliente]);

  if (!caso || !dossie) {
    return (
      <AppShell title="Caso não encontrado" subtitle="O protocolo pode ter sido removido do protótipo">
        <Panel>
          <p className="text-sm text-muted-foreground">
            Não localizamos este caso.{" "}
            <Link to="/solicitacoes" className="text-primary hover:underline">
              Ver todos os casos
            </Link>
            .
          </p>
        </Panel>
      </AppShell>
    );
  }

  const cab = cabecalhoDe(caso);
  const frentes = frentesDe(caso);
  const travaDossie = dossieBloqueado(dossie);
  const bloqueioAbsoluto = bloqueioAbsolutoDe(caso);
  const pendentes = caso.checklist.filter((c) => !c.done);
  const proximaAcao =
    cenario?.proximaAcao && acoesWorkspace.some((a) => a.label === cenario.proximaAcao)
      ? cenario.proximaAcao
      : caso.stage === "concluido"
        ? "Confirmar funcionamento"
        : travaDossie
          ? "Abrir montagem de dossiê"
          : pendentes.length
            ? "Enviar para verificação"
            : "Registrar resultado da validação";
  const bloqueioAtual =
    bloqueioAbsoluto ?? cenario?.bloqueio ?? travaDossie ?? (pendentes[0]?.label ? `Pendência: ${pendentes[0].label}` : null);

  const agendamentos = store.appointments.filter((a) => a.clienteId === caso.clienteId);
  const chamados = store.tickets.filter((t) => t.clienteId === caso.clienteId);

  function bloqueioDaAcao(a: AcaoWorkspace): string | null {
    // Bloqueio de conformidade (ex.: fraude) não é superado por nenhuma
    // liberação comercial, emissão ou entrega.
    if (bloqueioAbsoluto && a.id !== "fraude" && a.grupo !== "Atendimento") return bloqueioAbsoluto;
    if (a.id === "enviar-verificacao" && travaDossie) return travaDossie;
    if (a.id === "resultado-validacao" && travaDossie) return "Dossiê incompleto — verifique os itens obrigatórios.";
    if (a.id === "emissao-manual") {
      const p = prontidao.find((x) => x.id === "emissao")!;
      if (p.estado === "bloqueado") return `Emissão bloqueada: ${p.falta.join(" · ")}`;
    }
    if ((a.id === "enviar-cliente" || a.id === "agendar-instalacao") && caso!.stage !== "concluido")
      return "Nenhuma emissão concluída para entregar.";
    if (a.id === "autorizar-revogacao" && !cliente?.certificados.some((c) => c.status === "ativo"))
      return "Não há certificado ativo para revogar.";
    return null;
  }


  function abrir(a: AcaoWorkspace) {
    setMotivo("");
    setErroMotivo(null);
    if (a.id === "agendar" || a.id === "reagendar") {
      setAgendando(true);
      return;
    }
    setAcao(a);
  }

  function executar() {
    const a = acao;
    if (!a) return;
    if (a.motivoObrigatorio && motivo.trim().length < 4) {
      setErroMotivo("Descreva o motivo com pelo menos 4 caracteres — ele fica registrado na auditoria.");
      document.getElementById("campo-motivo")?.focus();
      return;
    }
    setErroMotivo(null);
    const bloqueio = bloqueioDaAcao(a);
    if (bloqueio) {
      toast.error("Ação bloqueada", { description: bloqueio });
      return;
    }


    switch (a.id) {
      case "no-show":
        store.moveRequest(caso!.id, "agendamento", "No-show registrado");
        break;
      case "divergencia":
        store.moveRequest(caso!.id, "documentacao", motivo);
        break;
      case "abrir-dossie":
        store.moveRequest(caso!.id, "documentacao", "Montagem de dossiê aberta");
        break;
      case "enviar-verificacao":
        store.moveRequest(caso!.id, "validacao", "Dossiê enviado para verificação");
        break;
      case "resultado-validacao":
      case "aprovar-direto":
        store.moveRequest(caso!.id, "emissao", "Validação concluída");
        break;
      case "emissao-manual": {
        const cert = store.issueCertificate(caso!.id);
        if (cert) toast.success("Emissão registrada", { description: `Série ${cert.serie}` });
        break;
      }
      case "confirmar-funcionamento":
        store.moveRequest(caso!.id, "concluido", "Funcionamento confirmado pelo titular");
        break;
      case "autorizar-revogacao": {
        const cert = cliente?.certificados.find((c) => c.status === "ativo");
        if (cliente && cert) store.revokeCertificate(cliente.id, cert.id, motivo);
        break;
      }
      case "fraude":
        store.updateRequest(caso!.id, { responsavelId: "a5", prioridade: "critica" });
        store.moveRequest(caso!.id, "bloqueado", `Suspeita de fraude: ${motivo}`);
        break;
      default:
        break;
    }

    store.logRequest(
      caso!.id,
      a.label,
      `${a.evidencia}${motivo ? ` · Motivo: ${motivo}` : ""}`,
      a.destrutiva ? "alerta" : "humano",
    );
    toast.success(a.label, { description: `Próximo responsável: ${a.proximoResponsavel}` });
    setAcao(null);
    setMotivo("");
  }

  const grupos = [...new Set(acoesWorkspace.map((a) => a.grupo))];

  // Contadores nas abas: o usuário vê onde há trabalho antes de clicar.
  const contagens: Record<AbaId, number> = {
    visao: 0,
    emissoes: emissoes.length,
    atendimento: agendamentos.length,
    dossie: dossie.itens.filter((i) => i.status !== "aprovado").length,
    comercial: 0,
    mensagens: cliente?.documentos.length ?? 0,
    entrega: chamados.length,
    historico: caso.timeline.length,
  };

  return (
    <AppShell
      title={`Caso ${cab.numero}`}
      subtitle={`${cab.titular} · ${caso.tipo} · ${emissoes.length} emissão(ões) neste caso`}
      actions={
        <>
          <Link
            to="/solicitacoes"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Todos os casos
          </Link>
          <Btn variant="ghost" onClick={() => setAgendando(true)}>
            <CalendarClock className="size-3.5" /> Agendar atendimento
          </Btn>
          <Btn onClick={() => abrir(acoesWorkspace.find((a) => a.label === proximaAcao)!)}>
            {proximaAcao}
          </Btn>
        </>
      }
    >
      {/* -------------------------------------------------- cenário demonstrativo */}
      {cenario && (
        <section className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="blue">Cenário {cenario.titulo}</Chip>
            {cenario.visibilidadeRestrita && (
              <Chip tone="alert">
                <ShieldAlert className="size-3" aria-hidden="true" /> Visibilidade restrita — conformidade
              </Chip>
            )}
          </div>
          <p className="mt-2 text-sm text-foreground">{cenario.resumo}</p>
          {cenario.observar?.length ? (
            <ul className="mt-2 space-y-1">
              {cenario.observar.map((o) => (
                <li key={o} className="flex gap-1.5 text-xs text-muted-foreground">
                  <ChevronRight className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {cenario.evidencias?.length ? (
            <div className="mt-2 border-t border-border pt-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Evidências registradas
              </p>
              <ul className="mt-1 space-y-1">
                {cenario.evidencias.map((e) => (
                  <li key={e.id} className="text-xs text-foreground">
                    <span className="tabular text-muted-foreground">{e.quando}</span> · {e.por}: {e.texto}
                  </li>
                ))}

              </ul>
            </div>
          ) : null}
        </section>
      )}

      {/* ---------------------------------------------------------- cabeçalho */}
      <section className="rounded-lg border border-border bg-card">

        <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0">
          <LinhaDado rotulo="Caso">
            <span className="tabular font-medium">{cab.numero}</span>
          </LinhaDado>
          <LinhaDado rotulo="Titular / representante">{cab.titular}</LinhaDado>
          <LinhaDado rotulo="Organização">{cab.organizacao}</LinhaDado>
          <LinhaDado rotulo="Indicador / contabilidade">{cab.indicador}</LinhaDado>
          <LinhaDado rotulo="VD responsável">{cab.vd}</LinhaDado>
          <LinhaDado rotulo="VI responsável">{cab.vi}</LinhaDado>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
          <Chip tone={caso.prioridade === "critica" ? "alert" : caso.prioridade === "alta" ? "deep" : "outline"}>
            Prioridade {caso.prioridade}
          </Chip>
          <SlaBadge horas={caso.slaRestanteHoras} />
          <Chip tone="neutral">Aguardando cliente há {cab.aguardandoClienteHoras}h</Chip>
          <Chip tone="blue">{cab.estadoGeral}</Chip>
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            <ChevronRight className="size-3" /> Próxima ação permitida:{" "}
            <span className="font-medium text-foreground">{proximaAcao}</span>
          </span>
          {bloqueioAtual && <Chip tone="alert">Bloqueio: {bloqueioAtual}</Chip>}
        </div>
      </section>

      {/* -------------------------------------------------------- prontidão */}
      <Panel
        className="mt-4"
        title="Resumo de prontidão"
        hint="Clique em uma frente para ver o que falta, quem age e qual regra bloqueia"
        bodyClassName="p-0"
      >
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {prontidao.map((p) => (
            <button
              key={p.id}
              onClick={() => setTrilha(p)}
              className="bg-card px-3 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{p.nome}</span>
                <EstadoChip estado={p.estado} />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {p.falta[0] ?? p.concluido[0] ?? "Sem pendências"}
              </p>
            </button>
          ))}
        </div>
      </Panel>

      {/* ------------------------------------------------------------- abas */}
      <div
        role="tablist"
        aria-label="Seções do caso"
        className="sticky top-14 z-20 mt-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        {abas.map((a, i) => (
          <button
            key={a.id}
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls="painel-caso"
            tabIndex={aba === a.id ? 0 : -1}
            onKeyDown={(e) => {
              const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!delta) return;
              e.preventDefault();
              const proxima = abas[(i + delta + abas.length) % abas.length]!;
              setAba(proxima.id);
              document.getElementById(`aba-${proxima.id}`)?.focus();
            }}
            onClick={() => setAba(a.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              aba === a.id
                ? "bg-primary-soft font-medium text-primary-deep"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {a.label}
            {contagens[a.id] ? (
              <span
                className={cn(
                  "tabular rounded px-1 text-[10px] font-semibold",
                  aba === a.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {contagens[a.id]}
              </span>
            ) : null}
          </button>
        ))}
      </div>


      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div id="painel-caso" role="tabpanel" aria-labelledby={`aba-${aba}`} className="space-y-4">

          {aba === "visao" && (
            <>
              <Panel title="Frentes de trabalho" hint="Quem está com a bola em cada frente" bodyClassName="p-0">
                <div className="grid gap-px bg-border sm:grid-cols-2">
                  {frentes.map((f) => (
                    <div key={f.id} className="bg-card px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{f.nome}</p>
                        <EstadoChip estado={f.estado} />
                      </div>
                      <p className="text-xs text-muted-foreground">{f.papel}</p>
                      <p className="mt-1.5 text-xs">{f.resumo}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Próxima: {f.proxima}</p>
                    </div>
                  ))}
                </div>
              </Panel>
              <EmissoesPanel emissoes={emissoes} resumido />
              <Panel title="Requisitos da etapa atual" hint={`${pendentes.length} pendência(s)`}>
                <ul className="space-y-1">
                  {caso.checklist.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => store.toggleChecklist(caso.id, c.id)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <EstadoChip estado={c.done ? "concluido" : "pendente"} label={c.done ? "OK" : "Falta"} />
                        <span className={cn(c.done && "text-muted-foreground line-through")}>{c.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {aba === "emissoes" && <EmissoesPanel emissoes={emissoes} />}

          {aba === "atendimento" && (
            <>
              <Panel
                title="Agendamentos do caso"
                hint="Videoconferência, identificação e suporte"
                bodyClassName="p-0"
                actions={
                  <Btn variant="ghost" onClick={() => setAgendando(true)}>
                    <CalendarClock className="size-3.5" /> Novo agendamento
                  </Btn>
                }
              >
                <ul className="divide-y divide-border text-sm">
                  {agendamentos.length === 0 && (
                    <li className="px-4 py-3 text-xs text-muted-foreground">Nenhum agendamento para este titular.</li>
                  )}
                  {agendamentos.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <span className="tabular">
                        {a.dia} · {a.hora} · {a.duracaoMin}min
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {agentById(a.agenteId).nome} · {a.sala}
                      </span>
                      <Chip tone={a.status === "no-show" ? "alert" : a.status === "confirmado" ? "blue" : "outline"}>
                        {a.status}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Chamados relacionados" bodyClassName="p-0">
                <ul className="divide-y divide-border text-sm">
                  {chamados.length === 0 && (
                    <li className="px-4 py-3 text-xs text-muted-foreground">Sem chamados abertos.</li>
                  )}
                  {chamados.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <Link to="/chamados/$id" params={{ id: t.id }} className="min-w-0 truncate text-primary hover:underline">
                        {t.numero} · {t.assunto}
                      </Link>
                      <Chip tone="outline">{t.status}</Chip>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {aba === "dossie" && (
            <>
              <Panel
                title="Dossiê do caso"
                hint={`${dossie.produto} · ${dossie.motivo}`}
                actions={
                  <Btn
                    variant="ghost"
                    onClick={() => abrir(acoesWorkspace.find((a) => a.id === "enviar-verificacao")!)}
                  >
                    <FileStack className="size-3.5" /> Enviar para verificação
                  </Btn>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Montadora</p>
                    <p className="text-sm">{dossie.montadora}</p>
                  </div>
                  <div className="rounded-md border border-border px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Verificadora</p>
                    <p className="text-sm">{dossie.verificadora}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <RegraObrigatoria texto="A pessoa que verifica o dossiê deve ser diferente de quem realizou a identificação ou a montagem." />
                  {!dossie.segregacaoOk && (
                    <AvisoBloqueio texto="Montadora e verificadora são a mesma pessoa — troque a verificadora para liberar a conferência." />
                  )}
                  {travaDossie && <AvisoBloqueio texto={travaDossie} />}
                </div>
              </Panel>

              <Panel title="Itens do checklist documental" bodyClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium">Obrigatório</th>
                        <th className="px-3 py-2 font-medium">Versão</th>
                        <th className="px-3 py-2 font-medium">Origem</th>
                        <th className="px-3 py-2 font-medium">Conferência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dossie.itens.map((i) => (
                        <tr key={i.id}>
                          <td className="px-3 py-2">
                            {i.nome}
                            {i.divergencia && <p className="text-[11px] text-alert">{i.divergencia}</p>}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{i.obrigatorio ? "Sim" : "Opcional"}</td>
                          <td className="px-3 py-2 tabular text-xs">v{i.versao}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{i.origem}</td>
                          <td className="px-3 py-2">
                            <EstadoChip
                              estado={
                                i.status === "aprovado"
                                  ? "concluido"
                                  : i.status === "divergente"
                                    ? "bloqueado"
                                    : i.status === "ausente"
                                      ? "pendente"
                                      : "pronto"
                              }
                              label={i.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Histórico de devoluções" bodyClassName="p-0">
                <ul className="divide-y divide-border text-sm">
                  {dossie.devolucoes.length === 0 && (
                    <li className="px-4 py-3 text-xs text-muted-foreground">Nenhuma devolução registrada.</li>
                  )}
                  {dossie.devolucoes.map((d) => (
                    <li key={d.id} className="px-4 py-2.5">
                      <p>{d.motivo}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.por} · {d.quando}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {aba === "comercial" && (
            <>
              <Panel title="Condições comerciais por emissão" bodyClassName="p-0">
                <ul className="divide-y divide-border text-sm">
                  {emissoes.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <span className="min-w-0">
                        <span className="font-medium">{e.produto}</span>
                        <span className="block text-[11px] text-muted-foreground">{e.condicaoComercial}</span>
                      </span>
                      <span className="tabular">{brl(e.valor)}</span>
                      <EstadoChip estado={e.pagamento.estado} label={e.pagamento.detalhe} />
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Faturas do titular" bodyClassName="p-0">
                <ul className="divide-y divide-border text-sm">
                  {(cliente?.faturas ?? []).length === 0 && (
                    <li className="px-4 py-3 text-xs text-muted-foreground">Sem faturas.</li>
                  )}
                  {cliente?.faturas.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <span className="min-w-0 truncate">{f.descricao}</span>
                      <span className="tabular">{brl(f.valor)}</span>
                      <Chip tone={f.status === "vencido" ? "alert" : f.status === "pago" ? "blue" : "outline"}>
                        {f.status}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {aba === "mensagens" && (
            <>
              <Panel title="Documentos do titular" bodyClassName="p-0" hint="Versões e status de análise">
                <ul className="divide-y divide-border text-sm">
                  {(cliente?.documentos ?? []).length === 0 && (
                    <li className="px-4 py-3 text-xs text-muted-foreground">Nenhum documento enviado.</li>
                  )}
                  {cliente?.documentos.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <span className="flex min-w-0 items-center gap-2">
                        <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{d.nome}</span>
                      </span>
                      <Chip tone={d.status === "aprovado" ? "blue" : d.status === "reprovado" ? "alert" : "outline"}>
                        {d.status}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel
                title="Registrar nota interna"
                hint="Fica na trilha de auditoria do caso"
                actions={
                  <Btn
                    variant="ghost"
                    disabled={nota.trim().length < 3}
                    onClick={() => {
                      store.logRequest(caso.id, "Nota interna", nota);
                      setNota("");
                      toast.success("Nota registrada");
                    }}
                  >
                    <MessageSquarePlus className="size-3.5" /> Registrar
                  </Btn>
                }
              >
                <TextArea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Contexto, combinado com o cliente, orientação para a próxima frente…" />
              </Panel>
            </>
          )}

          {aba === "entrega" && (
            <Panel title="Entrega e suporte" hint="Uma emissão só é entregue pelo próprio ciclo" bodyClassName="p-0">
              <ul className="divide-y divide-border text-sm">
                {emissoes.map((e) => (
                  <li key={e.id} className="space-y-1.5 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{e.produto}</span>
                      <span className="flex flex-wrap gap-1.5">
                        <EstadoChip estado={e.emissao} label={`Emissão: ${rotuloEstado[e.emissao]}`} />
                        <EstadoChip estado={e.entrega} label={`Entrega: ${rotuloEstado[e.entrega]}`} />
                        <EstadoChip estado={e.instalacao} label={`Instalação: ${rotuloEstado[e.instalacao]}`} />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {e.ac} · {e.modalidade}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {aba === "historico" && (
            <Panel title="Histórico auditável" hint="Quem fez, quando e com qual evidência" bodyClassName="p-0">
              <ol className="space-y-0">
                {caso.timeline.map((e, i) => (
                  <li key={e.id} className="flex gap-3 px-4 py-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "mt-1 size-2.5 rounded-full",
                          e.tipo === "alerta" ? "bg-alert" : e.tipo === "cliente" ? "bg-primary-soft" : "bg-primary",
                        )}
                      />
                      {i < caso.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-sm font-medium">{e.titulo}</p>
                      {e.detalhe && <p className="text-xs text-muted-foreground">{e.detalhe}</p>}
                      <p className="mt-0.5 text-[11px] tabular text-muted-foreground">
                        {e.autor} · {e.quando}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>

        {/* -------------------------------------------------------- coluna direita */}
        <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
          <Panel title="Responsável atual">
            <div className="space-y-2.5 text-sm">
              <SelectInput
                value={caso.responsavelId}
                onChange={(e) => {
                  store.updateRequest(caso.id, { responsavelId: e.target.value });
                  store.logRequest(caso.id, `Responsável alterado para ${agentById(e.target.value).nome}`);
                  toast.success("Responsável atualizado");
                }}
                className="py-1.5 text-xs"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                value={caso.prioridade}
                onChange={(e) => {
                  store.updateRequest(caso.id, { prioridade: e.target.value as typeof caso.prioridade });
                  toast.success("Prioridade atualizada");
                }}
                className="py-1.5 text-xs"
              >
                {["baixa", "normal", "alta", "critica"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </SelectInput>
              <p className="text-xs text-muted-foreground">Unidade: {cab.unidade}</p>
            </div>
          </Panel>

          <Panel title="Ações do caso" hint="Toda ação registra evidência e define o próximo responsável" bodyClassName="p-3">
            <div className="space-y-3">
              {(() => {
                const recomendada = acoesWorkspace.find((a) => a.label === proximaAcao);
                if (!recomendada) return null;
                const trava = bloqueioDaAcao(recomendada);
                return (
                  <div className="rounded-md border border-primary/40 bg-primary-soft/40 p-2">
                    <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-deep">
                      Recomendado agora
                    </p>
                    <BotaoAcao
                      label={recomendada.label}
                      onClick={() => abrir(recomendada)}
                      bloqueio={trava}
                      {...(recomendada.regulatoria ? { regulatoria: true } : {})}
                    />
                    <p className="mt-1.5 px-0.5 text-[11px] text-muted-foreground">
                      {trava ?? `Próximo responsável: ${recomendada.proximoResponsavel}`}
                    </p>
                  </div>
                );
              })()}
              {grupos.map((g) => (
                <div key={g} className="space-y-1.5">
                  <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
                  {acoesWorkspace
                    .filter((a) => a.grupo === g)
                    .map((a) => (
                      <BotaoAcao
                        key={a.id}
                        label={a.label}
                        onClick={() => abrir(a)}
                        bloqueio={bloqueioDaAcao(a)}
                        {...(a.regulatoria ? { regulatoria: true } : {})}
                        {...(a.destrutiva ? { destrutiva: true } : {})}
                      />
                    ))}
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      {/* ------------------------------------------------------------ dialogs */}
      <Modal
        open={!!trilha}
        onClose={() => setTrilha(null)}
        title={trilha?.nome ?? ""}
        {...(trilha ? { hint: `Estado: ${rotuloEstado[trilha.estado]}` } : {})}
        width="max-w-lg"
        footer={
          <Btn variant="ghost" onClick={() => setTrilha(null)}>
            Fechar
          </Btn>
        }
      >
        {trilha && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Já concluído</p>
              <ul className="mt-1 space-y-1">
                {trilha.concluido.length === 0 && <li className="text-xs text-muted-foreground">Nada concluído ainda.</li>}
                {trilha.concluido.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <EstadoChip estado="concluido" label="OK" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">O que falta</p>
              <ul className="mt-1 space-y-1">
                {trilha.falta.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma pendência.</li>}
                {trilha.falta.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <EstadoChip estado="pendente" label="Falta" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Quem precisa agir</p>
                <p className="text-sm">{trilha.quemAge}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ação bloqueada</p>
                <p className="text-sm">{trilha.acaoBloqueada}</p>
              </div>
            </div>
            {trilha.regraObrigatoria ? (
              <RegraObrigatoria texto={trilha.regra} />
            ) : (
              <p className="text-xs text-muted-foreground">Regra aplicada: {trilha.regra}</p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!acao}
        onClose={() => setAcao(null)}
        title={acao?.label ?? ""}
        {...(acao ? { hint: acao.oQueAcontece } : {})}
        width="max-w-lg"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setAcao(null)}>
              Cancelar
            </Btn>
            <Btn variant={acao?.destrutiva ? "danger" : "primary"} onClick={executar}>
              Confirmar
            </Btn>
          </>
        }
      >
        {acao && (
          <div className="space-y-3 text-sm">
            {bloqueioDaAcao(acao) && <AvisoBloqueio texto={bloqueioDaAcao(acao)!} />}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Evidência registrada</p>
                <p>{acao.evidencia}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Próximo responsável</p>
                <p>{acao.proximoResponsavel}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ficam disponíveis</p>
                <ul className="mt-1 space-y-1">
                  {acao.liberadas.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma nova ação.</li>}
                  {acao.liberadas.map((l) => (
                    <li key={l} className="text-xs">
                      • {l}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ficam bloqueadas</p>
                <ul className="mt-1 space-y-1">
                  {acao.bloqueadas.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma.</li>}
                  {acao.bloqueadas.map((l) => (
                    <li key={l} className="text-xs">
                      • {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {acao.regulatoria && (
              <RegraObrigatoria texto="Regra regulatória aplicada automaticamente pelo fluxo da AR — não editável nesta tela." />
            )}
            {acao.motivoObrigatorio && (
              <Field label="Motivo (obrigatório)" {...(erroMotivo ? { error: erroMotivo } : {})}>
                <TextArea
                  id="campo-motivo"
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    if (erroMotivo) setErroMotivo(null);
                  }}
                  placeholder="Descreva o motivo que será registrado na auditoria"
                />
              </Field>

            )}
          </div>
        )}
      </Modal>

      <NovoAgendamentoDialog
        open={agendando}
        onClose={() => setAgendando(false)}
        clienteId={caso.clienteId}
        onCriado={() => {
          store.moveRequest(caso.id, "agendamento", "Atendimento agendado");
          navigate({ to: "/agenda" });
        }}
      />
    </AppShell>
  );
}

function EmissoesPanel({ emissoes, resumido }: { emissoes: EmissaoCaso[]; resumido?: boolean }) {
  return (
    <Panel
      title="Emissões deste caso"
      hint="Cada emissão tem ciclo próprio — pagamento, documento ou validação de uma nunca libera outra"
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-border">
        {emissoes.map((e) => (
          <li key={e.id} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {e.produto}
                  {e.principal && <Chip className="ml-2" tone="blue">Principal</Chip>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.papelTitular}: {e.titular} · {e.ac} · {e.modalidade}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular text-sm">{brl(e.valor)}</p>
                <p className="text-[11px] text-muted-foreground">{e.condicaoComercial}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <EstadoChip estado={e.pagamento.estado} label={`Pagamento: ${e.pagamento.detalhe}`} />
              <EstadoChip estado={e.validacao} label={`Validação: ${rotuloEstado[e.validacao]}`} />
              <EstadoChip estado={e.dossie} label={`Dossiê: ${rotuloEstado[e.dossie]}`} />
              <EstadoChip estado={e.emissao} label={`Emissão: ${rotuloEstado[e.emissao]}`} />
              {!resumido && (
                <>
                  <EstadoChip estado={e.entrega} label={`Entrega: ${rotuloEstado[e.entrega]}`} />
                  <EstadoChip estado={e.instalacao} label={`Instalação: ${rotuloEstado[e.instalacao]}`} />
                  <EstadoChip estado={e.revogacao.estado} label={`Revogação: ${e.revogacao.detalhe}`} />
                </>
              )}
            </div>
            {e.bloqueio && <AvisoBloqueio texto={e.bloqueio} />}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
