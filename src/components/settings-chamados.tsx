// Configurações de atendimento: classificações de chamado e base de conhecimento.
import { Download, FileText, Plus, Tags, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Btn, Field, SelectInput, TextArea, TextInput } from "@/components/forms";
import { Grid, TagList, Toggle } from "@/components/settings-kit";
import { Chip, Panel } from "@/components/ui-kit";
import { Paginacao, usePaginacao } from "@/components/pagination";
import {
  useSettings,
  type ClassificacaoChamado,
  type DocumentoConhecimento,
  type PrioridadeChamado,
} from "@/lib/settings-store";

const prioridades: PrioridadeChamado[] = ["baixa", "normal", "alta", "critica"];

function uid(p: string) {
  return `${p}${Math.random().toString(36).slice(2, 8)}`;
}

export function SecaoClassificacoes() {
  const { settings, replace } = useSettings();
  const lista = settings.classificacoes;
  const papeis = settings.papeis.map((p) => p.nome);
  const [aberta, setAberta] = useState<string | null>(lista[0]?.id ?? null);
  const [novoNome, setNovoNome] = useState("");

  function patch(id: string, p: Partial<ClassificacaoChamado>) {
    replace(
      "classificacoes",
      lista.map((c) => (c.id === id ? { ...c, ...p } : c)),
    );
  }

  function criar() {
    const nome = novoNome.trim();
    if (!nome) return;
    if (lista.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      toast.error("Já existe uma classificação com esse nome.");
      return;
    }
    const nova: ClassificacaoChamado = {
      id: uid("cl"),
      nome,
      descricao: "",
      subcategorias: [],
      prioridadePadrao: "normal",
      slaRespostaHoras: 4,
      slaResolucaoHoras: 24,
      papelResponsavel: papeis[0] ?? "Atendimento",
      visivelPortal: true,
      ativo: true,
    };
    replace("classificacoes", [...lista, nova]);
    setAberta(nova.id);
    setNovoNome("");
    toast.success("Classificação criada", {
      description: `${nome} já aparece na abertura de chamados.`,
    });
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Classificações de chamado"
        hint="Categorias, subcategorias, prioridade padrão e SLA aplicados na abertura — internos e no portal público."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && criar()}
              placeholder="Nova classificação"
              className="w-48"
            />
            <Btn onClick={criar} disabled={!novoNome.trim()}>
              <Plus className="size-4" /> Criar
            </Btn>
          </div>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-border">
          {lista.map((c) => {
            const expandida = aberta === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setAberta(expandida ? null : c.id)}
                  className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <Tags className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.nome}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {c.subcategorias.length} subcategorias · {c.papelResponsavel}
                    </span>
                  </span>
                  <Chip tone={c.prioridadePadrao === "critica" ? "alert" : "neutral"}>
                    {c.prioridadePadrao}
                  </Chip>
                  <Chip tone="blue">
                    SLA {c.slaRespostaHoras}h / {c.slaResolucaoHoras}h
                  </Chip>
                  {!c.ativo && <Chip tone="outline">inativa</Chip>}
                  {c.visivelPortal && <Chip tone="outline">portal</Chip>}
                </button>

                {expandida && (
                  <div className="space-y-4 border-t border-border bg-muted/30 px-4 py-4">
                    <Grid>
                      <Field label="Nome">
                        <TextInput
                          value={c.nome}
                          onChange={(e) => patch(c.id, { nome: e.target.value })}
                        />
                      </Field>
                      <Field label="Papel responsável">
                        <SelectInput
                          value={c.papelResponsavel}
                          onChange={(e) => patch(c.id, { papelResponsavel: e.target.value })}
                        >
                          {papeis.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </SelectInput>
                      </Field>
                    </Grid>

                    <Field label="Descrição interna">
                      <TextArea
                        value={c.descricao}
                        onChange={(e) => patch(c.id, { descricao: e.target.value })}
                        placeholder="Quando usar esta classificação"
                      />
                    </Field>

                    <Grid cols={3}>
                      <Field label="Prioridade padrão">
                        <SelectInput
                          value={c.prioridadePadrao}
                          onChange={(e) =>
                            patch(c.id, { prioridadePadrao: e.target.value as PrioridadeChamado })
                          }
                        >
                          {prioridades.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </SelectInput>
                      </Field>
                      <Field label="SLA 1ª resposta (h)">
                        <TextInput
                          type="number"
                          min={1}
                          value={c.slaRespostaHoras}
                          onChange={(e) =>
                            patch(c.id, { slaRespostaHoras: Number(e.target.value) })
                          }
                        />
                      </Field>
                      <Field label="SLA resolução (h)">
                        <TextInput
                          type="number"
                          min={1}
                          value={c.slaResolucaoHoras}
                          onChange={(e) =>
                            patch(c.id, { slaResolucaoHoras: Number(e.target.value) })
                          }
                        />
                      </Field>
                    </Grid>

                    <Field
                      label="Subcategorias"
                      hint="Aparecem como assunto específico na abertura do chamado"
                    >
                      <TagList
                        values={c.subcategorias}
                        onChange={(v) => patch(c.id, { subcategorias: v })}
                        placeholder="Adicionar subcategoria e pressionar Enter"
                      />
                    </Field>

                    <div className="divide-y divide-border rounded-md border border-border bg-card px-3">
                      <Toggle
                        checked={c.visivelPortal}
                        onChange={(v) => patch(c.id, { visivelPortal: v })}
                        label="Disponível no portal público"
                        hint="Clientes conseguem escolher esta classificação ao abrir chamado sem login."
                      />
                      <Toggle
                        checked={c.ativo}
                        onChange={(v) => patch(c.id, { ativo: v })}
                        label="Classificação ativa"
                        hint="Inativas somem da abertura, mas continuam nos chamados históricos."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Btn
                        variant="danger"
                        onClick={() => {
                          replace(
                            "classificacoes",
                            lista.filter((x) => x.id !== c.id),
                          );
                          toast.success("Classificação removida");
                        }}
                      >
                        <Trash2 className="size-4" /> Remover classificação
                      </Btn>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

export function SecaoConhecimento() {
  const { settings, replace } = useSettings();
  const docs = settings.conhecimento;
  const classificacoes = settings.classificacoes;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busca, setBusca] = useState("");
  const [classificacao, setClassificacao] = useState(classificacoes[0]?.nome ?? "Outros");
  const [titulo, setTitulo] = useState("");
  const [arquivo, setArquivo] = useState<{
    nome: string;
    formato: string;
    tamanhoKb: number;
  } | null>(null);
  const [publicar, setPublicar] = useState(true);

  const filtrados = docs.filter((d) =>
    `${d.titulo} ${d.classificacao} ${d.arquivo}`.toLowerCase().includes(busca.toLowerCase()),
  );
  const pag = usePaginacao(filtrados, 10);

  function selecionar(file: File | undefined) {
    if (!file) return;
    const partes = file.name.split(".");
    setArquivo({
      nome: file.name,
      formato: (partes.length > 1 ? partes.pop()! : "PDF").toUpperCase(),
      tamanhoKb: Math.max(1, Math.round(file.size / 1024)),
    });
    if (!titulo.trim()) setTitulo(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  }

  function enviar() {
    if (!arquivo || !titulo.trim()) return;
    const novo: DocumentoConhecimento = {
      id: uid("kb"),
      titulo: titulo.trim(),
      classificacao,
      arquivo: arquivo.nome,
      formato: arquivo.formato,
      tamanhoKb: arquivo.tamanhoKb,
      atualizadoEm: new Date().toISOString().slice(0, 10),
      autor: "Você",
      publicadoNoPortal: publicar,
      downloads: 0,
    };
    replace("conhecimento", [novo, ...docs]);
    toast.success("Documento publicado na base", {
      description: `${novo.titulo} · ${novo.formato}`,
    });
    setTitulo("");
    setArquivo(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Enviar documento"
        hint="Suba um material já pronto (PDF, DOCX, PPTX). O arquivo fica disponível para a equipe e, se publicado, no portal do cliente."
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border-strong bg-muted/40 px-4 py-6 text-center transition-colors hover:border-primary"
          >
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {arquivo ? arquivo.nome : "Clique para selecionar o arquivo"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {arquivo
                ? `${arquivo.formato} · ${arquivo.tamanhoKb} KB`
                : "PDF, DOCX, PPTX ou XLSX — até 20 MB"}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            onChange={(e) => selecionar(e.target.files?.[0])}
          />

          <Grid>
            <Field label="Título do documento">
              <TextInput
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Guia de instalação do token"
              />
            </Field>
            <Field label="Classificação">
              <SelectInput value={classificacao} onChange={(e) => setClassificacao(e.target.value)}>
                {classificacoes.map((c) => (
                  <option key={c.id}>{c.nome}</option>
                ))}
              </SelectInput>
            </Field>
          </Grid>

          <div className="rounded-md border border-border px-3">
            <Toggle
              checked={publicar}
              onChange={setPublicar}
              label="Publicar no portal do cliente"
              hint="Documentos não publicados ficam visíveis apenas para a equipe interna."
            />
          </div>

          <div className="flex justify-end">
            <Btn onClick={enviar} disabled={!arquivo || !titulo.trim()}>
              <Upload className="size-4" /> Publicar na base
            </Btn>
          </div>
        </div>
      </Panel>

      <Panel
        title="Base de conhecimento"
        hint={`${docs.length} documentos · ${docs.filter((d) => d.publicadoNoPortal).length} publicados no portal`}
        actions={
          <TextInput
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar documento"
            className="w-52"
          />
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Documento</th>
                <th className="px-3 py-2 font-medium">Classificação</th>
                <th className="px-3 py-2 font-medium">Atualizado</th>
                <th className="px-3 py-2 text-right font-medium">Downloads</th>
                <th className="px-3 py-2 font-medium">Portal</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pag.visiveis.map((d) => (
                <tr key={d.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{d.titulo}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {d.arquivo} · {d.formato} · {d.tamanhoKb} KB · {d.autor}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip>{d.classificacao}</Chip>
                  </td>
                  <td className="tabular px-3 py-2.5 text-xs text-muted-foreground">
                    {d.atualizadoEm}
                  </td>
                  <td className="tabular px-3 py-2.5 text-right text-xs">
                    {d.downloads.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() =>
                        replace(
                          "conhecimento",
                          docs.map((x) =>
                            x.id === d.id ? { ...x, publicadoNoPortal: !x.publicadoNoPortal } : x,
                          ),
                        )
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {d.publicadoNoPortal ? "Publicado" : "Interno"}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => toast.info("Download iniciado", { description: d.arquivo })}
                        aria-label="Baixar"
                        className="grid size-7 place-items-center rounded border border-border text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          replace(
                            "conhecimento",
                            docs.filter((x) => x.id !== d.id),
                          );
                          toast.success("Documento removido da base");
                        }}
                        aria-label="Remover"
                        className="grid size-7 place-items-center rounded border border-border text-muted-foreground hover:border-alert hover:text-alert"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginacao {...pag} rotulo="documentos" />
      </Panel>
    </div>
  );
}
