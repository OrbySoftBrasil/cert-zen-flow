import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck2, CalendarX2, ChevronLeft, ChevronRight, Clock3, Video } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { agents, type Appointment } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { NovoAgendamentoButton } from "@/components/dialogs";
import { Btn, ConfirmDialog, EmptyState, Field, TextInput } from "@/components/forms";
import { toast } from "sonner";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda operacional — Certus AC" },
      {
        name: "description",
        content:
          "Agenda de videoconferências de validação: disponibilidade por agente, confirmações, remarcações e controle de no-show.",
      },
      { property: "og:title", content: "Agenda operacional — Certus AC" },
      { property: "og:description", content: "Disponibilidade, confirmações e no-show por agente." },
    ],
  }),
  component: Agenda,
});

const horas = ["08:00", "09:00", "10:00", "11:30", "13:30", "14:00", "15:00", "16:00", "17:00"];
const statusTone = {
  confirmado: "blue",
  pendente: "neutral",
  "no-show": "alert",
  concluido: "outline",
  remarcado: "outline",
} as const;

const hojeISO = new Date().toISOString().slice(0, 10);
const nomesMes = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const nomesDiaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function gradeDoMes(ano: number, mes: number) {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(primeiro);
  inicio.setDate(1 - primeiro.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

function Agenda() {
  const { appointments: items, updateAppointment } = useStore();
  const [remarcando, setRemarcando] = useState<Appointment | null>(null);
  const [novoDia, setNovoDia] = useState("");
  const [novaHora, setNovaHora] = useState("");
  const dias = Array.from(new Set(items.map((a) => a.dia))).sort();
  const proximos = dias.filter((d) => d >= hojeISO);
  const [dia, setDia] = useState(proximos[0] ?? dias[0]!);
  const [vista, setVista] = useState<"dia" | "mes">("dia");
  const hoje = new Date();
  const [cursor, setCursor] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const doDia = items.filter((a) => a.dia === dia);
  const agentesAtivos = agents.slice(0, 3);
  const celulas = gradeDoMes(cursor.ano, cursor.mes);
  const doMes = items.filter((a) => {
    const [ano, mes] = a.dia.split("-").map(Number);
    return ano === cursor.ano && mes === cursor.mes + 1;
  });

  function atualizar(id: string, status: Appointment["status"]) {
    updateAppointment(id, { status });
    toast.success(`Atendimento marcado como ${status}`);
  }

  function confirmarRemarcacao() {
    if (!remarcando || !novoDia || !novaHora) {
      toast.error("Informe a nova data e horário.");
      return;
    }
    updateAppointment(remarcando.id, { dia: novoDia, hora: novaHora, status: "remarcado" });
    toast.success("Atendimento remarcado", { description: `${remarcando.cliente} · ${novoDia} às ${novaHora}` });
    setRemarcando(null);
  }

  function moverMes(delta: number) {
    setCursor((c) => {
      const d = new Date(c.ano, c.mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  }

  return (
    <AppShell
      title="Agenda operacional"
      subtitle="Videoconferências de validação presencial remota"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <NovoAgendamentoButton diaInicial={dia} />
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {(["dia", "mes"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs transition-colors",
                  vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "dia" ? "Dia" : "Mês"}
              </button>
            ))}
          </div>
          {vista === "dia" ? (
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              {proximos.slice(0, 5).map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDia(d)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs tabular transition-colors",
                    dia === d ? "bg-primary-soft text-primary-deep" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d === hojeISO ? "Hoje" : i === 0 ? d.slice(8) + "/" + d.slice(5, 7) : d.slice(8) + "/" + d.slice(5, 7)}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <button
                onClick={() => moverMes(-1)}
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-32 text-center text-xs font-medium">
                {nomesMes[cursor.mes]} {cursor.ano}
              </span>
              <button
                onClick={() => moverMes(1)}
                className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      }
    >
      {vista === "dia" && (
      <>
      <div className="mb-4 flex flex-wrap divide-border rounded-lg border border-border bg-card">
        <Metric label="Agendamentos do dia" value={String(doDia.length)} />
        <Metric label="Confirmados" value={String(doDia.filter((a) => a.status === "confirmado").length)} />
        <Metric label="Pendentes" value={String(doDia.filter((a) => a.status === "pendente").length)} />
        <Metric label="No-show" value={String(doDia.filter((a) => a.status === "no-show").length)} hint="hoje" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

        <Panel title="Grade por agente" hint={`Dia ${dia}`} bodyClassName="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-20 px-3 py-2 font-medium">Hora</th>
                {agentesAtivos.map((a) => (
                  <th key={a.id} className="px-3 py-2 font-medium">
                    {a.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {horas.map((h) => (
                <tr key={h}>
                  <td className="px-3 py-2 tabular text-xs text-muted-foreground">{h}</td>
                  {agentesAtivos.map((a) => {
                    const slot = doDia.find((x) => x.hora === h && x.agenteId === a.id);
                    return (
                      <td key={a.id} className="px-2 py-1.5 align-top">
                        {slot ? (
                          <div
                            className={cn(
                              "rounded-md border p-2",
                              slot.status === "no-show"
                                ? "border-alert/40 bg-alert-soft"
                                : slot.status === "confirmado"
                                  ? "border-primary/40 bg-primary-soft"
                                  : "border-border bg-muted/60",
                            )}
                          >
                            <p className="truncate text-xs font-medium">{slot.cliente}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {slot.tipo} · {slot.duracaoMin} min
                            </p>
                            <div className="mt-1 flex items-center gap-1">
                              <Chip tone={statusTone[slot.status]}>{slot.status}</Chip>
                            </div>
                          </div>
                        ) : (
                          <div className="h-10 rounded-md border border-dashed border-border" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel title="Próximos atendimentos" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {doDia.length === 0 && (
                <li>
                  <EmptyState
                    titulo="Nenhum atendimento neste dia"
                    descricao="Agende uma videoconferência de validação para preencher a grade."
                  />
                </li>
              )}
              {doDia.map((a) => (
                <li key={a.id} className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular text-sm font-semibold">{a.hora}</span>
                    <Link
                      to="/clientes/$id"
                      params={{ id: a.clienteId }}
                      className="min-w-0 flex-1 truncate text-sm hover:text-primary hover:underline"
                    >
                      {a.cliente}
                    </Link>
                    <Chip tone={statusTone[a.status]}>{a.status}</Chip>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Video className="size-3" /> {a.sala}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => atualizar(a.id, "confirmado")}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] transition-colors hover:border-primary"
                    >
                      <CalendarCheck2 className="size-3" /> Confirmar
                    </button>
                    <button
                      onClick={() => {
                        setRemarcando(a);
                        setNovoDia(a.dia);
                        setNovaHora(a.hora);
                      }}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] transition-colors hover:border-primary"
                    >
                      <Clock3 className="size-3" /> Remarcar
                    </button>
                    <button
                      onClick={() => atualizar(a.id, "no-show")}
                      className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-alert transition-colors hover:border-alert"
                    >
                      <CalendarX2 className="size-3" /> No-show
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Disponibilidade" hint="Capacidade declarada por agente">
            <ul className="space-y-2.5 text-sm">
              {agentesAtivos.map((a) => {
                const ocupados = doDia.filter((x) => x.agenteId === a.id).length;
                return (
                  <li key={a.id}>
                    <div className="flex justify-between">
                      <span>{a.nome}</span>
                      <span className="tabular text-muted-foreground">{ocupados}/6 slots</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${(ocupados / 6) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
      </>
      )}


      {vista === "mes" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Panel
            title={`${nomesMes[cursor.mes]} ${cursor.ano}`}
            hint={`${doMes.length} agendamentos no mês`}
            bodyClassName="p-3"
            actions={
              <div className="flex rounded-md border border-border p-0.5">
                {([
                  ["resumo", "Resumo"],
                  ["completo", "Mostrar todos"],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setDensidadeMes(v)}
                    className={cn(
                      "rounded px-2 py-1 text-[11px] transition-colors",
                      densidadeMes === v
                        ? "bg-primary-soft font-medium text-primary-deep"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1.5">
              {nomesDiaSemana.map((d) => (
                <div key={d} className="pb-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
              {celulas.map((d) => {
                const chave = iso(d);
                const doDiaCel = items.filter((a) => a.dia === chave);
                const foraDoMes = d.getMonth() !== cursor.mes;
                const ehHoje = chave === hojeISO;
                const noShow = doDiaCel.some((a) => a.status === "no-show");
                return (
                  <button
                    key={chave}
                    onClick={() => {
                      setDia(chave);
                      setVista("dia");
                    }}
                    className={cn(
                      "flex min-h-24 flex-col rounded-md border p-1.5 text-left transition-colors hover:border-primary",
                      foraDoMes ? "border-border/60 bg-muted/30 opacity-60" : "border-border bg-card",
                      chave === dia && "border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "tabular mb-1 grid size-5 place-items-center rounded-full text-[11px]",
                        ehHoje ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    <span className="flex-1 space-y-0.5">
                      {doDiaCel.slice(0, 2).map((a) => (
                        <span
                          key={a.id}
                          className={cn(
                            "block truncate rounded px-1 py-0.5 text-[10px]",
                            a.status === "no-show"
                              ? "bg-alert-soft text-alert"
                              : a.status === "confirmado"
                                ? "bg-primary-soft text-primary-deep"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {a.hora} {a.cliente}
                        </span>
                      ))}
                      {doDiaCel.length > 2 && (
                        <span className="block px-1 text-[10px] text-muted-foreground">
                          +{doDiaCel.length - 2} agendamentos
                        </span>
                      )}
                    </span>
                    {noShow && <span className="mt-0.5 h-0.5 w-full rounded bg-alert" />}
                  </button>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title="Resumo do mês">
              <ul className="space-y-2 text-sm">
                {(["confirmado", "pendente", "concluido", "remarcado", "no-show"] as const).map((s) => (
                  <li key={s} className="flex items-center justify-between">
                    <Chip tone={statusTone[s]}>{s}</Chip>
                    <span className="tabular text-muted-foreground">{doMes.filter((a) => a.status === s).length}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                Taxa de no-show do mês:{" "}
                <span className="tabular font-medium text-alert">
                  {doMes.length ? Math.round((doMes.filter((a) => a.status === "no-show").length / doMes.length) * 100) : 0}%
                </span>
              </p>
            </Panel>

            <Panel title="Carga por agente no mês">
              <ul className="space-y-2.5 text-sm">
                {agentesAtivos.map((a) => {
                  const total = doMes.filter((x) => x.agenteId === a.id).length;
                  const maior = Math.max(1, ...agentesAtivos.map((g) => doMes.filter((x) => x.agenteId === g.id).length));
                  return (
                    <li key={a.id}>
                      <div className="flex justify-between">
                        <span>{a.nome}</span>
                        <span className="tabular text-muted-foreground">{total} sessões</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${(total / maior) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="Dias mais carregados">
              <ul className="space-y-1.5 text-sm">
                {Object.entries(
                  doMes.reduce<Record<string, number>>((acc, a) => {
                    acc[a.dia] = (acc[a.dia] ?? 0) + 1;
                    return acc;
                  }, {}),
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([d, qtd]) => (
                    <li key={d} className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setDia(d);
                          setVista("dia");
                        }}
                        className="tabular text-primary hover:underline"
                      >
                        {d.slice(8)}/{d.slice(5, 7)}
                      </button>
                      <span className="tabular text-muted-foreground">{qtd} agendamentos</span>
                    </li>
                  ))}
              </ul>
            </Panel>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!remarcando}
        title="Remarcar atendimento"
        {...(remarcando ? { descricao: `${remarcando.cliente} · ${remarcando.tipo}` } : {})}
        confirmLabel="Remarcar"
        onCancel={() => setRemarcando(null)}
        onConfirm={confirmarRemarcacao}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nova data">
            <TextInput type="date" value={novoDia} onChange={(e) => setNovoDia(e.target.value)} />
          </Field>
          <Field label="Novo horário">
            <TextInput type="time" value={novaHora} onChange={(e) => setNovaHora(e.target.value)} />
          </Field>
        </div>
      </ConfirmDialog>
    </AppShell>

  );
}
