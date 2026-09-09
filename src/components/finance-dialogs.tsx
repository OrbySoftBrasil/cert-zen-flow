// Diálogos de criação do módulo financeiro — títulos a pagar e a receber.
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Btn, Field, Modal, SelectInput, TextArea, TextInput } from "@/components/forms";
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
    toast.success("Despesa lançada", {
      description: `${fornecedor} · ${brl(Number(valor))} — aguardando aprovação`,
    });
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
          <TextInput
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            placeholder="Safe Devices BR"
          />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <TextInput
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Tokens A3 — lote 200 un."
          />
        </Field>
        <Field label="Categoria">
          <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {[
              "Repasse à AC raiz",
              "Mídias e tokens",
              "Infraestrutura",
              "Pessoal",
              "Marketing",
              "Impostos",
              "Comissões",
            ].map((c) => (
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
          <TextInput
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />
        </Field>
        <Field label="Valor (R$)">
          <TextInput
            type="number"
            min={0}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="12500"
          />
        </Field>
        <Field label="Método">
          <SelectInput value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)}>
            {["Pix", "Boleto", "TED", "Cartão"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Documento / NF">
          <TextInput
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="NF-e 45011"
          />
        </Field>
        <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
          <input
            type="checkbox"
            checked={recorrente}
            onChange={(e) => setRecorrente(e.target.checked)}
          />
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
          <TextInput
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="e-CNPJ A1 + validação remota"
          />
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
          <TextInput
            type="number"
            min={0}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="1890"
          />
        </Field>
        <Field label="Parcelas" hint="Uma parcela por mês a partir do vencimento">
          <TextInput
            type="number"
            min={1}
            max={12}
            value={parcelas}
            onChange={(e) => setParcelas(e.target.value)}
          />
        </Field>
        <Field label="1º vencimento" className="sm:col-span-2">
          <TextInput
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />
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

// ------------------------- Planos, contratos e regras ------------------------

export function NovoPlanoDialog({
  open,
  onClose,
  planoId,
}: {
  open: boolean;
  onClose: () => void;
  planoId?: string;
}) {
  const { planos, addPlano, updatePlano } = useStore();
  const atual = planos.find((p) => p.id === planoId);
  const [nome, setNome] = useState(atual?.nome ?? "");
  const [publico, setPublico] = useState(atual?.publico ?? "");
  const [preco, setPreco] = useState(String(atual?.preco ?? ""));
  const [ciclo, setCiclo] = useState<"mensal" | "anual" | "pacote">(atual?.ciclo ?? "anual");
  const [inclui, setInclui] = useState((atual?.inclui ?? []).join("\n"));
  const [margem, setMargem] = useState(String(atual?.margem ?? 45));
  const [destaque, setDestaque] = useState(!!atual?.destaque);

  const valido = nome.trim().length > 1 && publico.trim().length > 1 && Number(preco) >= 0;

  function salvar() {
    if (!valido) return;
    const dados = {
      nome: nome.trim(),
      publico: publico.trim(),
      preco: Number(preco),
      ciclo,
      inclui: inclui
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      margem: Number(margem) || 0,
      destaque,
    };
    if (atual) {
      updatePlano(atual.id, dados);
      toast.success("Plano atualizado", { description: nome });
    } else {
      addPlano({ ...dados, assinantes: 0, mrr: 0, churn: 0 });
      toast.success("Plano criado", {
        description: `${nome} · ${brl(Number(preco))} por ${ciclo}`,
      });
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={atual ? "Editar plano" : "Novo plano"}
      hint="Catálogo de assinaturas e pacotes comercializados"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar} disabled={!valido}>
            {atual ? "Salvar plano" : "Criar plano"}
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do plano">
          <TextInput
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Business"
          />
        </Field>
        <Field label="Público-alvo">
          <TextInput
            value={publico}
            onChange={(e) => setPublico(e.target.value)}
            placeholder="PME com até 20 certificados"
          />
        </Field>
        <Field label="Preço (R$)" hint="Use 0 para planos sem mensalidade">
          <TextInput
            type="number"
            min={0}
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </Field>
        <Field label="Ciclo">
          <SelectInput value={ciclo} onChange={(e) => setCiclo(e.target.value as typeof ciclo)}>
            {["mensal", "anual", "pacote"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Margem de contribuição (%)">
          <TextInput
            type="number"
            min={0}
            max={100}
            value={margem}
            onChange={(e) => setMargem(e.target.value)}
          />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={destaque}
            onChange={(e) => setDestaque(e.target.checked)}
          />
          Destacar como mais vendido
        </label>
        <Field label="Itens inclusos" hint="Um item por linha" className="sm:col-span-2">
          <TextArea
            value={inclui}
            onChange={(e) => setInclui(e.target.value)}
            placeholder={"Até 10 emissões/ano\nAR móvel 2x"}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function NovoPlanoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Novo plano
      </Btn>
      {open && <NovoPlanoDialog open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

export function NovoContratoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { clients, planos, addContrato, addReceber } = useStore();
  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [plano, setPlano] = useState(planos[0]?.nome ?? "");
  const [inicio, setInicio] = useState(hoje());
  const [fim, setFim] = useState(emDias(365));
  const [valorMensal, setValorMensal] = useState("");
  const [reajuste, setReajuste] = useState("IPCA anual");
  const [faturamento, setFaturamento] = useState<"mensal" | "anual" | "por evento">("mensal");
  const [responsavel, setResponsavel] = useState("Marina Duarte");
  const [gerarCobranca, setGerarCobranca] = useState(true);

  const cliente = clients.find((c) => c.id === clienteId);
  const valido = !!cliente && !!plano && Number(valorMensal) > 0;

  function salvar() {
    if (!valido || !cliente) return;
    addContrato({
      cliente: cliente.nome,
      plano,
      inicio,
      fim,
      valorMensal: Number(valorMensal),
      reajuste,
      faturamento,
      status: "ativo",
      responsavel,
      consumo: 0,
    });
    if (gerarCobranca) {
      addReceber({
        cliente: cliente.nome,
        documento: cliente.documento,
        descricao: `Contrato ${plano} — 1ª competência`,
        origem: "Plano",
        emissao: hoje(),
        vencimento: emDias(10),
        valor: Number(valorMensal),
        status: "em aberto",
        metodo: "Boleto",
        parcela: "1/1",
        nf: `NF-${20500 + Math.floor(Math.random() * 400)}`,
      });
    }
    toast.success("Contrato criado", {
      description: `${cliente.nome} · ${plano} — ${brl(Number(valorMensal))}/mês${gerarCobranca ? " + cobrança gerada" : ""}`,
    });
    onClose();
    setValorMensal("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo contrato"
      hint="Vincula o cliente a um plano recorrente e pode gerar a primeira cobrança"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar} disabled={!valido}>
            Criar contrato
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
        <Field label="Plano">
          <SelectInput
            value={plano}
            onChange={(e) => {
              setPlano(e.target.value);
              const p = planos.find((x) => x.nome === e.target.value);
              if (p)
                setValorMensal(
                  String(p.ciclo === "anual" ? Math.round((p.preco / 12) * 100) / 100 : p.preco),
                );
            }}
          >
            {planos.map((p) => (
              <option key={p.id}>{p.nome}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Valor mensal (R$)">
          <TextInput
            type="number"
            min={0}
            value={valorMensal}
            onChange={(e) => setValorMensal(e.target.value)}
          />
        </Field>
        <Field label="Início">
          <TextInput type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Field>
        <Field label="Fim da vigência">
          <TextInput type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </Field>
        <Field label="Faturamento">
          <SelectInput
            value={faturamento}
            onChange={(e) => setFaturamento(e.target.value as typeof faturamento)}
          >
            {["mensal", "anual", "por evento"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Reajuste">
          <SelectInput value={reajuste} onChange={(e) => setReajuste(e.target.value)}>
            {["IPCA anual", "IGP-M anual", "Sem reajuste (ata)", "Comissionado"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Responsável comercial" className="sm:col-span-2">
          <SelectInput value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            {["Marina Duarte", "Diego Nunes", "Rafael Bastos"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </SelectInput>
        </Field>
        <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
          <input
            type="checkbox"
            checked={gerarCobranca}
            onChange={(e) => setGerarCobranca(e.target.checked)}
          />
          Gerar automaticamente o primeiro título a receber
        </label>
      </div>
    </Modal>
  );
}

export function NovoContratoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn variant="ghost" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Novo contrato
      </Btn>
      {open && <NovoContratoDialog open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

export function RegraComissaoDialog({
  open,
  onClose,
  regraId,
}: {
  open: boolean;
  onClose: () => void;
  regraId?: string;
}) {
  const { regrasComissao, addRegraComissao, updateRegraComissao } = useStore();
  const atual = regrasComissao.find((r) => r.id === regraId);
  const [nome, setNome] = useState(atual?.nome ?? "");
  const [percentual, setPercentual] = useState(String(atual?.percentual ?? 10));
  const [regra, setRegra] = useState(atual?.regra ?? "");
  const [gatilho, setGatilho] = useState(atual?.gatilho ?? "Pagamento confirmado");
  const [carencia, setCarencia] = useState(atual?.carencia ?? "30 dias");
  const [teto, setTeto] = useState(atual?.teto ?? "Sem teto");

  const valido = nome.trim().length > 1;

  function salvar() {
    if (!valido) return;
    const dados = {
      nome: nome.trim(),
      percentual: Number(percentual) || 0,
      regra: regra.trim() || `${percentual}% sobre a receita líquida`,
      gatilho,
      carencia,
      teto,
      ativa: true,
    };
    if (atual) {
      updateRegraComissao(atual.id, dados);
      toast.success("Regra atualizada", { description: nome });
    } else {
      addRegraComissao(dados);
      toast.success("Regra de comissão criada", { description: `${nome} · ${percentual}%` });
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={atual ? "Editar regra de comissão" : "Nova regra de comissão"}
      hint="Define percentual, gatilho de apuração, carência e teto"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar} disabled={!valido}>
            Salvar regra
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome da regra">
          <TextInput
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Parceiro contábil"
          />
        </Field>
        <Field label="Percentual (%)">
          <TextInput
            type="number"
            min={0}
            max={100}
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
          />
        </Field>
        <Field label="Descrição do cálculo" className="sm:col-span-2">
          <TextInput
            value={regra}
            onChange={(e) => setRegra(e.target.value)}
            placeholder="18% sobre a receita líquida da emissão"
          />
        </Field>
        <Field label="Gatilho de apuração">
          <SelectInput value={gatilho} onChange={(e) => setGatilho(e.target.value)}>
            {[
              "Pagamento confirmado",
              "Emissão concluída",
              "Liquidação financeira",
              "1ª emissão do indicado",
              "Evento de estorno",
            ].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Carência">
          <SelectInput value={carencia} onChange={(e) => setCarencia(e.target.value)}>
            {["Imediato", "15 dias", "30 dias", "Fecha no dia 5", "—"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Teto" className="sm:col-span-2">
          <TextInput
            value={teto}
            onChange={(e) => setTeto(e.target.value)}
            placeholder="Sem teto"
          />
        </Field>
      </div>
    </Modal>
  );
}
