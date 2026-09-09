import {
  Check,
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Printer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { exportCsv, exportJson, exportPdf, exportXlsx, type Dataset } from "@/lib/export";

export function ExportMenu({
  datasets,
  base = "export",
  label = "Exportar",
}: {
  datasets: () => Dataset[];
  base?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const run = async (tipo: string, fn: () => void | Promise<void>) => {
    await fn();
    setFeito(tipo);
    setOpen(false);
    setTimeout(() => setFeito(null), 2000);
  };

  const items = [
    {
      id: "csv",
      nome: "CSV (.csv)",
      hint: "separado por ponto e vírgula",
      icon: FileText,
      run: () => exportCsv(datasets(), base),
    },
    {
      id: "xlsx",
      nome: "Excel (.xlsx)",
      hint: "uma aba por conjunto",
      icon: FileSpreadsheet,
      run: () => exportXlsx(datasets(), base),
    },
    {
      id: "json",
      nome: "JSON (.json)",
      hint: "integração / BI",
      icon: FileJson,
      run: () => exportJson(datasets(), base),
    },
    {
      id: "pdf",
      nome: "PDF / Imprimir",
      hint: "visão atual da tela",
      icon: Printer,
      run: () => exportPdf(),
    },
  ];

  return (
    <div className="relative print:hidden" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      >
        {feito ? <Check className="size-3.5 text-primary" /> : <Download className="size-3.5" />}
        {feito ? "Exportado" : label}
        <ChevronDown className="size-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <p className="border-b border-border px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Exportar dados da operação
          </p>
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => run(i.id, i.run)}
              className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <i.icon className="mt-0.5 size-4 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm">{i.nome}</span>
                <span className="block text-[11px] text-muted-foreground">{i.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
