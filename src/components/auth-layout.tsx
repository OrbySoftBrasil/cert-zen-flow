// Moldura das telas de acesso (login, MFA, recuperação de senha).
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({
  titulo,
  subtitulo,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-muted/40 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary px-12 py-14 text-primary-foreground lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-md bg-primary-foreground/15">
            <ShieldCheck className="size-5" />
          </div>
          <p className="font-display text-base font-semibold">Certus AC</p>
        </div>

        <div className="my-auto max-w-md">
          <h2 className="font-display text-3xl leading-tight font-semibold">
            A operação da sua autoridade certificadora em um só lugar.
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Esteira de emissão, atendimento, agenda, rede de contadores e financeiro — com trilha de
            auditoria em cada ação.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/85">
            {[
              "Acesso protegido por segundo fator obrigatório",
              "Sessões monitoradas por dispositivo e localidade",
              "Perfis com escopo de fila e permissões granulares",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-foreground/70" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-primary-foreground/60">
          Ambiente de demonstração — dados fictícios, sem vínculo com a ICP-Brasil.
        </p>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full bg-primary-foreground/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-10 size-52 rounded-full bg-primary-foreground/10"
        />
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <p className="font-display text-sm font-semibold">Certus AC</p>
          </div>

          <h1 className="font-display text-xl font-semibold">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>

          <div className="mt-6">{children}</div>

          {rodape && <div className="mt-6 text-xs text-muted-foreground">{rodape}</div>}

          <p className="mt-10 text-[11px] text-muted-foreground">
            Precisa abrir um chamado sem entrar no sistema?{" "}
            <Link to="/portal" className="text-primary hover:underline">
              Use o portal do cliente
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
