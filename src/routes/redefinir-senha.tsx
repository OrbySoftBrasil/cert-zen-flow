import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth-layout";
import { Btn, Field, TextInput } from "@/components/forms";
import { forcaSenha } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — Certus AC" },
      {
        name: "description",
        content: "Crie uma nova senha para sua conta da Certus AC seguindo a política de segurança da operação.",
      },
      { property: "og:title", content: "Definir nova senha — Certus AC" },
      { property: "og:description", content: "Criação de nova senha com política de complexidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedefinirSenha,
});

const regras = [
  { label: "Pelo menos 10 caracteres", ok: (s: string) => s.length >= 10 },
  { label: "Letras maiúsculas e minúsculas", ok: (s: string) => /[A-Z]/.test(s) && /[a-z]/.test(s) },
  { label: "Ao menos um número", ok: (s: string) => /\d/.test(s) },
  { label: "Ao menos um caractere especial", ok: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

function RedefinirSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  const forca = forcaSenha(senha);
  const atende = regras.every((r) => r.ok(senha));
  const iguais = senha.length > 0 && senha === confirmacao;

  return (
    <AuthLayout
      titulo="Definir nova senha"
      subtitulo="A nova senha encerra todas as sessões ativas em outros dispositivos."
      rodape={
        <p>
          <Link to="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setCarregando(true);
          setTimeout(() => {
            toast.success("Senha redefinida", { description: "Entre novamente com a nova senha." });
            navigate({ to: "/login" });
          }, 600);
        }}
      >
        <Field label="Nova senha">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <TextInput
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="pl-8"
              placeholder="••••••••••"
            />
          </div>
        </Field>

        <div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i < forca.pontos ? (forca.pontos <= 2 ? "bg-alert" : "bg-primary") : "bg-muted",
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Força da senha: {forca.rotulo}</p>
          <ul className="mt-2 space-y-1">
            {regras.map((r) => {
              const ok = r.ok(senha);
              return (
                <li
                  key={r.label}
                  className={cn("flex items-center gap-1.5 text-[11px]", ok ? "text-primary" : "text-muted-foreground")}
                >
                  <Check className={cn("size-3", !ok && "opacity-40")} /> {r.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Field
          label="Confirmar nova senha"
          {...(confirmacao && !iguais ? { error: "As senhas não conferem." } : {})}
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <TextInput
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="pl-8"
              placeholder="••••••••••"
            />
          </div>
        </Field>

        <Btn type="submit" className="w-full" disabled={carregando || !atende || !iguais}>
          {carregando && <Loader2 className="size-4 animate-spin" />} Salvar nova senha
        </Btn>
      </form>
    </AuthLayout>
  );
}
