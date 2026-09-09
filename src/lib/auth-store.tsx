// Sessão do protótipo — autenticação simulada com MFA e recuperação de senha.
// Nada aqui é seguro nem chega a um servidor: é a camada de UX de acesso.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "certus-ac-sessao-v1";

export interface Sessao {
  nome: string;
  email: string;
  papel: string;
  iniciais: string;
  entrouEm: string;
  metodoMfa: "app" | "sms" | "email";
}

export const CONTAS_DEMO = [
  {
    email: "marina.duarte@certus.com.br",
    senha: "certus123",
    nome: "Marina Duarte",
    papel: "Agente de Registro",
  },
  {
    email: "diego.nunes@certus.com.br",
    senha: "certus123",
    nome: "Diego Nunes",
    papel: "Atendimento",
  },
  {
    email: "admin@certus.com.br",
    senha: "certus123",
    nome: "Helena Prado",
    papel: "Administrador",
  },
];

export const CODIGO_MFA_DEMO = "246810";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

interface AuthCtx {
  sessao: Sessao | null;
  pronta: boolean;
  entrar: (nome: string, email: string, papel: string, metodoMfa: Sessao["metodoMfa"]) => void;
  sair: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [pronta, setPronta] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSessao(JSON.parse(raw) as Sessao);
    } catch {
      /* sessão ausente */
    }
    setPronta(true);
  }, []);

  const entrar = useCallback(
    (nome: string, email: string, papel: string, metodoMfa: Sessao["metodoMfa"]) => {
      const nova: Sessao = {
        nome,
        email,
        papel,
        iniciais: iniciais(nome),
        metodoMfa,
        entrouEm: new Date().toISOString(),
      };
      setSessao(nova);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nova));
      } catch {
        /* cota indisponível */
      }
    },
    [],
  );

  const sair = useCallback(() => {
    setSessao(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo(() => ({ sessao, pronta, entrar, sair }), [sessao, pronta, entrar, sair]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

export function forcaSenha(senha: string) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  const rotulos = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte", "Excelente"];
  return { pontos, rotulo: rotulos[pontos] ?? "Fraca" };
}
