import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import { auditTrail, clients } from "@/lib/mock-data";

export const Route = createFileRoute("/conformidade")({
  head: () => ({
    meta: [
      { title: "Conformidade e auditoria — Certus AC" },
      {
        name: "description",
        content:
          "Trilha de auditoria, evidências de validação e relatório de revogações da autoridade certificadora.",
      },
      { property: "og:title", content: "Conformidade e auditoria — Certus AC" },
      { property: "og:description", content: "Trilha auditável, evidências e revogações." },
    ],
  }),
  component: Conformidade,
});

function Conformidade() {
  const revogados = clients.flatMap((c) =>
    c.certificados.filter((x) => x.status === "revogado").map((x) => ({ cliente: c.nome, cert: x })),
  );

  return (
    <AppShell title="Conformidade" subtitle="Trilha auditável de operações sensíveis">
      <div className="mb-4 flex flex-wrap divide-border rounded-lg border border-border bg-card">
        <Metric label="Eventos auditados (30d)" value="4.812" />
        <Metric label="Revogações" value={String(revogados.length)} hint="no período" />
        <Metric label="Evidências arquivadas" value="100%" hint="vídeo + termo" />
        <Metric label="Retenção" value="6 anos" hint="política vigente" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel title="Trilha de auditoria" bodyClassName="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Quando</th>
                <th className="px-4 py-2 font-medium">Ator</th>
                <th className="px-4 py-2 font-medium">Ação</th>
                <th className="px-4 py-2 font-medium">Alvo</th>
                <th className="px-4 py-2 font-medium">Evidência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditTrail.map((e) => (
                <tr key={e.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5 tabular text-muted-foreground">{e.quando}</td>
                  <td className="px-4 py-2.5">{e.ator}</td>
                  <td className="px-4 py-2.5">{e.acao}</td>
                  <td className="px-4 py-2.5 tabular text-muted-foreground">{e.alvo}</td>
                  <td className="px-4 py-2.5">
                    <Chip tone="outline">{e.evidencia}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Revogações">
          <ul className="space-y-3 text-sm">
            {revogados.map(({ cliente, cert }) => (
              <li key={cert.id} className="border-l-2 border-alert/50 pl-3">
                <p className="font-medium">{cliente}</p>
                <p className="text-xs text-muted-foreground tabular">
                  {cert.tipo} · {cert.serie}
                </p>
              </li>
            ))}
            {revogados.length === 0 && <li className="text-muted-foreground">Nenhuma revogação no período.</li>}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
