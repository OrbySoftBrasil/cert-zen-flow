// Estado de "Operação & perfis": versão publicada, rascunho em edição,
// histórico e permissões separadas (editar rascunho x publicar).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  compararVersoes,
  seedHistorico,
  seedPublicada,
  validarPublicacao,
  type EscopoConfig,
  type EtapaConfig,
  type PerfilOperacional,
  type SubfluxoConfig,
  type VersaoPerfil,
} from "@/lib/opconfig-model";

const STORAGE_KEY = "certus-opconfig-v2";
const STORAGE_KEY_ANTIGA = "certus-opconfig-v1";

interface Persistido {
  publicada: VersaoPerfil;
  rascunho: PerfilOperacional;
  historico: VersaoPerfil[];
  dirty: boolean;
}

function clonar<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function inicial(): Persistido {
  const publicada = seedPublicada();
  return {
    publicada,
    rascunho: clonar<PerfilOperacional>(publicada),
    historico: seedHistorico(),
    dirty: false,
  };
}

export interface Permissoes {
  editarRascunho: boolean;
  publicar: boolean;
}

interface Ctx {
  publicada: VersaoPerfil;
  rascunho: PerfilOperacional;
  historico: VersaoPerfil[];
  dirty: boolean;
  permissoes: Permissoes;
  setPermissoes: (p: Permissoes) => void;
  achados: ReturnType<typeof validarPublicacao>;
  diff: ReturnType<typeof compararVersoes>;
  setEscopo: (e: EscopoConfig) => void;
  patchEtapas: (fn: (l: EtapaConfig[]) => EtapaConfig[]) => void;
  updateEtapa: (id: string, patch: Partial<EtapaConfig>) => void;
  updateSubfluxo: (id: string, patch: Partial<SubfluxoConfig>) => void;
  descartarRascunho: () => void;
  publicar: (nota: string, autor: string) => void;
}

const OpCtx = createContext<Ctx | null>(null);

export function OpConfigProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Persistido>(inicial);
  const [permissoes, setPermissoes] = useState<Permissoes>({
    editarRascunho: true,
    publicar: true,
  });

  useEffect(() => {
    try {
      // Perfis salvos por versões anteriores não têm os campos tipados do
      // checklist híbrido; são descartados em favor do seed atual.
      window.localStorage.removeItem(STORAGE_KEY_ANTIGA);
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const lido = JSON.parse(raw) as Persistido;
        if (lido?.publicada?.etapas && lido?.rascunho?.etapas) setEstado(lido);
      }
    } catch {
      /* mantém seed */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch {
      /* cota indisponível */
    }
  }, [estado]);

  const mutar = useCallback((fn: (r: PerfilOperacional) => PerfilOperacional) => {
    setEstado((s) => ({ ...s, rascunho: fn(s.rascunho), dirty: true }));
  }, []);

  const value = useMemo<Ctx>(() => {
    return {
      publicada: estado.publicada,
      rascunho: estado.rascunho,
      historico: estado.historico,
      dirty: estado.dirty,
      permissoes,
      setPermissoes,
      achados: validarPublicacao(estado.rascunho),
      diff: compararVersoes(estado.publicada, estado.rascunho),
      setEscopo: (escopo) => mutar((r) => ({ ...r, escopo })),
      patchEtapas: (fn) => mutar((r) => ({ ...r, etapas: fn(r.etapas) })),
      updateEtapa: (id, patch) =>
        mutar((r) => ({
          ...r,
          etapas: r.etapas.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      updateSubfluxo: (id, patch) =>
        mutar((r) => ({
          ...r,
          subfluxos: r.subfluxos.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      descartarRascunho: () =>
        setEstado((s) => ({
          ...s,
          rascunho: clonar<PerfilOperacional>(s.publicada),
          dirty: false,
        })),
      publicar: (nota, autor) =>
        setEstado((s) => {
          const proximo = Number(s.publicada.numero.replace("v", "")) + 1;
          const nova: VersaoPerfil = {
            ...clonar(s.rascunho),
            id: `v-${proximo}`,
            numero: `v${proximo}`,
            autor,
            data: new Date().toISOString(),
            nota: nota || "Sem nota de publicação.",
            casos: 0,
          };
          return {
            publicada: nova,
            rascunho: clonar<PerfilOperacional>(nova),
            historico: [s.publicada, ...s.historico].slice(0, 8),
            dirty: false,
          };
        }),
    };
  }, [estado, permissoes, mutar]);

  return <OpCtx.Provider value={value}>{children}</OpCtx.Provider>;
}

export function useOpConfig() {
  const ctx = useContext(OpCtx);
  if (!ctx) throw new Error("useOpConfig precisa estar dentro de <OpConfigProvider>");
  return ctx;
}
