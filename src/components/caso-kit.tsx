// Primitivas visuais do Workspace do Caso — mesma linguagem do restante do app.
import { AlertTriangle, Ban, Check, CircleDashed, Lock, Minus, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Chip } from "@/components/ui-kit";
import { rotuloEstado, type EstadoItem } from "@/lib/caso-model";
import { cn } from "@/lib/utils";

const icones = {
  concluido: Check,
  pronto: Check,
  pendente: CircleDashed,
  bloqueado: Ban,
  na: Minus,
} as const;

const tons: Record<EstadoItem, string> = {
  concluido: "bg-primary-soft text-primary-deep",
  pronto: "bg-primary text-primary-foreground",
  pendente: "border border-border-strong text-muted-foreground",
  bloqueado: "bg-alert-soft text-alert",
  na: "bg-muted text-muted-foreground",
};

export function EstadoChip({ estado, label }: { estado: EstadoItem; label?: string }) {
  const Icon = icones[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tons[estado],
      )}
    >
      <Icon className="size-3" />
      {label ?? rotuloEstado[estado]}
    </span>
  );
}

export function LinhaDado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-border px-3 py-2 not-last:border-r">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <div className="mt-0.5 truncate text-sm">{children}</div>
    </div>
  );
}

export function RegraObrigatoria({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border-strong bg-muted/60 px-3 py-2">
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Obrigatória — não editável.</span> {texto}
      </p>
    </div>
  );
}

export function AvisoBloqueio({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-alert-soft px-3 py-2">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-alert" />
      <p className="text-xs text-alert">{texto}</p>
    </div>
  );
}

export function BotaoAcao({
  label,
  onClick,
  bloqueio,
  regulatoria,
  destrutiva,
}: {
  label: string;
  onClick: () => void;
  bloqueio?: string | null;
  regulatoria?: boolean;
  destrutiva?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={bloqueio ?? undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary-soft/40",
        bloqueio && "opacity-60",
        destrutiva && "hover:border-alert hover:bg-alert-soft/50",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {bloqueio ? (
          <Lock className="size-3.5 shrink-0 text-alert" />
        ) : (
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        )}
        <span className="leading-tight">{label}</span>
      </span>
      {regulatoria && <Chip tone="outline">Regulatória</Chip>}
    </button>
  );
}
