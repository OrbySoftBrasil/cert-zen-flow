// Formulários de criação compartilhados entre os módulos.
// Cada um grava no estado global (src/lib/store.tsx) e devolve feedback via toast.
import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, LifeBuoy, Plus, UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Btn, Field, Modal, SelectInput, TextArea, TextInput } from "@/components/forms";
import {
  agents,
  ticketCategorias,
  type CertType,
  type Channel,
  type Priority,
  type TicketCategoria,
} from "@/lib/mock-data";
import { useStore } from "@/lib/store";

const tiposCert: CertType[] = ["e-CPF A1", "e-CPF A3", "e-CNPJ A1", "e-CNPJ A3", "Nuvem PJ"];
const canais: Channel[] = ["WhatsApp", "Site", "Parceiro", "Telefone", "E-mail"];
const prioridades: Priority[] = ["baixa", "normal", "alta", "critica"];
const valorSugerido: Record<CertType, number> = {
  "e-CPF A1": 179,
  "e-CPF A3": 289,
  "e-CNPJ A1": 289,
  "e-CNPJ A3": 389,
  "Nuvem PJ": 429,
};

export function TriggerButton({
  onClick,
  children,
  icon: Icon = Plus,
  variant = "primary",
}: {
  onClick: () => void;
  children: ReactNode;
  icon?: typeof Plus;
  variant?: "primary" | "ghost";
}) {
  return (
    <Btn variant={variant} onClick={onClick}>
      <Icon className="size-3.5" /> {children}
    </Btn>
  );
}

/* ------------------------------ Nova solicitação ------------------------------ */

export function NovaSolicitacaoDialog({
  open,
  onClose,
  clienteId,
}: {
  open: boolean;
  onClose: () => void;
  clienteId?: string;
}) {
  const { clients, addRequest } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clienteId: clienteId ?? "",
    tipo: "e-CPF A1" as CertType,
    valor: 179,
    canal: "Site" as Channel,
    prioridade: "normal" as Priority,
    responsavelId: agents[0]!.id,
    slaHoras: 24,
    observacao: "",
  });
  const [erro, setErro] = useState("");

  function salvar() {
    if (!form.clienteId) return setErro("Selecione o cliente titular.");
    const nova = addRequest({ ...form, valor: Number(form.valor) || 0 });
    toast.success(`Solicitação ${nova.protocolo} criada`, { description: `${nova.cliente} · ${nova.tipo}` });
    onClose();
    navigate({ to: "/solicitacoes/$id", params: { id: nova.id } });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova solicitação de certificado"
      hint="Entra no Kanban na etapa Novo pedido, com checklist e SLA."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar}>Criar solicitação</Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cliente titular" className="sm:col-span-2" {...(erro ? { error: erro } : {})}>
          <SelectInput
            value={form.clienteId}
            onChange={(e) => {
              setErro("");
              setForm({ ...form, clienteId: e.target.value });
            }}
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.documento}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Tipo de certificado">
          <SelectInput
            value={form.tipo}
            onChange={(e) => {
              const tipo = e.target.value as CertType;
              setForm({ ...form, tipo, valor: valorSugerido[tipo] });
            }}
          >
            {tiposCert.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Valor (R$)">
          <TextInput
            type="number"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
          />
        </Field>
        <Field label="Canal de origem">
          <SelectInput value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value as Channel })}>
            {canais.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Prioridade">
          <SelectInput
            value={form.prioridade}
            onChange={(e) => setForm({ ...form, prioridade: e.target.value as Priority })}
          >
            {prioridades.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Responsável">
          <SelectInput value={form.responsavelId} onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} — {a.papel}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="SLA (horas)">
          <TextInput
            type="number"
            value={form.slaHoras}
            onChange={(e) => setForm({ ...form, slaHoras: Number(e.target.value) })}
          />
        </Field>
        <Field label="Observação de abertura" className="sm:col-span-2">
          <TextArea
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            placeholder="Contexto do pedido, exigências do titular, combinações comerciais…"
          />
        </Field>
      </div>
    </Modal>
  );
}

export function NovaSolicitacaoButton({ clienteId, variant }: { clienteId?: string; variant?: "primary" | "ghost" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)} {...(variant ? { variant } : {})}>
        Nova solicitação
      </TriggerButton>
      <NovaSolicitacaoDialog open={open} onClose={() => setOpen(false)} {...(clienteId ? { clienteId } : {})} />
    </>
  );
}

/* --------------------------------- Novo cliente -------------------------------- */

export function NovoClienteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addClient } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    documento: "",
    tipoPessoa: "PJ" as "PF" | "PJ",
    email: "",
    telefone: "",
    cidade: "",
    gestor: agents[0]!.nome,
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  function salvar() {
    const e: Record<string, string> = {};
    if (form.nome.trim().length < 3) e.nome = "Informe o nome ou razão social.";
    if (form.documento.trim().length < 11) e.documento = "Informe um CPF ou CNPJ válido.";
    if (!/.+@.+\..+/.test(form.email)) e.email = "E-mail inválido.";
    setErros(e);
    if (Object.keys(e).length) return;
    const c = addClient(form);
    toast.success("Cliente cadastrado", { description: c.nome });
    onClose();
    navigate({ to: "/clientes/$id", params: { id: c.id } });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cliente"
      hint="Abre o dossiê 360º logo após o cadastro."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar}>Cadastrar cliente</Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome / razão social" className="sm:col-span-2" {...(erros.nome ? { error: erros.nome } : {})}>
          <TextInput value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label="Tipo de pessoa">
          <SelectInput
            value={form.tipoPessoa}
            onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value as "PF" | "PJ" })}
          >
            <option value="PJ">Pessoa jurídica</option>
            <option value="PF">Pessoa física</option>
          </SelectInput>
        </Field>
        <Field label="CPF / CNPJ" {...(erros.documento ? { error: erros.documento } : {})}>
          <TextInput value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
        </Field>
        <Field label="E-mail" {...(erros.email ? { error: erros.email } : {})}>
          <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <TextInput value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </Field>
        <Field label="Cidade">
          <TextInput value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
        </Field>
        <Field label="Gestor da conta">
          <SelectInput value={form.gestor} onChange={(e) => setForm({ ...form, gestor: e.target.value })}>
            {agents.map((a) => (
              <option key={a.id}>{a.nome}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </Modal>
  );
}

export function NovoClienteButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton icon={UserPlus} onClick={() => setOpen(true)}>
        Novo cliente
      </TriggerButton>
      <NovoClienteDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/* -------------------------------- Novo chamado -------------------------------- */

export function NovoChamadoDialog({
  open,
  onClose,
  clienteId,
}: {
  open: boolean;
  onClose: () => void;
  clienteId?: string;
}) {
  const { clients, addTicket } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clienteId: clienteId ?? "",
    assunto: "",
    categoria: "Instalação e uso" as TicketCategoria,
    subcategoria: ticketCategorias[0]!.sub[0]!,
    canal: "Telefone" as Channel,
    prioridade: "normal" as Priority,
    responsavelId: agents[3]?.id ?? agents[0]!.id,
    descricao: "",
  });
  const [erro, setErro] = useState("");
  const subs = ticketCategorias.find((c) => c.nome === form.categoria)?.sub ?? [];

  function salvar() {
    if (!form.clienteId) return setErro("Selecione o cliente.");
    if (form.assunto.trim().length < 4) return setErro("Descreva o assunto do chamado.");
    const t = addTicket(form);
    toast.success(`Chamado ${t.numero} aberto`, { description: t.assunto });
    onClose();
    navigate({ to: "/chamados/$id", params: { id: t.id } });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Abrir chamado interno"
      hint="Registro manual de atendimento recebido por telefone, e-mail ou parceiro."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar}>Abrir chamado</Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cliente" className="sm:col-span-2" {...(erro ? { error: erro } : {})}>
          <SelectInput
            value={form.clienteId}
            onChange={(e) => {
              setErro("");
              setForm({ ...form, clienteId: e.target.value });
            }}
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Assunto" className="sm:col-span-2">
          <TextInput value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <SelectInput
            value={form.categoria}
            onChange={(e) => {
              const categoria = e.target.value as TicketCategoria;
              const sub = ticketCategorias.find((c) => c.nome === categoria)?.sub[0] ?? "";
              setForm({ ...form, categoria, subcategoria: sub });
            }}
          >
            {ticketCategorias.map((c) => (
              <option key={c.nome}>{c.nome}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Subcategoria">
          <SelectInput value={form.subcategoria} onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}>
            {subs.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Canal">
          <SelectInput value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value as Channel })}>
            {canais.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Prioridade">
          <SelectInput
            value={form.prioridade}
            onChange={(e) => setForm({ ...form, prioridade: e.target.value as Priority })}
          >
            {prioridades.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Responsável" className="sm:col-span-2">
          <SelectInput value={form.responsavelId} onChange={(e) => setForm({ ...form, responsavelId: e.target.value })}>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} — {a.papel}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Relato do cliente" className="sm:col-span-2">
          <TextArea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

export function NovoChamadoButton({ clienteId }: { clienteId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton icon={LifeBuoy} onClick={() => setOpen(true)}>
        Novo chamado
      </TriggerButton>
      <NovoChamadoDialog open={open} onClose={() => setOpen(false)} {...(clienteId ? { clienteId } : {})} />
    </>
  );
}

/* ------------------------------ Novo agendamento ------------------------------ */

export function NovoAgendamentoDialog({
  open,
  onClose,
  diaInicial,
  clienteId,
  onCriado,
}: {
  open: boolean;
  onClose: () => void;
  diaInicial?: string;
  clienteId?: string;
  onCriado?: (id: string) => void;
}) {
  const { clients, addAppointment } = useStore();
  const [form, setForm] = useState({
    clienteId: clienteId ?? "",
    tipo: "e-CPF A1" as CertType,
    agenteId: agents[0]!.id,
    dia: diaInicial ?? new Date().toISOString().slice(0, 10),
    hora: "09:00",
    duracaoMin: 30,
    sala: "Sala virtual 1",
  });
  const [erro, setErro] = useState("");

  function salvar() {
    if (!form.clienteId) return setErro("Selecione o cliente.");
    const a = addAppointment(form);
    toast.success("Agendamento criado", { description: `${a.cliente} · ${a.dia} às ${a.hora}` });
    onCriado?.(a.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo agendamento"
      hint="Videoconferência de validação presencial remota."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar}>Agendar</Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cliente" className="sm:col-span-2" {...(erro ? { error: erro } : {})}>
          <SelectInput
            value={form.clienteId}
            onChange={(e) => {
              setErro("");
              setForm({ ...form, clienteId: e.target.value });
            }}
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Tipo de certificado">
          <SelectInput value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as CertType })}>
            {tiposCert.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Agente responsável">
          <SelectInput value={form.agenteId} onChange={(e) => setForm({ ...form, agenteId: e.target.value })}>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Data">
          <TextInput type="date" value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} />
        </Field>
        <Field label="Hora">
          <TextInput type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
        </Field>
        <Field label="Duração (min)">
          <SelectInput
            value={form.duracaoMin}
            onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })}
          >
            {[15, 30, 45, 60].map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Sala">
          <SelectInput value={form.sala} onChange={(e) => setForm({ ...form, sala: e.target.value })}>
            {["Sala virtual 1", "Sala virtual 2", "Sala virtual 3", "Unidade Centro", "AR móvel"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </Modal>
  );
}

export function NovoAgendamentoButton({ diaInicial }: { diaInicial?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton icon={CalendarPlus} onClick={() => setOpen(true)}>
        Novo agendamento
      </TriggerButton>
      <NovoAgendamentoDialog
        open={open}
        onClose={() => setOpen(false)}
        {...(diaInicial ? { diaInicial } : {})}
      />
    </>
  );
}

/* ------------------------------- Novo contador -------------------------------- */

export function NovoContadorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addContador } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    razaoSocial: "",
    cnpj: "",
    crc: "",
    responsavel: "",
    email: "",
    telefone: "",
    cidade: "",
    gestor: agents[1]?.nome ?? agents[0]!.nome,
    comissaoPercentual: 15,
    metaMes: 20,
  });
  const [erros, setErros] = useState<Record<string, string>>({});

  function salvar() {
    const e: Record<string, string> = {};
    if (form.nome.trim().length < 3) e.nome = "Informe o nome do escritório.";
    if (form.cnpj.trim().length < 11) e.cnpj = "Informe o CNPJ.";
    if (!/.+@.+\..+/.test(form.email)) e.email = "E-mail inválido.";
    setErros(e);
    if (Object.keys(e).length) return;
    const c = addContador({ ...form, razaoSocial: form.razaoSocial || form.nome });
    toast.success("Parceiro em credenciamento", { description: c.nome });
    onClose();
    navigate({ to: "/contadores/$id", params: { id: c.id } });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Credenciar contador parceiro"
      hint="O parceiro entra com status em credenciamento e checklist de documentos."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={salvar}>Iniciar credenciamento</Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do escritório" {...(erros.nome ? { error: erros.nome } : {})}>
          <TextInput value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <Field label="Razão social">
          <TextInput value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
        </Field>
        <Field label="CNPJ" {...(erros.cnpj ? { error: erros.cnpj } : {})}>
          <TextInput value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
        </Field>
        <Field label="Registro CRC">
          <TextInput value={form.crc} onChange={(e) => setForm({ ...form, crc: e.target.value })} />
        </Field>
        <Field label="Responsável">
          <TextInput value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
        </Field>
        <Field label="E-mail" {...(erros.email ? { error: erros.email } : {})}>
          <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <TextInput value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </Field>
        <Field label="Cidade">
          <TextInput value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
        </Field>
        <Field label="Comissão (%)">
          <TextInput
            type="number"
            value={form.comissaoPercentual}
            onChange={(e) => setForm({ ...form, comissaoPercentual: Number(e.target.value) })}
          />
        </Field>
        <Field label="Meta mensal (emissões)">
          <TextInput
            type="number"
            value={form.metaMes}
            onChange={(e) => setForm({ ...form, metaMes: Number(e.target.value) })}
          />
        </Field>
        <Field label="Gestor responsável" className="sm:col-span-2">
          <SelectInput value={form.gestor} onChange={(e) => setForm({ ...form, gestor: e.target.value })}>
            {agents.map((a) => (
              <option key={a.id}>{a.nome}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </Modal>
  );
}

export function NovoContadorButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton icon={UserPlus} onClick={() => setOpen(true)}>
        Credenciar parceiro
      </TriggerButton>
      <NovoContadorDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
