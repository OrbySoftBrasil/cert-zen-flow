// Estado do Admin Center (plano de controle SaaS), persistido em localStorage.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  flags as seedFlags,
  incidentes as seedIncidentes,
  integracoes as seedIntegracoes,
  planosSaas as seedPlanos,
  tenants as seedTenants,
  type FeatureFlag,
  type Incidente,
  type Integracao,
  type PlanoSaas,
  type Tenant,
} from "@/lib/admin-data";

const STORAGE_KEY = "certus-admin-v1";

interface AdminState {
  tenants: Tenant[];
  planos: PlanoSaas[];
  integracoes: Integracao[];
  flags: FeatureFlag[];
  incidentes: Incidente[];
}

const inicial: AdminState = {
  tenants: seedTenants,
  planos: seedPlanos,
  integracoes: seedIntegracoes,
  flags: seedFlags,
  incidentes: seedIncidentes,
};

interface AdminActions {
  addTenant: (
    t: Partial<Tenant> & { nome: string; slug: string; email: string; responsavel: string },
  ) => Tenant;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  removeTenant: (id: string) => void;
  updatePlano: (id: string, patch: Partial<PlanoSaas>) => void;
  addPlano: (p: Omit<PlanoSaas, "id">) => void;
  updateIntegracao: (id: string, patch: Partial<Integracao>) => void;
  updateFlag: (id: string, patch: Partial<FeatureFlag>) => void;
  addIncidente: (i: Omit<Incidente, "id">) => void;
  updateIncidente: (id: string, patch: Partial<Incidente>) => void;
}

const Ctx = createContext<(AdminState & AdminActions) | null>(null);

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(inicial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...(JSON.parse(raw) as AdminState) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const actions = useMemo<AdminActions>(
    () => ({
      addTenant: (t) => {
        const base = seedTenants[4]!;
        const novo: Tenant = {
          ...base,
          ...t,
          id: uid("t"),
          status: t.status ?? "onboarding",
          plano: t.plano ?? "pro",
          mrr: t.mrr ?? 0,
          usuarios: 1,
          emissoesMes: 0,
          consumoIa: 0,
          mensagensWhats: 0,
          emailsEnviados: 0,
          inadimplente: false,
          saudeScore: 70,
          nps: 0,
          ultimoAcesso: "agora",
          dominio: `${t.slug}.certus.app`,
          faturas: [],
          serie: base.serie.map((s) => ({ ...s, mrr: 0, emissoes: 0, ia: 0 })),
        };
        setState((s) => ({ ...s, tenants: [novo, ...s.tenants] }));
        return novo;
      },
      updateTenant: (id, patch) =>
        setState((s) => ({
          ...s,
          tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTenant: (id) =>
        setState((s) => ({ ...s, tenants: s.tenants.filter((t) => t.id !== id) })),
      updatePlano: (id, patch) =>
        setState((s) => ({
          ...s,
          planos: s.planos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      addPlano: (p) =>
        setState((s) => ({
          ...s,
          planos: [...s.planos, { ...p, id: uid("pl") as PlanoSaas["id"] }],
        })),
      updateIntegracao: (id, patch) =>
        setState((s) => ({
          ...s,
          integracoes: s.integracoes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      updateFlag: (id, patch) =>
        setState((s) => ({
          ...s,
          flags: s.flags.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),
      addIncidente: (i) =>
        setState((s) => ({ ...s, incidentes: [{ ...i, id: uid("inc") }, ...s.incidentes] })),
      updateIncidente: (id, patch) =>
        setState((s) => ({
          ...s,
          incidentes: s.incidentes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
    }),
    [],
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin precisa estar dentro de <AdminProvider>");
  return ctx;
}
