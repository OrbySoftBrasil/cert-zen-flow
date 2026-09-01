import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { NovaSolicitacaoButton } from "@/components/dialogs";
import { EmptyState } from "@/components/forms";
import { ExportMenu } from "@/components/export-menu";
import { Chip, Metric, Panel, SlaBadge } from "@/components/ui-kit";
import { agentById, brl, stages } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/solicitacoes/")({
  head: () => ({
    meta: [
      { title: "Solicitações de certificado — Certus AC" },
      {
        name: "description",
        content:
          "Lista completa de solicitações de certificado digital com etapa, responsável, SLA, canal e valor, com busca e exportação.",
      },
      { property: "og:title", content: "Solicitações de certificado — Certus AC" },
      { property: "og:description", content: "Busque, filtre e acompanhe todas as solicitações da operação." },
    ],
  }),
  component: Solicitacoes,
});

const POR_PAGINA = 12;

function Solicitacoes() {
  const { requests } = useStore();
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState("todas");
  const [responsavel, setResponsavel] = useState("todos");
  const [pagina, setPagina] = useState(1);

  const lista = useMemo(
    () =>
      requests.filter((r) => {
        const q = busca.trim().toLowerCase();
        const okBusca =
          !q ||
          r.protocolo.toLowerCase().includes(q) ||
          r.cliente.toLowerCase().includes(q) ||
          r.documento.includes(q);
        const okEtapa = etapa === "todas" || r.stage === etapa;
        const okResp = responsavel === "todos" || r.responsavelId === responsavel;
        return okBusca && okEtapa && okResp;
      }),
    [requests, busca, etapa, responsavel],
  );

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas);
  const visiveis = lista.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const emAtraso = lista.filter((r) => r.slaRestanteHoras < 0).length;
  const valorTotal = lista.reduce((s, r) => s + r.valor, 0);

  return (
    <AppShell
      title="Solicitações"
      subtitle="Todas as solicitações de certificado da operação"
      actions={
        <>
          <ExportMenu
            base="solicitacoes"
            datasets={[
              {
                nome: "Solicitacoes",
                linhas: lista.map((r) => ({
                  Protocolo: r.protocolo,
                  Cliente: r.cliente,
                  Documento: r.documento,
                  Tipo: r.tipo,
                  Etapa: stages.find((s) => s.id === r.stage)?.nome ?? r.stage,
                  Responsavel: agentById(r.responsavelId).nome,
                  Canal: r.canal,
                  Prioridade: r.prioridade,
                  SLA: r.slaRestanteHoras,
                  Valor: r.valor,
                })),
              },
            ]}
          />
          <NovaSolicitacaoButton />
        </>
      }
    >
      <div className="mb-4 flex flex-wrap rounded-lg border border-border bg-card">
        <Metric label="Solicitações" value={String(lista.length)} hint="no filtro atual" />
        <Metric label="Valor em pipeline" value={brl(valorTotal)} />
        <Metric label="SLA estourado" value={String(emAtraso)} hint="requer ação imediata" />
        <Metric
          label="Concluídas"
          value={String(lista.filter((r) => r.stage === "concluido").length)}
        />
      </div>

      <Panel
        bodyClassName="p-0"
        title="Fila completa"
        hint={`${lista.length} resultado(s)`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Protocolo, cliente ou documento"
              className="w-56 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            />
            <select
              value={etapa}
              onChange={(e) => {
                setEtapa(e.target.value);
                setPagina(1);
              }}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="todas">Todas as etapas</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            <select
              value={responsavel}
              onChange={(e) => {
                setResponsavel(e.target.value);
                setPagina(1);
              }}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="todos">Todos os responsáveis</option>
              {[...new Set(requests.map((r) => r.responsavelId))].map((id) => (
                <option key={id} value={id}>
                  {agentById(id).nome}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {visiveis.length === 0 ? (
          <EmptyState
            titulo="Nenhuma solicitação encontrada"
            descricao="Ajuste os filtros ou crie uma nova solicitação para o titular."
            acao={<div className="mt-2"><NovaSolicitacaoButton /></div>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Protocolo</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 font-medium">Etapa</th>
                  <th className="px-4 py-2 font-medium">Responsável</th>
                  <th className="px-4 py-2 font-medium">SLA</th>
                  <th className="px-4 py-2 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visiveis.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        to="/solicitacoes/$id"
                        params={{ id: r.id }}
                        className="font-medium tabular text-primary hover:underline"
                      >
                        {r.protocolo}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{r.canal}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/clientes/$id" params={{ id: r.clienteId }} className="hover:underline">
                        {r.cliente}
                      </Link>
                      <p className="tabular text-[11px] text-muted-foreground">{r.documento}</p>
                    </td>
                    <td className="px-4 py-3">{r.tipo}</td>
                    <td className="px-4 py-3">
                      <Chip tone={r.stage === "bloqueado" ? "alert" : r.stage === "concluido" ? "blue" : "outline"}>
                        {stages.find((s) => s.id === r.stage)?.nome}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{agentById(r.responsavelId).nome}</td>
                    <td className="px-4 py-3">
                      <SlaBadge horas={r.slaRestanteHoras} />
                    </td>
                    <td className="px-4 py-3 tabular">{brl(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {paginas > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span className="tabular">
              Página {paginaAtual} de {paginas}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-border-strong disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                disabled={paginaAtual === paginas}
                className="rounded-md border border-border px-2.5 py-1 transition-colors hover:border-border-strong disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
