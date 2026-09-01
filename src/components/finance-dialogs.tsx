// Diálogos de criação do módulo financeiro — títulos a pagar e a receber.
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Btn, Field, Modal, SelectInput, TextInput } from "@/components/forms";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/mock-data";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}
function emDias(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function NovaDespesaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPagar } = useStore();
  const [fornecedor, setFornecedor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Mídias e tokens");
  const [centroCusto, setCentroCusto] = useState("Emissão / AR");
  const [vencimento, setVencimento] = useState(emDias(15));
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState<"Pix" | "Boleto" | "TED" | "Cartão">("Boleto");
  const [recorrente, setRecorrente] = useState(false);
  const [documento, setDocumento] = useState("");

  const valido = fornecedor.trim() && descricao.trim() && Number(valor) > 0;

  function salvar() {
    if (!valido) return;
    addPagar({
      fornecedor: fornecedor.trim(),
      descricao: descricao.trim(),
      categoria,
      centroCusto,
      emissao: hoje(),
      vencimento,
      valor: Number(valor),
      status: "em aberto",
      metodo,
      recorrente,
      aprovacao: "pendente",
      documento: documento.trim() || "sem documento",
    });
    toast.success("Despesa lançada", { description: `${fornecedor} · ${brl(Number(valor))} — aguardando aprovação` });
    onClose();
    setFornecedor("");
    setDescricao("");
    setValor("");
    setDocumento("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova despesa"
      hint="Entra na fila de aprovação de contas a pagar"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar} disabled={!valido}>
            Lançar despesa
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fornecedor" className="sm:col-span-2">
          <TextInput value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Safe Devices BR" />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Tokens A3 — lote 200 un." />
        </Field>
        <Field label="Categoria">
          <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {["Repasse à AC raiz", "Mídias e tokens", "Infraestrutura", "Pessoal", "Marketing", "Impostos", "Comissões"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Centro de custo">
          <SelectInput value={centroCusto} onChange={(e) => setCentroCusto(e.target.value)}>
            {["Emissão / AR", "Comercial", "Suporte", "Tecnologia", "Administrativo"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Vencimento">
          <TextInput type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </Field>
        <Field label="Valor (R$)">
          <TextInput type="number" min={0} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="12500" />
        </Field>
        <Field label="Método">
          <SelectInput value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)}>
            {["Pix", "Boleto", "TED", "Cartão"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Documento / NF">
          <TextInput value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="NF-e 45011" />
        </Field>
        <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
          Despesa recorrente (replicar nos próximos meses)
        </label>
      </div>
    </Modal>
  );
}

export function NovaDespesaButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nova despesa
      </Btn>
      <NovaDespesaDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function NovaCobrancaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients, addReceber } = useStore();
  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [origem, setOrigem] = useState<"Emissão" | "Renovação" | "Plano" | "Serviço">("Emissão");
  const [vencimento, setVencimento] = useState(emDias(7));
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState<"Pix" | "Boleto" | "Cartão" | "TED">("Pix");
  const [parcelas, setParcelas] = useState("1");

  const cliente = clients.find((c) => c.id === clienteId);
  const valido = !!cliente && descricao.trim() && Number(valor) > 0;

  function salvar() {
    if (!valido || !cliente) return;
    const n = Math.max(1, Number(parcelas));
    const parcela = Number(valor) / n;
    for (let i = 0; i < n; i++) {
      const venc = new Date(vencimento);
      venc.setMonth(venc.getMonth() + i);
      addReceber({
        cliente: cliente.nome,
        documento: cliente.documento,
        descricao: descricao.trim(),
        origem,
        emissao: hoje(),
        vencimento: venc.toISOString().slice(0, 10),
        valor: Math.round(parcela * 100) / 100,
        status: "em aberto",
        metodo,
        parcela: `${i + 1}/${n}`,
        nf: `NF-${20500 + Math.floor(Math.random() * 400)}`,
      });
    }
    toast.success("Cobrança emitida", {
      description: `${cliente.nome} · ${brl(Number(valor))} em ${n}x — link de pagamento enviado`,
    });
    onClose();
    setDescricao("");
    setValor("");
    setParcelas("1");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Emitir cobrança"
      hint="Gera título a receber e dispara link de pagamento ao cliente"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar} disabled={!valido}>
            Emitir cobrança
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cliente" className="sm:col-span-2">
          <SelectInput value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.documento}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="e-CNPJ A1 + validação remota" />
        </Field>
        <Field label="Origem">
          <SelectInput value={origem} onChange={(e) => setOrigem(e.target.value as typeof origem)}>
            {["Emissão", "Renovação", "Plano", "Serviço"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Método">
          <SelectInput value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)}>
            {["Pix", "Boleto", "Cartão", "TED"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Valor total (R$)">
          <TextInput type="number" min={0} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1890" />
        </Field>
        <Field label="Parcelas" hint="Uma parcela por mês a partir do vencimento">
          <TextInput type="number" min={1} max={12} value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
        </Field>
        <Field label="1º vencimento" className="sm:col-span-2">
          <TextInput type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export function NovaCobrancaButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Emitir cobrança
      </Btn>
      <NovaCobrancaDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
