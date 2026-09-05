// Primitivas compartilhadas da configuração de "Operação & perfis".
// Editor de checklist completo (criar, renomear, marcar obrigatório, reordenar
// e remover) usado tanto nas etapas quanto nos subfluxos.
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Btn, Field, SelectInput, TextInput } from "@/components/forms";
import {
  ACOES_PRODUTO,
  CATEGORIAS_DOC,
  DERIVADOS,
  ESCOPOS,
  MODOS,
  modoInfo,
} from "@/lib/checklist-model";
import { novoItemChecklist, type Canal, type ItemChecklist } from "@/lib/opconfig-model";
import { cn } from "@/lib/utils";

export const CANAIS: { id: Canal; label: string }[] = [
  { id: "email", label: "E-mail" },
  { id: "push", label: "Push" },
  { id: "whatsapp", label: "WhatsApp" },
];

export function CanaisPicker({
  value,
  onChange,
  disabled,
}: {
  value: Canal[];
  onChange: (v: Canal[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CANAIS.map((c) => {
        const on = value.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])}
            className={cn(
              "rounded border px-2 py-1 text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50",
              on ? "border-primary bg-primary-soft text-primary-deep" : "border-border text-muted-foreground hover:border-border-strong",
            )}
          >
            {on ? "✓ " : ""}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/** Editor completo de checklist. É aqui que os itens são criados. */
export function ChecklistEditor({
  itens,
  onChange,
  disabled,
  titulo = "Checklist",
  hint,
  placeholder = "Ex.: Conferir validade do documento",
}: {
  itens: ItemChecklist[];
  onChange: (v: ItemChecklist[]) => void;
  disabled?: boolean;
  titulo?: string;
  hint?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const obrigatorios = itens.filter((i) => i.obrigatorio).length;

  const mover = (id: string, dir: -1 | 1) => {
    const i = itens.findIndex((x) => x.id === id);
    const alvo = i + dir;
    if (i < 0 || alvo < 0 || alvo >= itens.length) return;
    const copia = [...itens];
    const [it] = copia.splice(i, 1);
    if (it) copia.splice(alvo, 0, it);
    onChange(copia);
  };

  return (
    <section className="rounded-lg border border-border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold">{titulo}</p>
          <p className="text-[11px] text-muted-foreground">
            {hint ?? "Itens obrigatórios travam o avanço da etapa; opcionais só orientam o operador."}
          </p>
        </div>
        <span className="tabular shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {itens.length} itens · {obrigatorios} obrigatórios
        </span>
      </header>

      <ul className="divide-y divide-border">
        {itens.length === 0 && (
          <li className="px-3 py-4 text-center text-xs text-muted-foreground">
            Nenhum item ainda. Escreva abaixo e pressione Enter para criar o primeiro.
          </li>
        )}
        {itens.map((c, i) => (
          <li key={c.id} className="px-3 py-2">
            <div className="flex items-center gap-2">
            <span className="tabular w-5 shrink-0 text-[11px] text-muted-foreground">{i + 1}.</span>
            <TextInput
              value={c.label}
              disabled={disabled}
              aria-label={`Texto do item ${i + 1}`}
              onChange={(e) => onChange(itens.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))}
            />
            <button
              type="button"
              disabled={disabled}
              aria-pressed={c.obrigatorio}
              onClick={() => onChange(itens.map((x) => (x.id === c.id ? { ...x, obrigatorio: !x.obrigatorio } : x)))}
              className={cn(
                "shrink-0 rounded border px-1.5 py-1 text-[11px] transition-colors disabled:opacity-50",
                c.obrigatorio ? "border-primary bg-primary-soft text-primary-deep" : "border-border text-muted-foreground",
              )}
            >
              {c.obrigatorio ? "Obrigatório" : "Opcional"}
            </button>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                disabled={disabled || i === 0}
                aria-label={`Mover “${c.label}” para cima`}
                onClick={() => mover(c.id, -1)}
                className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || i === itens.length - 1}
                aria-label={`Mover “${c.label}” para baixo`}
                onClick={() => mover(c.id, 1)}
                className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button
                type="button"
                aria-expanded={aberto === c.id}
                aria-label={`Configurar “${c.label}”`}
                onClick={() => setAberto(aberto === c.id ? null : c.id)}
                className={cn(
                  "grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground",
                  aberto === c.id && "bg-primary-soft text-primary-deep",
                )}
              >
                <Settings2 className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remover “${c.label}”`}
                onClick={() => onChange(itens.filter((x) => x.id !== c.id))}
                className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-alert disabled:opacity-25"
              >
                <Trash2 className="size-3.5" />
              </button>
              </div>
            </div>
            <p className="mt-1 pl-7 text-[11px] text-muted-foreground">
              {modoInfo(c.modo).nome} · escopo {ESCOPOS.find((e) => e.id === c.escopo)?.nome ?? "Caso"}
              {c.bloqueia ? ` · bloqueia: ${c.bloqueia}` : " · não bloqueia nenhuma ação"}
            </p>
            {aberto === c.id && (
              <ConfigItem
                item={c}
                disabled={disabled}
                onChange={(patch) =>
                  onChange(itens.map((x) => (x.id === c.id ? ({ ...x, ...patch } as ItemChecklist) : x)))
                }
              />
            )}
          </li>
        ))}
      </ul>

      <form
        className="flex items-center gap-2 border-t border-border px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          if (!v) return;
          onChange([...itens, novoItemChecklist(v)]);
          setDraft("");
        }}
      >
        <TextInput
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Novo item de checklist"
          placeholder={placeholder}
        />
        <Btn variant="ghost" type="submit" disabled={disabled || !draft.trim()} className="shrink-0">
          <Plus className="size-4" /> Adicionar
        </Btn>
      </form>
    </section>
  );
}

type PatchItem = { [K in keyof ItemChecklist]?: ItemChecklist[K] | undefined };

/** Configuração explícita do item: “Como este item é cumprido?”. */
function ConfigItem({
  item,
  disabled,
  onChange,
}: {
  item: ItemChecklist;
  disabled?: boolean | undefined;
  onChange: (patch: PatchItem) => void;
}) {
  return (
    <div className="mt-2 space-y-3 rounded-md border border-border bg-muted/40 p-3">
      <Field
        label="Como este item é cumprido?"
        hint="Escolha explícita. Renomear o item não muda o comportamento."
      >
        <SelectInput
          value={item.modo}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              modo: e.target.value as ItemChecklist["modo"],
              categoriaDoc: undefined,
              chaveDerivada: undefined,
              acaoProduto: undefined,
            })
          }
        >
          {MODOS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </SelectInput>
      </Field>
      <p className="text-[11px] text-muted-foreground">{modoInfo(item.modo).descricao}</p>

      {item.modo === "documento" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Categoria documental exigida">
            <SelectInput
              value={item.categoriaDoc ?? "identidade"}
              disabled={disabled}
              onChange={(e) => onChange({ categoriaDoc: e.target.value as ItemChecklist["categoriaDoc"] })}
            >
              {CATEGORIAS_DOC.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Validade máxima da evidência (dias)">
            <TextInput
              inputMode="numeric"
              disabled={disabled}
              value={String(item.validadeDias ?? "")}
              placeholder="Padrão da categoria"
              onChange={(e) =>
                onChange({
                  validadeDias: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </Field>
          <Field label="Política de reutilização">
            <SelectInput
              value={item.reutilizacao}
              disabled={disabled}
              onChange={(e) => onChange({ reutilizacao: e.target.value as ItemChecklist["reutilizacao"] })}
            >
              <option value="permitida">Reaproveitar documento válido existente</option>
              <option value="vedada">Sempre exigir nova versão</option>
            </SelectInput>
          </Field>
        </div>
      )}

      {item.modo === "derivado" && (
        <Field label="Registro do sistema que satisfaz o item">
          <SelectInput
            value={item.chaveDerivada ?? "pagamento"}
            disabled={disabled}
            onChange={(e) => onChange({ chaveDerivada: e.target.value as ItemChecklist["chaveDerivada"] })}
          >
            {DERIVADOS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}

      {item.modo === "acao" && (
        <Field label="Ação estruturada do produto">
          <SelectInput
            value={item.acaoProduto ?? "registrar-consulta"}
            disabled={disabled}
            onChange={(e) => onChange({ acaoProduto: e.target.value as ItemChecklist["acaoProduto"] })}
          >
            {ACOES_PRODUTO.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}

      {item.modo === "confirmacao" && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            disabled={disabled}
            checked={item.observacaoObrigatoria === true}
            onChange={(e) => onChange({ observacaoObrigatoria: e.target.checked })}
          />
          Exigir observação na confirmação
        </label>
      )}

      {item.modo === "decisao" && (
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              disabled={disabled}
              checked={item.exigeAprovacao === true}
              onChange={(e) => onChange({ exigeAprovacao: e.target.checked })}
            />
            Exigir alçada de aprovação
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              disabled={disabled}
              checked={item.exigeSegundoOperador === true}
              onChange={(e) => onChange({ exigeSegundoOperador: e.target.checked })}
            />
            Exigir segundo operador
          </label>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Escopo do requisito">
          <SelectInput
            value={item.escopo}
            disabled={disabled}
            onChange={(e) => onChange({ escopo: e.target.value as ItemChecklist["escopo"] })}
          >
            {ESCOPOS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          label="Ação bloqueada enquanto pendente"
          hint="Vazio = não bloqueia nada."
        >
          <SelectInput
            value={item.bloqueia ?? ""}
            disabled={disabled || item.modo === "orientacao"}
            onChange={(e) => onChange({ bloqueia: e.target.value || undefined })}
          >
            <option value="">Não bloqueia</option>
            <option>Enviar dossiê para verificação</option>
            <option>Aprovar emissão</option>
            <option>Registrar emissão manual</option>
            <option>Liberar entrega</option>
            <option>Concluir o caso</option>
          </SelectInput>
        </Field>
        <Field label="Origem da regra">
          <SelectInput
            value={item.origemItem}
            disabled={disabled}
            onChange={(e) => onChange({ origemItem: e.target.value as ItemChecklist["origemItem"] })}
          >
            <option value="plataforma">Plataforma</option>
            <option value="ac">AC</option>
            <option value="tenant">Tenant (esta AR)</option>
          </SelectInput>
        </Field>
      </div>
    </div>
  );
}
