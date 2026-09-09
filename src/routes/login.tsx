import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth-layout";
import { Btn, Field, TextInput } from "@/components/forms";
import { CODIGO_MFA_DEMO, CONTAS_DEMO, useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar na operação — Certus AC" },
      {
        name: "description",
        content:
          "Acesso ao sistema da autoridade certificadora Certus AC com senha e segundo fator de autenticação obrigatório.",
      },
      { property: "og:title", content: "Entrar na operação — Certus AC" },
      {
        property: "og:description",
        content: "Login com MFA para a equipe da autoridade certificadora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

type Etapa = "credenciais" | "mfa";
type MetodoMfa = "app" | "sms" | "email";

const metodos: { id: MetodoMfa; label: string; hint: string; icon: typeof Smartphone }[] = [
  {
    id: "app",
    label: "Aplicativo autenticador",
    hint: "Código de 6 dígitos no seu app",
    icon: Smartphone,
  },
  { id: "sms", label: "SMS", hint: "Enviado para (11) ****-8821", icon: Smartphone },
  { id: "email", label: "E-mail", hint: "Enviado para o e-mail corporativo", icon: Mail },
];

function LoginPage() {
  const navigate = useNavigate();
  const { entrar } = useAuth();
  const [etapa, setEtapa] = useState<Etapa>("credenciais");
  const [email, setEmail] = useState("marina.duarte@certus.com.br");
  const [senha, setSenha] = useState("certus123");
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [metodo, setMetodo] = useState<MetodoMfa>("app");
  const [codigo, setCodigo] = useState("");
  const [conta, setConta] = useState(CONTAS_DEMO[0]!);

  function autenticar() {
    setErro("");
    const achou = CONTAS_DEMO.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
    if (!achou || achou.senha !== senha) {
      setErro("E-mail ou senha inválidos. Use uma das contas de demonstração abaixo.");
      return;
    }
    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      setConta(achou);
      setEtapa("mfa");
      toast.info("Código de verificação enviado", {
        description: `Use ${CODIGO_MFA_DEMO} neste ambiente de demonstração.`,
      });
    }, 550);
  }

  function validarCodigo() {
    setErro("");
    if (codigo.replace(/\D/g, "") !== CODIGO_MFA_DEMO) {
      setErro("Código incorreto ou expirado. Gere um novo código e tente de novo.");
      return;
    }
    setCarregando(true);
    setTimeout(() => {
      entrar(conta.nome, conta.email, conta.papel, metodo);
      toast.success(`Bem-vinda, ${conta.nome.split(" ")[0]}`, {
        description: "Sessão iniciada com segundo fator.",
      });
      navigate({ to: "/" });
    }, 500);
  }

  return (
    <AuthLayout
      titulo={etapa === "credenciais" ? "Entrar na operação" : "Verificação em duas etapas"}
      subtitulo={
        etapa === "credenciais"
          ? "Use suas credenciais corporativas. O segundo fator é obrigatório para todos os perfis."
          : `Enviamos um código de 6 dígitos para ${conta.nome}. Ele expira em 5 minutos.`
      }
      rodape={
        etapa === "credenciais" ? (
          <div className="rounded-md border border-dashed border-border bg-card p-3">
            <p className="font-medium text-foreground">Contas de demonstração</p>
            <ul className="mt-1.5 space-y-1">
              {CONTAS_DEMO.map((c) => (
                <li key={c.email} className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEmail(c.email);
                      setSenha(c.senha);
                    }}
                    className="tabular text-primary hover:underline"
                  >
                    {c.email}
                  </button>
                  <span className="text-muted-foreground">· {c.papel}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1.5">
              Senha <span className="tabular font-medium text-foreground">certus123</span> · código
              MFA <span className="tabular font-medium text-foreground">{CODIGO_MFA_DEMO}</span>
            </p>
          </div>
        ) : null
      }
    >
      {erro && (
        <p className="mb-4 rounded-md bg-alert-soft px-3 py-2 text-xs text-alert" role="alert">
          {erro}
        </p>
      )}

      {etapa === "credenciais" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            autenticar();
          }}
        >
          <Field label="E-mail corporativo">
            <div className="relative">
              <Mail className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <TextInput
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8"
                placeholder="nome@certus.com.br"
              />
            </div>
          </Field>

          <Field label="Senha">
            <div className="relative">
              <Lock className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <TextInput
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pl-8"
                placeholder="••••••••"
              />
            </div>
          </Field>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
              />
              Manter conectado por 12h
            </label>
            <Link to="/recuperar-senha" className="text-primary hover:underline">
              Esqueci a senha
            </Link>
          </div>

          <Btn type="submit" className="w-full" disabled={carregando}>
            {carregando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Continuar
          </Btn>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            validarCodigo();
          }}
        >
          <div className="space-y-1.5">
            {metodos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodo(m.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors",
                  metodo === m.id
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-border-strong",
                )}
              >
                <m.icon
                  className={cn(
                    "size-4",
                    metodo === m.id ? "text-primary-deep" : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <Field label="Código de verificação" hint="6 dígitos, sem espaços">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <TextInput
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                className="tabular pl-8 text-center text-lg tracking-[0.4em]"
                placeholder="000000"
              />
            </div>
          </Field>

          <Btn type="submit" className="w-full" disabled={carregando || codigo.length < 6}>
            {carregando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Confirmar e entrar
          </Btn>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setEtapa("credenciais")}
              className="text-muted-foreground hover:text-foreground"
            >
              Trocar de conta
            </button>
            <button
              type="button"
              onClick={() =>
                toast.info("Novo código enviado", { description: `Use ${CODIGO_MFA_DEMO}.` })
              }
              className="text-primary hover:underline"
            >
              Reenviar código
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
