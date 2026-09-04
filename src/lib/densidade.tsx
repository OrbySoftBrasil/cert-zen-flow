// Densidade da interface: "confortavel" (padrão) e "compacto" (telas de notebook).
// O modo compacto reduz a escala tipográfica base e os espaçamentos globais,
// cabendo bem mais informação em telas de 13"–15".
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "certus-ar-densidade-v1";

export type Densidade = "confortavel" | "compacto";

interface DensidadeCtx {
  densidade: Densidade;
  compacto: boolean;
  setDensidade: (d: Densidade) => void;
  alternar: () => void;
  /** true quando o modo compacto foi ligado automaticamente pela altura da tela. */
  automatico: boolean;
}

const Ctx = createContext<DensidadeCtx | null>(null);

export function DensidadeProvider({ children }: { children: ReactNode }) {
  const [densidade, setState] = useState<Densidade>("confortavel");
  const [automatico, setAutomatico] = useState(false);

  useEffect(() => {
    let salvo: Densidade | null = null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "compacto" || v === "confortavel") salvo = v;
    } catch {
      /* ignore */
    }
    if (salvo) {
      setState(salvo);
      return;
    }
    // Sem preferência salva: telas curtas ou estreitas de notebook começam compactas.
    const mq = window.matchMedia("(max-height: 900px), (max-width: 1440px)");
    if (mq.matches) {
      setState("compacto");
      setAutomatico(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset["densidade"] = densidade;
  }, [densidade]);

  const setDensidade = useCallback((d: Densidade) => {
    setState(d);
    setAutomatico(false);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<DensidadeCtx>(
    () => ({
      densidade,
      compacto: densidade === "compacto",
      automatico,
      setDensidade,
      alternar: () => setDensidade(densidade === "compacto" ? "confortavel" : "compacto"),
    }),
    [densidade, automatico, setDensidade],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDensidade() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDensidade precisa estar dentro de <DensidadeProvider>");
  return ctx;
}
