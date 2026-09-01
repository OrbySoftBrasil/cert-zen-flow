import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Database,
  Palette,
  Plug,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Timer,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Btn } from "@/components/forms";
import {
  SecaoAparencia,
  SecaoCatalogo,
  SecaoDados,
  SecaoEquipe,
  SecaoFinanceiro,
  SecaoFluxo,
  SecaoIntegracoes,
  SecaoNotificacoes,
  SecaoOrganizacao,
  SecaoSeguranca,
  SecaoSla,
} from "@/components/settings-sections";
import { Chip } from "@/components/ui-kit";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da operação — Certus AC" },
      {
        name: "description",
        content:
          "Personalize a esteira de emissão, checklists por etapa, requisitos de avanço, SLA, catálogo, papéis, MFA, sessões, integrações e políticas de dados da autoridade certificadora.",
      },
      { property: "og:title", content: "Configurações da operação — Certus AC" },
      {
        property: "og:description",
        content:
          "Esteira personalizável por etapa, requisitos mínimos de avanço, SLA, segurança com MFA e histórico de acessos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracoesPage,
});

const secoes = [
  { id: "organizacao", label: "Organização", icon: Building2, grupo: "Geral" },
  { id: "fluxo", label: "Fluxo & etapas", icon: Workflow, grupo: "Operação" },
  { id: "catalogo", label: "Catálogo", icon: Tags, grupo: "Operação" },
  { id: "sla", label: "SLA & prioridades", icon: Timer, grupo: "Operação" },
  { id: "equipe", label: "Equipe & papéis", icon: Users, grupo: "Acesso" },
  { id: "seguranca", label: "Segurança & acesso", icon: ShieldCheck, grupo: "Acesso" },
  { id: "notificacoes", label: "Notificações", icon: Bell, grupo: "Comunicação" },
  { id: "integracoes", label: "Integrações & API", icon: Plug, grupo: "Comunicação" },
  { id: "financeiro", label: "Financeiro", icon: Wallet, grupo: "Negócio" },
  { id: "aparencia", label: "Aparência & portal", icon: Palette, grupo: "Negócio" },
  { id: "dados", label: "Dados & LGPD", icon: Database, grupo: "Negócio" },
] as const;

type SecaoId = (typeof secoes)[number]["id"];

function ConfiguracoesPage() {
  const { settings, dirty, marcarSalvo, resetSettings } = useSettings();
  const [ativa, setAtiva] = useState<SecaoId>("fluxo");
  const grupos = [...new Set(secoes.map((s) => s.grupo))];

  const etapasAtivas = settings.fluxo.etapas.filter((e) => e.ativo).length;
  const gatesAtivos = settings.fluxo.etapas.reduce(
    (acc, e) => acc + Object.values(e.gates).filter(Boolean).length,
    0,
  );

  return (
    <AppShell
      title="Configurações"
      subtitle="Parametrize a esteira, as regras de negócio e as políticas de segurança desta autoridade certificadora."
      actions={
        <>
          {dirty ? <Chip tone="alert">Alterações não publicadas</Chip> : <Chip tone="blue">Tudo publicado</Chip>}
          <Btn
            variant="ghost"
            onClick={() => {
              toast.success("Prévia gerada", {
                description: `${etapasAtivas} etapas ativas · ${gatesAtivos} requisitos de avanço configurados.`,
              });
            }}
          >
            <SlidersHorizontal className="size-4" /> Simular esteira
          </Btn>
          <Btn
            disabled={!dirty}
            onClick={() => {
              marcarSalvo();
              toast.success("Configurações publicadas", {
                description: "As novas regras já valem para solicitações em andamento.",
              });
            }}
          >
            Publicar alterações
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-card p-1.5 lg:block lg:space-y-3 lg:overflow-visible lg:p-2">
            {grupos.map((g) => (
              <div key={g} className="contents lg:block">
                <p className="hidden px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:block">
                  {g}
                </p>
                {secoes
                  .filter((s) => s.grupo === g)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAtiva(s.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors lg:w-full",
                        ativa === s.id
                          ? "bg-primary-soft font-medium text-primary-deep"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <s.icon className="size-4 shrink-0" />
                      <span className="whitespace-nowrap">{s.label}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0">
          {ativa === "organizacao" && <SecaoOrganizacao />}
          {ativa === "fluxo" && <SecaoFluxo />}
          {ativa === "catalogo" && <SecaoCatalogo />}
          {ativa === "sla" && <SecaoSla />}
          {ativa === "equipe" && <SecaoEquipe />}
          {ativa === "seguranca" && <SecaoSeguranca />}
          {ativa === "notificacoes" && <SecaoNotificacoes />}
          {ativa === "integracoes" && <SecaoIntegracoes />}
          {ativa === "financeiro" && <SecaoFinanceiro />}
          {ativa === "aparencia" && <SecaoAparencia />}
          {ativa === "dados" && <SecaoDados onReset={resetSettings} />}
        </div>
      </div>
    </AppShell>
  );
}
