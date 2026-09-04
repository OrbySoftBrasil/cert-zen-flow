// Componentes da área Operação — mesma linguagem visual do restante do sistema.
import {
  AlertTriangle,
  Ban,
  Check,
  CircleSlash,
  Lock,
  Minus,
  ShieldCheck,
  Timer,
  User,
} from "lucide-react";
import type { ReactNode } from "react";

import { Chip, SlaBadge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { agentById, brl, type Priority, type Request } from "@/lib/mock-data";
import {
  bloqueioPrincipal,
  origemDe,
  prontidaoDe,
  proximaAcaoLabel,
  rotuloProntidao,
  trilhas,
  type EstadoProntidao,
} from "@/lib/operacao-model";

export const prioridadeTone: Record<Priority, "outline" | "neutral" | "blue" | "alert"> = {
  baixa: "outline",
  normal: "neutral",
  alta: "blue",
  critica: "alert",
};

const estiloProntidao: Record<EstadoProntidao, { classe: string; Icon: typeof Check }> = {
  pronto: { classe: "bg-primary-soft text-primary-deep", Icon: Check },
  pendente: { classe: "border border-border-strong text-muted-foreground", Icon: Timer },
  bloqueado: { classe: "bg-alert-soft text-alert", Icon: Ban },
  na: { classe: "bg-muted text-muted-foreground", Icon: Minus },
};

export function ProntidaoChip({
  trilha,
  estado,
  completo,
}: {
  trilha: string;
  estado: EstadoProntidao;
  completo?: boolean;
}) {
  const { classe, Icon } = estiloProntidao[estado];
  return (
    <span
      title={`${trilha}: ${rotuloProntidao[estado]}`}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
        classe,
      )}
    >
      <Icon className="size-3 shrink-0" />
      {trilha}
      {completo && <span className="opacity-70">· {rotuloProntidao[estado]}</span>}
    </span>
  );
}

export function ProntidaoLinha({ r, completo }: { r: Request; completo?: boolean }) {
  const estados = prontidaoDe(r);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {trilhas.map((t) => (
        <ProntidaoChip
          key={t.id}
          trilha={completo ? t.nome : t.curto}
          estado={estados[t.id]}
          {...(completo ? { completo: true } : {})}
        />
      ))}
    </div>
  );
}

export function CasoCard({
  r,
  emissoes,
  onOpen,
  onDragStart,
  onDragEnd,
  arrastando,
}: {
  r: Request;
  emissoes: number;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  arrastando?: boolean;
}) {
  const resp = agentById(r.responsavelId);
  const bloqueio = bloqueioPrincipal(r);
  const semBloqueio = bloqueio.startsWith("Sem bloqueio");
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "block w-full cursor-pointer rounded-md border border-border bg-card p-2.5 text-left transition-colors hover:border-border-strong",
        arrastando && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="tabular text-[11px] text-muted-foreground">{r.protocolo}</p>
          <p className="truncate text-sm font-medium leading-snug">{r.cliente}</p>
        </div>
        <span
          title={resp.nome}
          className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary-deep"
        >
          {resp.iniciais}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground">
        {r.tipo} · {emissoes} emissão(ões) · {brl(r.valor)}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">{origemDe(r)}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <SlaBadge horas={r.slaRestanteHoras} />
        <Chip tone={prioridadeTone[r.prioridade]}>{r.prioridade}</Chip>
      </div>

      <div className="mt-2">
        <ProntidaoLinha r={r} />
      </div>

      <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-[11px]">
        <p className="flex items-center gap-1 text-primary-deep">
          <ShieldCheck className="size-3 shrink-0" />
          <span className="truncate">{proximaAcaoLabel(r)}</span>
        </p>
        <p className={cn("flex items-center gap-1", semBloqueio ? "text-muted-foreground" : "text-alert")}>
          {semBloqueio ? <Check className="size-3 shrink-0" /> : <AlertTriangle className="size-3 shrink-0" />}
          <span className="truncate">{bloqueio}</span>
        </p>
      </div>
    </button>
  );
}

export function AvisoRegulatorio({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-md border border-border bg-surface px-2.5 py-2 text-[11px] text-muted-foreground">
      <Lock className="mt-px size-3 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function SkeletonLinhas({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export function ErroEstado({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <CircleSlash className="size-5 text-alert" />
      <p className="font-display text-sm font-semibold">Não foi possível carregar a fila</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        A conexão com o serviço de tarefas falhou. Nenhum dado foi perdido — tente novamente.
      </p>
      <button
        onClick={onRetry}
        className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
      >
        Tentar novamente
      </button>
    </div>
  );
}

export function PerfilAvatar({ sigla }: { sigla: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border-strong px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <User className="size-3" />
      {sigla}
    </span>
  );
}
