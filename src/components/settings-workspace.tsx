// Área de configurações reutilizável: usada tanto na rota /configuracoes
// quanto na janela flutuante aberta pelo botão no rodapé do menu lateral.
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
  BookOpen,
  Ticket,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Btn, Modal } from "@/components/forms";
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
import { SecaoClassificacoes, SecaoConhecimento } from "@/components/settings-chamados";
import { Chip } from "@/components/ui-kit";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

export const secoes = [
  { id: "organizacao", label: "Organização", icon: Building2, grupo: "Geral" },
  { id: "fluxo", label: "Fluxo & etapas", icon: Workflow, grupo: "Operação" },
  { id: "catalogo", label: "Catálogo", icon: Tags, grupo: "Operação" },
  { id: "sla", label: "SLA & prioridades", icon: Timer, grupo: "Operação" },
  { id: "classificacoes", label: "Classificações", icon: Ticket, grupo: "Atendimento" },
  { id: "conhecimento", label: "Base de conhecimento", icon: BookOpen, grupo: "Atendimento" },
  { id: "equipe", label: "Equipe & usuários", icon: Users, grupo: "Acesso" },
  { id: "seguranca", label: "Segurança & acesso", icon: ShieldCheck, grupo: "Acesso" },
  { id: "notificacoes", label: "Notificações", icon: Bell, grupo: "Comunicação" },
  { id: "integracoes", label: "Integrações & API", icon: Plug, grupo: "Comunicação" },
  { id: "financeiro", label: "Financeiro", icon: Wallet, grupo: "Negócio" },
  { id: "aparencia", label: "Aparência & portal", icon: Palette, grupo: "Negócio" },
  { id: "dados", label: "Dados & LGPD", icon: Database, grupo: "Negócio" },
] as const;

export type SecaoId = (typeof secoes)[number]["id"];

export function SettingsWorkspace({
  ativa,
  onChange,
  compact,
}: {
  ativa: SecaoId;
  onChange: (id: SecaoId) => void;
  compact?: boolean;
}) {
  const { resetSettings } = useSettings();
  const grupos = [...new Set(secoes.map((s) => s.grupo))];

  return (
    <div className={cn("grid gap-4", compact ? "md:grid-cols-[210px_minmax(0,1fr)]" : "lg:grid-cols-[220px_minmax(0,1fr)]")}>
      <nav className={compact ? "md:sticky md:top-0 md:self-start" : "lg:sticky lg:top-4 lg:self-start"}>
        <div
          className={cn(
            "flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-card p-1.5",
            compact ? "md:block md:space-y-3 md:overflow-visible md:p-2" : "lg:block lg:space-y-3 lg:overflow-visible lg:p-2",
          )}
        >
          {grupos.map((g) => (
            <div key={g} className={compact ? "contents md:block" : "contents lg:block"}>
              <p
                className={cn(
                  "hidden px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                  compact ? "md:block" : "lg:block",
                )}
              >
                {g}
              </p>
              {secoes
                .filter((s) => s.grupo === g)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange(s.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                      compact ? "md:w-full" : "lg:w-full",
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
        {ativa === "classificacoes" && <SecaoClassificacoes />}
        {ativa === "conhecimento" && <SecaoConhecimento />}
        {ativa === "equipe" && <SecaoEquipe />}
        {ativa === "seguranca" && <SecaoSeguranca />}
        {ativa === "notificacoes" && <SecaoNotificacoes />}
        {ativa === "integracoes" && <SecaoIntegracoes />}
        {ativa === "financeiro" && <SecaoFinanceiro />}
        {ativa === "aparencia" && <SecaoAparencia />}
        {ativa === "dados" && <SecaoDados onReset={resetSettings} />}
      </div>
    </div>
  );
}

export function SettingsActions(): ReactNode {
  const { settings, dirty, marcarSalvo } = useSettings();
  const etapasAtivas = settings.fluxo.etapas.filter((e) => e.ativo).length;
  const gatesAtivos = settings.fluxo.etapas.reduce(
    (acc, e) => acc + Object.values(e.gates).filter(Boolean).length,
    0,
  );

  return (
    <>
      {dirty ? <Chip tone="alert">Alterações não publicadas</Chip> : <Chip tone="blue">Tudo publicado</Chip>}
      <Btn
        variant="ghost"
        onClick={() =>
          toast.success("Prévia gerada", {
            description: `${etapasAtivas} etapas ativas · ${gatesAtivos} requisitos de avanço configurados.`,
          })
        }
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
  );
}

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ativa, setAtiva] = useState<SecaoId>("fluxo");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações"
      hint="Parametrize a esteira, as regras de negócio e as políticas de segurança desta AC."
      width="max-w-6xl"
      footer={<SettingsActions />}
    >
      <SettingsWorkspace ativa={ativa} onChange={setAtiva} compact />
    </Modal>
  );
}
