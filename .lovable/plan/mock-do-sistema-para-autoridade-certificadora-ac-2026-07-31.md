# Mock do Sistema para Autoridade Certificadora (AC)

Protótipo navegável completo, sem backend: todos os dados vêm de um módulo de mock em memória, com estados realistas (SLA estourado, no-show, pendência de documento, etc.). Foco em operação séria — denso, rápido de ler, sem enfeite.

## Direção visual

- Paleta somente branco + azul: fundo branco/off-white, azul institucional profundo como cor primária, azul claro para superfícies e destaques. Cinzas neutros frios apenas para texto secundário e bordas.
- Semáforo operacional feito com intensidade de azul + ícones e padrões (borda, preenchimento, hachura), não com verde/vermelho — exceto um único tom de alerta discreto para SLA estourado.
- Tipografia: sans geométrica para títulos/números, sans neutra para corpo. Números tabulares em métricas e valores.
- Layout: sidebar fixa colapsável + topbar com busca global (Cmd+K), cantos suaves, sombras quase inexistentes, separação por linhas finas. Densidade alta, respiro controlado.
- Microinterações contidas: transições curtas, skeletons, hover discreto. Nada de gradientes chamativos ou animação decorativa.

## Telas

1. **Dashboard executivo** (`/`)
   - Faixa de KPIs: receita do mês e MRR de renovação, emissões no período, ticket médio, taxa de conversão, no-show.
   - Gráfico de emissões por tipo de certificado (e-CPF, e-CNPJ, A1, A3, nuvem) e curva de receita.
   - Bloco "Pendências críticas": SLA estourado, documentos reprovados, videoconferências sem confirmação.
   - Funil de renovações (vence em 30/60/90 dias) com ação de disparar campanha.
   - Ranking de agentes de registro por volume e tempo médio de validação.

2. **Central operacional Kanban** (`/operacao`)
   - Colunas: Novo pedido → Documentação → Validação → Agendamento → Videoconferência → Emissão → Concluído (+ Bloqueado).
   - Card: cliente, tipo de certificado, responsável (avatar), relógio de SLA, progresso do checklist, tags e prioridade.
   - Drag & drop entre colunas, com regra de bloqueio quando o checklist da etapa não está completo.
   - Filtros por responsável, tipo, canal, prioridade, SLA e período; alternância Kanban/Tabela; contadores e soma de valor por coluna.

3. **Dossiê do cliente** (`/clientes` e `/clientes/:id`)
   - Cabeçalho 360º: identificação, saúde do relacionamento, LTV, próximo vencimento.
   - Abas: Certificados (histórico e status de revogação/renovação), Documentos (com pré-visualização e status de análise), Solicitações, Conversas, Financeiro (faturas, pagamentos, inadimplência), Notas e auditoria.

4. **Detalhe da solicitação** (`/solicitacoes/:id`)
   - Timeline completa e auditável (quem, quando, o quê), incluindo eventos automáticos.
   - Checklist da etapa com ações contextuais: aprovar/reprovar documento, reagendar, emitir, revogar, escalar.
   - Painel lateral com dados do titular, SLA, responsável e anexos.

5. **Central de atendimento com IA** (`/atendimento`)
   - Lista de conversas (WhatsApp, chat do site, e-mail) com filtros e fila.
   - Thread de mensagens + painel de IA: resumo automático, intenção detectada, sentimento, próxima ação sugerida e respostas prontas.
   - Botão "Assumir atendimento" que congela o bot e atribui o humano; ação de converter conversa em solicitação.

6. **Agenda operacional** (`/agenda`)
   - Visões dia/semana com grade de horários por agente e por sala/link de videoconferência.
   - Gestão de disponibilidade, agendamentos, status de confirmação, remarcação e marcação de no-show.
   - Painel lateral com próximos atendimentos e taxa de comparecimento.

## Extras propostos

- Busca global Cmd+K sobre clientes, solicitações e certificados.
- Central de conformidade: trilha de auditoria, evidências e relatório de revogações (exigência típica de AC).
- Motor de renovação: lista de vencimentos com campanhas e histórico de contato.
- Painel de SLA e produtividade da equipe.
- Modo compacto/expandido de densidade e tema claro (base) com estrutura pronta para escuro.

## Notas técnicas

- TanStack Start: uma rota por tela em `src/routes`, layout compartilhado (sidebar + topbar) no `__root`.
- Tokens de cor/tipografia em `src/styles.css` (`@theme inline`, oklch); nenhum valor de cor hardcoded em componentes.
- Dados falsos em `src/mocks/*` (clientes, solicitações, certificados, conversas, agenda, faturas) com tipos TS compartilhados; estado de interação (drag & drop, assumir conversa, checklists) em memória via React state/Zustand leve.
- Gráficos com Recharts usando as cores dos tokens.
- Drag & drop do Kanban com `@dnd-kit`.
- `head()` próprio com título e descrição em cada rota.
- Sem backend nesta etapa; a troca por Lovable Cloud depois é feita substituindo os módulos de mock.
