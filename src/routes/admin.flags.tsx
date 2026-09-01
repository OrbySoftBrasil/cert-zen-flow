import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { ExportMenu } from "@/components/export-menu";
import { KpiCard } from "@/components/admin-kit";
import { Chip, Panel } from "@/components/ui-kit";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/flags")({
  head: () => ({
    meta: [
      { title: "Feature flags e rollout — Admin Center | Certus SaaS" },
      { name: "description", content: "Controle de funcionalidades por tenant: ativação gradual, percentual de rollout, tenants piloto e histórico de mudanças." },
      { property: "og:title", content: "Feature flags e rollout — Admin Center" },
      { property: "og:description", content: "Ativação gradual de funcionalidades por tenant e percentual de rollout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FlagsPage,
});

function FlagsPage() {
  const { flags, tenants, updateFlag } = useAdmin();

  return (
    <AdminShell
      title="Feature flags"
      subtitle="Liberação gradual de funcionalidades por tenant e percentual de rollout"
      actions={
        <ExportMenu
          base="admin-flags"
          datasets={() => [
            { nome: "Flags", linhas: flags.map((f) => ({ Chave: f.chave, Descrição: f.descricao, Estado: f.estado, "Rollout %": f.rollout, "Tenants piloto": f.tenants.join(", "), Atualizado: f.atualizadoEm })) },
          ]}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Flags configuradas" value={String(flags.length)} icon={<Flag className="size-4" />} />
        <KpiCard label="Liberadas 100%" value={String(flags.filter((f) => f.estado === "on").length)} hint="disponíveis a todos os tenants" />
        <KpiCard label="Em rollout parcial" value={String(flags.filter((f) => f.estado === "parcial").length)} hint="monitoradas por métrica" />
        <KpiCard label="Desligadas" value={String(flags.filter((f) => f.estado === "off").length)} hint="em desenvolvimento" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {flags.map((f) => (
          <Panel
            key={f.id}
            title={f.chave}
            hint={f.descricao}
            actions={<Chip tone={f.estado === "on" ? "deep" : f.estado === "parcial" ? "blue" : "neutral"}>{f.estado}</Chip>}
          >
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Rollout</span>
                  <span className="tabular font-medium">{f.rollout}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={f.rollout}
                  onChange={(e) => {
                    const rollout = Number(e.target.value);
                    updateFlag(f.id, { rollout, estado: rollout === 0 ? "off" : rollout === 100 ? "on" : "parcial" });
                  }}
                  className="mt-1 w-full accent-[var(--primary)]"
                />
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium">Tenants piloto</span>
                <select
                  multiple
                  value={f.tenants}
                  onChange={(e) =>
                    updateFlag(f.id, { tenants: Array.from(e.target.selectedOptions).map((o) => o.value) })
                  }
                  className="h-24 w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  {tenants.map((t) => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                </select>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">Atualizada em {f.atualizadoEm}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateFlag(f.id, { estado: "on", rollout: 100 });
                      toast.success(`${f.chave} liberada para todos os tenants.`);
                    }}
                    className="h-8 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Liberar 100%
                  </button>
                  <button
                    onClick={() => {
                      updateFlag(f.id, { estado: "off", rollout: 0 });
                      toast.success(`${f.chave} desligada.`);
                    }}
                    className="h-8 rounded-md border border-border px-2.5 text-xs hover:border-primary"
                  >
                    Desligar
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </AdminShell>
  );
}
