import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck, PhoneCall, Send } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Metric, Panel } from "@/components/ui-kit";
import { brl, clients, renovacoes } from "@/lib/mock-data";

export const Route = createFileRoute("/renovacoes")({
  head: () => ({
    meta: [
      { title: "Motor de renovação — Certus AC" },
      {
        name: "description",
        content:
          "Certificados a vencer em 30, 60 e 90 dias, com campanhas de renovação e histórico de contato por cliente.",
      },
      { property: "og:title", content: "Motor de renovação — Certus AC" },
      { property: "og:description", content: "Vencimentos, campanhas e histórico de contato." },
    ],
  }),
  component: Renovacoes,
});

function Renovacoes() {
  const [disparadas, setDisparadas] = useState<string[]>([]);
  const aVencer = clients.flatMap((c) =>
    c.certificados
      .filter((cert) => cert.status === "a vencer" || cert.status === "ativo")
      .map((cert) => ({ cliente: c, cert })),
  );

  return (
    <AppShell title="Renovações" subtitle="Base instalada e receita recorrente em risco">
      <div className="mb-4 flex flex-wrap divide-border rounded-lg border border-border bg-card">
        {renovacoes.map((r) => (
          <Metric key={r.janela} label={r.janela} value={String(r.quantidade)} hint={brl(r.receita)} />
        ))}
        <Metric label="Taxa de renovação" value="81,4%" delta={2.7} hint="últimos 90 dias" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="Certificados a vencer" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Certificado</th>
                  <th className="px-4 py-2 font-medium">Validade</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aVencer.map(({ cliente, cert }) => (
                  <tr key={cert.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <Link to="/clientes/$id" params={{ id: cliente.id }} className="text-primary hover:underline">
                        {cliente.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular text-muted-foreground">
                      {cert.tipo} · {cert.serie}
                    </td>
                    <td className="px-4 py-2.5 tabular">{cert.validoAte}</td>
                    <td className="px-4 py-2.5">
                      <Chip tone={cert.status === "a vencer" ? "alert" : "blue"}>{cert.status}</Chip>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setDisparadas((p) => [...p, cert.id])}
                        className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-primary"
                      >
                        {disparadas.includes(cert.id) ? "Campanha enviada" : "Disparar renovação"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Campanhas ativas">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MailCheck className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">E-mail D-30</p>
                  <p className="text-xs text-muted-foreground">214 disparos · 38% de abertura</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Send className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">WhatsApp D-7</p>
                  <p className="text-xs text-muted-foreground">96 disparos · 61% de resposta</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <PhoneCall className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">Ligação corporativa</p>
                  <p className="text-xs text-muted-foreground">Contas acima de R$ 5 mil de LTV</p>
                </div>
              </li>
            </ul>
          </Panel>
          <Panel title="Histórico de contato">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Aurora S/A — proposta corporativa enviada</li>
              <li>Vale Norte — cobrança de documento pendente</li>
              <li>Bem Viver — bloqueio financeiro comunicado</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
