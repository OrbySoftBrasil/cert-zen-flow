export type Row = Record<string, string | number>;

export interface Dataset {
  nome: string;
  linhas: Row[];
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Row[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0] as Row);
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(";"))].join("\r\n");
}

export function exportCsv(datasets: Dataset[], base: string) {
  const body = datasets
    .map((d) => `#${d.nome}\r\n${toCsv(d.linhas)}`)
    .join("\r\n\r\n");
  download(new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }), `${base}-${stamp()}.csv`);
}

export function exportJson(datasets: Dataset[], base: string) {
  const obj = Object.fromEntries(datasets.map((d) => [d.nome, d.linhas]));
  download(
    new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }),
    `${base}-${stamp()}.json`,
  );
}

export async function exportXlsx(datasets: Dataset[], base: string) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const d of datasets) {
    const ws = XLSX.utils.json_to_sheet(d.linhas);
    const cols = Object.keys(d.linhas[0] ?? {});
    ws["!cols"] = cols.map((c) => ({ wch: Math.max(12, Math.min(42, c.length + 8)) }));
    XLSX.utils.book_append_sheet(wb, ws, d.nome.slice(0, 31));
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${base}-${stamp()}.xlsx`,
  );
}

export function exportPdf() {
  window.print();
}
