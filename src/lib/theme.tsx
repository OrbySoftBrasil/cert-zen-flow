// Tema claro/escuro da aplicação principal.
// Telas públicas (portal de chamados) e o portal do parceiro permanecem sempre claras.
import { useRouterState } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "certus-ac-tema-v1";

export type Tema = "claro" | "escuro" | "sistema";

/** Rotas que nunca recebem tema escuro. */
const ROTAS_SEMPRE_CLARAS = ["/parceiro", "/portal", "/mobile-contador"];

interface TemaCtx {
  tema: Tema;
  efetivo: "claro" | "escuro";
  bloqueado: boolean;
  setTema: (t: Tema) => void;
  alternar: () => void;
}

const Ctx = createContext<TemaCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>("claro");
  const [sistemaEscuro, setSistemaEscuro] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bloqueado = ROTAS_SEMPRE_CLARAS.some((r) => pathname.startsWith(r));

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY) as Tema | null;
      if (salvo === "claro" || salvo === "escuro" || salvo === "sistema") setTemaState(salvo);
    } catch {
      /* ignore */
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSistemaEscuro(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSistemaEscuro(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const efetivo: "claro" | "escuro" = bloqueado
    ? "claro"
    : tema === "sistema"
      ? sistemaEscuro
        ? "escuro"
        : "claro"
      : tema;

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", efetivo === "escuro");
    el.style.colorScheme = efetivo === "escuro" ? "dark" : "light";
  }, [efetivo]);

  const setTema = useCallback((t: Tema) => {
    setTemaState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<TemaCtx>(
    () => ({
      tema,
      efetivo,
      bloqueado,
      setTema,
      alternar: () => setTema(efetivo === "escuro" ? "claro" : "escuro"),
    }),
    [tema, efetivo, bloqueado, setTema],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTema() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTema precisa estar dentro de <ThemeProvider>");
  return ctx;
}
