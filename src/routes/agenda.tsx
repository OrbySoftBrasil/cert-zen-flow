import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck2, CalendarX2, Clock3, Video } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { agents, appointments as seed, type Appointment } from "@/lib/mock-data";

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

function Agenda() {
  const [items, setItems] = useState<Appointment[]>(seed);
  const dias = Array.from(new Set(items.map((a) => a.dia))).sort();
  const [dia, setDia] = useState(dias[0]!);
  const doDia = items.filter((a) => a.dia === dia);
  const agentesAtivos = agents.slice(0, 3);

  function atualizar(id: string, status: Appointment["status"]) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <AppShell
      title="Agenda operacional"
      subtitle="Videoconferências de validação presencial remota"
      actions={
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {dias.map((d, i) => (
            <button
              key={d}
              onClick={() => setDia(d)}
              className={cn(
                "rounded px-2.5 py-1 text-xs tabular transition-colors",
                dia === d ? "bg-primary-soft text-primary-deep" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {i === 0 ? "Hoje" : i === 1 ? "Amanhã" : d.slice(8) + "/" + d.slice(5, 7)}
            </button>
          ))}
        </div>
      }
    >
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
              {doDia.map((a) => (
                <li key={a.id} className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular text-sm font-semibold">{a.hora}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{a.cliente}</span>
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
                      onClick={() => atualizar(a.id, "remarcado")}
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
    </AppShell>
  );
}
