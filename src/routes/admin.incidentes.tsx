import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { Field, KpiCard, inputCls } from "@/components/admin-kit";
import { Chip, Panel } from "@/components/ui-kit";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { servicos, type Incidente } from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/incidentes")({
  head: () => ({
    meta: [
      { title: "Incidentes e uptime — status da plataforma | Admin Center" },
      { name: "description", content: "Registro de incidentes por severidade, timeline de mitigação, tenants afetados, MTTR e histórico de uptime da plataforma." },
      { property: "og:title", content: "Incidentes e uptime — Admin Center" },
      { property: "og:description", content: "Severidade, timeline, MTTR e histórico de uptime da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IncidentesPage,
});

const DIAS = Array.from({ length: 60 }, (_, i) => {
  if (i === 41) return "ruim";
  if (i === 47 || i === 58) return "parcial";
  return "ok";
});

function IncidentesPage() {
  const { incidentes, addIncidente, updateIncidente } = useAdmin();
  const [novo, setNovo] = useState(false);
  const [aberto, setAberto] = useState<string | null>(incidentes[0]?.id ?? null);

  const emAberto = incidentes.filter((i) => i.status !== "resolvido");
  const mttr = Math.round(incidentes.reduce((s, i) => s + i.duracaoMin, 0) / Math.max(incidentes.length, 1));

  return (
    <AdminShell
      title="Incidentes & uptime"
      subtitle="Registro operacional, status page interna e histórico de disponibilidade"
      actions={
        <>
          <ExportMenu
            base="admin-incidentes"
            datasets={() => [
              { nome: "Incidentes", linhas: incidentes.map((i) => ({ ID: i.id, Título: i.titulo, Severidade: i.severidade, Status: i.status, Serviço: i.servico, "Aberto em": i.abertoEm, "Duração (min)": i.duracaoMin, "Tenants afetados": i.tenantsAfetados, Responsável: i.responsavel })) },
              { nome: "Uptime por serviço", linhas: servicos.map((s) => ({ Serviço: s.nome, "Uptime 30d": s.uptime30d, Status: s.status })) },
            ]}
          />
          <button onClick={() => setNovo(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> Registrar incidente
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Incidentes em aberto" value={String(emAberto.length)} tone={emAberto.length ? "alert" : "default"} icon={<ShieldAlert className="size-4" />} hint={emAberto.map((i) => i.severidade).join(", ") || "tudo estável"} />
        <KpiCard label="MTTR" value={`${mttr} min`} hint="tempo médio de resolução" />
        <KpiCard label="Uptime 90d" value="99,94%" hint="SLA contratado 99,9%" />
        <KpiCard label="SEV1 no trimestre" value={String(incidentes.filter((i) => i.severidade === "SEV1").length)} hint="meta: máximo 1 por trimestre" />
      </div>

      <Panel className="mt-4" title="Histórico de disponibilidade" hint="Últimos 60 dias · verde = sem incidentes">
        <div className="flex flex-wrap gap-1">
          {DIAS.map((d, i) => (
            <span
              key={i}
              title={`Dia ${i + 1}: ${d === "ok" ? "operacional" : d === "parcial" ? "degradado" : "incidente"}`}
              className={`h-7 w-2 rounded-sm ${d === "ok" ? "bg-primary/70" : d === "parcial" ? "bg-alert/60" : "bg-alert"}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>60 dias atrás</span><span>hoje</span>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Incidentes registrados" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {incidentes.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => setAberto(i.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 ${aberto === i.id ? "bg-muted/60" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-sm">{i.titulo}</span>
                    <span className="flex items-center gap-1.5">
                      <Chip tone={i.severidade === "SEV1" ? "alert" : i.severidade === "SEV2" ? "blue" : "neutral"}>{i.severidade}</Chip>
                      <Chip tone={i.status === "resolvido" ? "neutral" : "alert"}>{i.status}</Chip>
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {i.servico} · {i.abertoEm} · {i.duracaoMin} min · {i.tenantsAfetados} tenants · {i.responsavel}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Detalhe do incidente">
          {(() => {
            const i = incidentes.find((x) => x.id === aberto);
            if (!i) return <p className="text-sm text-muted-foreground">Selecione um incidente.</p>;
            return (
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-base font-semibold">{i.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{i.resumo}</p>
                </div>
                <ol className="space-y-2 border-l border-border pl-4 text-sm">
                  {i.timeline.map((t, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                      <span className="tabular text-xs text-muted-foreground">{t.quando}</span>
                      <p>{t.texto}</p>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap gap-2">
                  {(["aberto", "mitigado", "resolvido"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        updateIncidente(i.id, { status: s });
                        toast.success(`Incidente marcado como ${s}.`);
                      }}
                      className={`h-8 rounded-md px-2.5 text-xs ${i.status === s ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary"}`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => toast.success("Post-mortem gerado e compartilhado com o time.")}
                    className="h-8 rounded-md border border-border px-2.5 text-xs hover:border-primary"
                  >
                    Gerar post-mortem
                  </button>
                </div>
              </div>
            );
          })()}
        </Panel>
      </div>

      <NovoIncidente open={novo} onOpenChange={setNovo} onCriar={addIncidente} />
    </AdminShell>
  );
}

function NovoIncidente({
  open,
  onOpenChange,
  onCriar,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCriar: (i: Omit<Incidente, "id">) => void;
}) {
  const [f, setF] = useState({ titulo: "", severidade: "SEV2" as Incidente["severidade"], servico: servicos[0]!.nome, resumo: "", tenants: 1, responsavel: "Plantão SRE" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Registrar incidente</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título"><input className={inputCls} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></Field>
          <Field label="Severidade">
            <select className={inputCls} value={f.severidade} onChange={(e) => setF({ ...f, severidade: e.target.value as Incidente["severidade"] })}>
              <option>SEV1</option><option>SEV2</option><option>SEV3</option>
            </select>
          </Field>
          <Field label="Serviço afetado">
            <select className={inputCls} value={f.servico} onChange={(e) => setF({ ...f, servico: e.target.value })}>
              {servicos.map((s) => <option key={s.id}>{s.nome}</option>)}
            </select>
          </Field>
          <Field label="Tenants afetados"><input type="number" className={inputCls} value={f.tenants} onChange={(e) => setF({ ...f, tenants: Number(e.target.value) })} /></Field>
          <Field label="Responsável"><input className={inputCls} value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Resumo">
              <textarea className={`${inputCls} h-20 py-2`} value={f.resumo} onChange={(e) => setF({ ...f, resumo: e.target.value })} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground">Cancelar</button>
          <button
            disabled={!f.titulo}
            onClick={() => {
              onCriar({
                titulo: f.titulo, severidade: f.severidade, status: "aberto",
                abertoEm: new Date().toLocaleString("pt-BR"), duracaoMin: 0, servico: f.servico,
                tenantsAfetados: f.tenants, responsavel: f.responsavel, resumo: f.resumo,
                timeline: [{ quando: "agora", texto: "Incidente aberto pelo Admin Center." }],
              });
              toast.success("Incidente registrado e time notificado.");
              onOpenChange(false);
            }}
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Registrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
