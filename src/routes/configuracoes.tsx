import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SettingsActions, SettingsWorkspace, type SecaoId } from "@/components/settings-workspace";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da operação — Certus AR" },
      {
        name: "description",
        content:
          "Personalize a esteira de emissão, checklists por etapa, requisitos de avanço, SLA, catálogo, papéis, MFA, sessões, integrações e políticas de dados da Autoridade de Registro.",
      },
      { property: "og:title", content: "Configurações da operação — Certus AR" },
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


function ConfiguracoesPage() {
  const [ativa, setAtiva] = useState<SecaoId>("operacao");

  return (
    <AppShell
      title="Configurações"
      subtitle="Parametrize a esteira, as regras de negócio e as políticas de segurança desta Autoridade de Registro."
      actions={<SettingsActions />}
    >
      <SettingsWorkspace ativa={ativa} onChange={setAtiva} />
    </AppShell>
  );
}
