// Paginação reutilizável — usada em todas as listas que podem crescer.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export const OPCOES_POR_PAGINA = [10, 25, 50, 100] as const;

export function usePaginacao<T>(itens: T[], inicial = 10) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState<number>(inicial);

  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [pagina, totalPaginas]);

  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = useMemo(
    () => itens.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
    [itens, paginaAtual, porPagina],
  );

  return {
    visiveis,
    total,
    pagina: paginaAtual,
    porPagina,
    totalPaginas,
    setPagina,
    setPorPagina: (n: number) => {
      setPorPagina(n);
      setPagina(1);
    },
    reset: () => setPagina(1),
  };
}

export type Paginacao = ReturnType<typeof usePaginacao<unknown>>;

export function Paginacao({
  pagina,
  porPagina,
  total,
  totalPaginas,
  setPagina,
  setPorPagina,
  rotulo = "registros",
  className,
}: {
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
  setPagina: (n: number) => void;
  setPorPagina: (n: number) => void;
  rotulo?: string;
  className?: string;
}) {
  if (total === 0) return null;
  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(total, pagina * porPagina);

  const paginas: (number | "…")[] = [];
  for (let p = 1; p <= totalPaginas; p++) {
    if (p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1) paginas.push(p);
    else if (paginas[paginas.length - 1] !== "…") paginas.push("…");
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5 print:hidden",
        className,
      )}
    >
      <p className="text-[11px] text-muted-foreground">
        <span className="tabular font-medium text-foreground">
          {inicio}–{fim}
        </span>{" "}
        de <span className="tabular">{total}</span> {rotulo}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          Por página
          <select
            value={porPagina}
            onChange={(e) => setPorPagina(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-1.5 py-1 text-[11px] outline-none focus:border-primary"
          >
            {OPCOES_POR_PAGINA.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => setPagina(pagina - 1)}
            className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          {paginas.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-[11px] text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => setPagina(p)}
                className={cn(
                  "tabular grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-[11px] transition-colors",
                  p === pagina
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border border-border text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Próxima página"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(pagina + 1)}
            className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40 disabled:hover:border-border"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
