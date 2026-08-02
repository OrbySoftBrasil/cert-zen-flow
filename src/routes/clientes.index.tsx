import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Bar, Chip, Panel } from "@/components/ui-kit";
import { brl, clients } from "@/lib/mock-data";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Carteira de clientes — Certus AC" },
      {
        name: "description",
        content:
          "Carteira de clientes da autoridade certificadora com LTV, saúde do relacionamento e próximos vencimentos de certificado.",
      },
      { property: "og:title", content: "Carteira de clientes — Certus AC" },
      { property: "og:description", content: "LTV, saúde do relacionamento e vencimentos por cliente." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const [busca, setBusca] = useState("");
  const lista = clients.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) || c.documento.includes(busca),
  );

  return (
    <AppShell title="Clientes" subtitle={`${lista.length} contas na carteira`}>
      <Panel
        bodyClassName="p-0"
        title="Carteira"
        actions={
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por nome ou documento"
            className="w-56 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
          />
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Documento</th>
              <th className="px-4 py-2 font-medium">Certificados</th>
              <th className="px-4 py-2 font-medium">LTV</th>
              <th className="px-4 py-2 font-medium">Saúde</th>
              <th className="px-4 py-2 font-medium">Contador parceiro</th>
              <th className="px-4 py-2 font-medium">Gestor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link to="/clientes/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">
                    {c.nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">{c.cidade}</p>
                </td>
                <td className="px-4 py-3 tabular text-muted-foreground">{c.documento}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Chip tone="blue">{c.certificados.filter((x) => x.status === "ativo").length} ativos</Chip>
                    {c.certificados.some((x) => x.status === "a vencer") && <Chip tone="alert">a vencer</Chip>}
                  </div>
                </td>
                <td className="px-4 py-3 tabular">{brl(c.ltv)}</td>
                <td className="w-40 px-4 py-3">
                  <Bar value={c.saude} />
                  <span className="tabular text-[11px] text-muted-foreground">{c.saude}/100</span>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const ct = contadorDoCliente(c.id);
                    return ct ? (
                      <Link
                        to="/contadores/$id"
                        params={{ id: ct.id }}
                        className="text-primary hover:underline"
                      >
                        {ct.nome}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">direto</span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.gestor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
