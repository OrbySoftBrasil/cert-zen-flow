// Primitivas de formulário do protótipo — mesma linguagem visual das telas:
// bordas finas, densidade alta, foco azul institucional.
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  hint,
  footer,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  hint?: string;
  footer?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold">{title}</h2>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {error ? (
        <span className="block text-[11px] text-alert">{error}</span>
      ) : (
        hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

const base =
  "w-full rounded-md border border-border bg-card px-2.5 py-2 text-sm outline-none transition-colors focus:border-primary disabled:opacity-60";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, "min-h-20 resize-y", props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(base, props.className)} />;
}

export function Btn({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "border border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
    danger: "bg-alert text-primary-foreground hover:opacity-90",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
    />
  );
}

export function ConfirmDialog({
  open,
  title,
  descricao,
  confirmLabel = "Confirmar",
  destructive,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  descricao?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      {...(descricao ? { hint: descricao } : {})}
      width="max-w-md"
      footer={
        <>
          <Btn variant="ghost" onClick={onCancel}>
            Cancelar
          </Btn>
          <Btn variant={destructive ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </>
      }
    >
      {children ?? (
        <p className="text-sm text-muted-foreground">
          Esta ação será registrada na trilha de auditoria com seu usuário e horário.
        </p>
      )}
    </Modal>
  );
}

export function EmptyState({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <p className="font-display text-sm font-semibold">{titulo}</p>
      {descricao && <p className="max-w-sm text-xs text-muted-foreground">{descricao}</p>}
      {acao}
    </div>
  );
}
