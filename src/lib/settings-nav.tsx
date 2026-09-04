// Navegação entre seções de Configurações (evita import circular entre telas).
import { createContext, useContext } from "react";

export type SecaoNavId = string;

const NavCtx = createContext<((id: SecaoNavId) => void) | null>(null);

export const SettingsNavProvider = NavCtx.Provider;

/** Permite que uma seção envie o usuário para outra (ex.: criar papel em Equipe). */
export function useIrParaSecao() {
  return useContext(NavCtx);
}
