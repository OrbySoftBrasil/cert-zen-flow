import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { AuthLayout } from "@/components/auth-layout";
import { Btn, Field, TextInput } from "@/components/forms";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar acesso — Certus AC" },
      {
        name: "description",
        content: "Solicite um link seguro de redefinição de senha para voltar a acessar a operação da Certus AC.",
      },
      { property: "og:title", content: "Recuperar acesso — Certus AC" },
      { property: "og:description", content: "Envio de link seguro para redefinição de senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecuperarSenha,
});

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  return (
    <AuthLayout
      titulo="Recuperar acesso"
      subtitulo="Enviaremos um link de redefinição válido por 30 minutos para o e-mail cadastrado."
      rodape={
        <p>
          Lembrou a senha?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      }
    >
      {enviado ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md bg-primary-soft px-3 py-2.5 text-sm text-primary-deep">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>
              Se <strong>{email}</strong> estiver cadastrado, o link de redefinição chega em instantes. Confira também a
              caixa de spam.
            </p>
          </div>
          <Link to="/redefinir-senha" search={{ token: "demo" }}>
            <Btn className="w-full">Abrir link de redefinição (demo)</Btn>
          </Link>
          <button
            onClick={() => setEnviado(false)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setCarregando(true);
            setTimeout(() => {
              setCarregando(false);
              setEnviado(true);
            }, 500);
          }}
        >
          <Field label="E-mail cadastrado">
            <div className="relative">
              <Mail className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-8"
                placeholder="nome@certus.com.br"
              />
            </div>
          </Field>
          <Btn type="submit" className="w-full" disabled={carregando || !email.trim()}>
            {carregando && <Loader2 className="size-4 animate-spin" />} Enviar link de redefinição
          </Btn>
          <p className="text-[11px] text-muted-foreground">
            Por segurança, não informamos se o e-mail existe na base. Tentativas são registradas na trilha de auditoria.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
