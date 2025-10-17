# Plataforma de Prospecção e Inteligência Comercial — Plano de Implementação

## 1) Apresentação

Aplicativo SaaS para prospecção e inteligência comercial: usuários cadastram empresas‑alvo, centralizam contexto (notas, arquivos, eventos) e interagem com dashboards compostos por tiles de IA (perguntas, chat e insights). Objetivo: consolidar dados dispersos em um painel visual, responsivo e personalizável que acelera preparação e decisão comercial.

### Vivência do usuário (fluxo principal)

- O usuário cria conta e informa sua empresa e a solução vendida no primeiro acesso.
- Na home, clica em “+ Add Company” e adiciona uma empresa (manual, CSV ou CRM mock).
- Ao salvar, o sistema gera automaticamente um dashboard com tiles de IA pré‑definidos.
- O usuário faz perguntas nos tiles (modo Q&A) e alterna para chat quando precisa aprofundar.
- Ativa fullscreen em um tile para focar em uma análise específica.
- Faz upload em massa de prompts para criar novos tiles rapidamente.
- Adiciona notas/arquivos como contexto para melhorar respostas e scoring.
- Consulta o dropdown de dashboards para alternar entre empresas ou templates.
- Visualiza o score das respostas e identifica os insights priorizados.
- No plano pago, acompanha créditos/uso e convida colegas por referral.

### Quem pode se interessar (frases curtas)

- Times de vendas B2B SaaS.
- Consultorias comerciais e de growth.
- Agências de outbound/SDR.
- Private equity/venture scouting.
- Revendas e canais parceiros.
- Empresas com pré‑vendas (BDRs) e prospecção ativa.

## 2) Devemos usar o DashMaster.PRO?

### Decisão

Usar DashMaster.PRO como base do CMS headless + autenticação + deploy, com camadas específicas para IA e UI dos tiles. É o caminho mais rápido para chegar ao MVP com qualidade de produção.

### Por que ajuda (prós)

- Autenticação pronta (Clerk) e middleware aplicável ao app.
- Modelagem rápida de entidades (companies, dashboards, tiles, prompts, contexto) via Sections/ContentTypes.
- API pública headless para o frontend consumir conteúdo e salvar estado.
- Importador CSV já existente para carga inicial (empresas e prompts).
- Deploy automatizado (GitHub Actions + Netlify) e ambientes consistentes.
- Estrutura multi‑tenant (Workspaces) útil para separar clientes/empresas.
- Addons e Sections flexíveis para modelar rapidamente o que for necessário.
- Esquema de Roles para controlar acessos com facilidade.
- Segurança pronta (rate limit, sanitização) e logs.

### Cuidados/Contras

- Gestão visual avançada dos tiles (drag & drop, resize) exige componente de grid no frontend e salvar a organização do painel (disposição e tamanho dos tiles).
- Camada de IA (prompting, contexto e scoring) exige rota de API dedicada e controle de créditos.
- Integração CRM no MVP será mock (ok conforme pedido), integrações reais entram após M2.

## 3) O que já temos pronto no repositório

- Dashboard Next.js (App Router), providers e padrões de acesso a dados.
- Autenticação com Clerk integrada e middleware de sessão.
- Importador (CSV) e APIs utilitárias base.
- Estrutura de Sections/ContentTypes/Items para modelagem rápida.
- Deploy automatizado (Netlify + GitHub Actions) e documentação de segurança/performance.
- Páginas de perfil base (ajustáveis para nome, email, avatar, senha).

## 3.1) Stacks e Requisitos

### Stacks

- Frontend: Next.js 15 (React 19, App Router), Tailwind 4.
- Backend: Node.js 22, MongoDB Atlas, Clerk (auth), Stripe (pagamentos), Cloudinary (mídia).
- Infra/Deploy: GitHub Actions, Netlify (preview e produção).
- IA: provider plugável (OpenAI/Azure/Anthropic) via rota `POST /api/ai/query`.

### Requisitos básicos

- Contas e tokens: Clerk, Stripe, Cloudinary, GitHub, Netlify.
- Variáveis `.env` configuradas (auth, DB, API pública, tokens de deploy/IA).
- Navegadores suportados: últimas versões de Chrome/Edge/Firefox/Safari.
- Dispositivos: layout responsivo validado em mobile e desktop.

## 4) Lacunas para cobrir no MVP

- UI de tiles com modos frente/verso (Q&A ↔ chat), fullscreen e scoring.
- Rota de IA (`POST /api/ai/query`) com provider plugável + métrica de uso.
- Contador de créditos (free tier) com bloqueio por plano/limite.
- Persistência de layout (drag & drop/resize planejado para M2).

## 5) Plano por Milestones

### Milestone 1 — MVP Funcional (6–8 semanas)

Entregáveis

- Auth (login/signup/logout) segura.
- Pop‑up inicial para empresa do usuário e solução vendida (salva em perfil/tenant e usada como contexto de IA).
- Home com CTA central “+ Add Company”.
- Fluxo de adicionar empresas: manual (modal: nome obrigatório, URL opcional), CSV upload, CRM mock.
- Após adicionar empresa: gerar dashboard automático com 10 tiles de prompts fixos (conteúdo fornecido). Topo exibe nome da empresa e do dashboard.
- Upload em massa de prompts (20+) para criar tiles.
- Tiles com frente/verso (somente Q&A vs. chat), opção fullscreen e scoring básico nas respostas.
- Layout mobile‑responsive.
- UI seguirá o wireframe fornecido para M1.

Critérios de aceite

- Usuário cria conta, faz login e logout com segurança.
- Primeira entrada: título central + botão (+) conforme wireframe; botão oferece manual/CSV/CRM.
- Modal manual com validações (nome obrigatório, URL opcional).
- CSV/CRM aceitam mock no MVP.
- Ao criar empresa, abre dashboard pré‑populado com 10 tiles; barra superior mostra empresa + nome do dashboard.
- Upload em massa: usuário adiciona 20+ prompts de uma vez e cria tiles.
- Telas testadas em principais breakpoints mobile/desktop.
- Interface condizente com o wireframe fornecido pelo cliente.

### Milestone 2 — Dashboards Avançados (8–10 semanas)

Entregáveis

- Dropdown/lista para acessar todos os dashboards (templates e criados pelo usuário).
- Contexto adicional por dashboard: notas, uploads de arquivos, texto colado (Cloudinary para mídia).
- Criar dashboard em branco, adicionar/editar prompts e salvar como template.
- Clonar/aplicar templates para novas empresas.
- Personalização de fundo: cor sólida, fundos prontos ou upload de imagem.
- Gestão de tiles: drag & drop para reordenar; resize dinâmico (grid responsiva) com persistência.
- Landing page pública com signup.
- Perfil de usuário (nome, email, avatar, senha) completo.
- Seção “treinar a ferramenta”: case studies, lista de clientes, emails/script de vendas para orientar a IA.
- Fullscreen por tile disponível na UI (continuidade do M1).

Critérios de aceite

- Clique no nome do dashboard exibe todos os dashboards (templates/custom).
- Usuário adiciona contexto (notas/arquivos/texto) e vê efeitos nas respostas dos tiles.
- “Start Blank Dashboard” permite criar cards e salvar como template; aplicar template funciona em outras empresas.
- Fundo do dashboard editável (cor/fundos prontos/upload) e persistente.
- Drag & drop e resize de tiles com estado salvo e refletido ao recarregar.
- Landing comunica produto e permite signup.
- Usuário edita perfil (nome, avatar, senha).

### Milestone 3 — Monetização & Growth (4–6 semanas)

Entregáveis

- Pagamentos por assinatura (Stripe ou equivalente) com planos.
- Sistema de créditos para free tier (controle de consumo de IA e limites de features).
- Referral: convites por link/e‑mail; bônus de créditos quando convite converte.
- Painel de plano, créditos e status de convites no dashboard/settings.

Critérios de aceite

- Checkout/portal de pagamento operante para novos e existentes.
- Limites aplicados por créditos (bloqueio/avisos); consumo decrementa conforme uso de IA.
- Convites funcionam; quando aceitos, ambos recebem créditos e são notificados.
- Página de settings exibe plano atual, créditos e progresso de referrals.

## 6) Modelagem (resumo sugerido)

- companies (dados básicos, url, segmento, owner)
- dashboards (empresaId, nome, background, layout, templateRef)
- tiles (dashboardId, promptId, modo, answer, score, usage)
- prompts_library (titulo, prompt, tags, categoria)
- context (dashboardId, notas, arquivos[Cloudinary], texto)
- training_data (tipos: case_study, clientes, emails_modelo, scripts)
- referrals (invite_code, invited_email, status, credited_at)
- billing/credits (plan, quota, consumed, resetsAt)

## 7) Notas técnicas

- IA: `POST /api/ai/query` recebe prompt + contexto (empresa, notas, training_data) e retorna answer + score + usage.
- Segurança: rate limiting por usuário/chave; sanitização de inputs; logs de execução.
- Frontend: grid com drag & drop/resize (M2) e persistência do layout no Item `dashboard`.
- Deploy: GitHub Actions + Netlify; ambientes dev/staging/prod.

## 7.1) Esforço, Cronograma e Custos

- Taxa: US$ 22/hora.
- Semana cheia (40h): US$ 880/semana.
- Preço especial proposto (foco/qualidade, ~20h/semana): US$ 440/semana.
- Forma de cobrança: por sprints semanais (fatura semanal). Opção: 50% no início da semana + 50% na entrega.

Observação: como já existe base no DashMaster (multi‑tenant, addons/sections, roles), espera‑se ganho de velocidade principalmente em M1.

## 8) Próximos passos

1. Validar a lista dos 10 prompts fixos de M1 e o pacote de 20+ prompts para upload.
2. Confirmar campos mínimos de company/profile e do pop‑up inicial.
3. Aprovar esta divisão de milestones e critérios de aceite.
4. Iniciar implementação M1 (modelo de dados + UI base + rota de IA + scoring).

---

### Tabela compacta (visão executiva)

| Milestone        | Entregáveis principais                                                                                                                                   | Prazo estimado | Valor agregado                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------- |
| M1 – MVP         | Auth, pop‑up inicial, add empresas (manual/CSV/CRM mock), dashboard automático com 10 tiles, upload em massa, Q&A/chat, fullscreen, scoring, responsivo. | 6–8 semanas    | Primeira versão utilizável com fluxo básico completo.   |
| M2 – Avançados   | Múltiplos dashboards, templates, contexto (notas/arquivos), fundo custom, drag & drop, resize tiles, landing page, perfil, treinamento da IA.            | 8–10 semanas   | Usuário molda a ferramenta; produto ganha maturidade.   |
| M3 – Monetização | Stripe, créditos free tier, referrals, painel de plano/créditos.                                                                                         | 4–6 semanas    | Pronto para lançar com modelo de receita e viralização. |

---

## 9) Proposta de valor e condições (resumo executivo)

### Diferencial: fazer mais com menos

- Reuso de plataforma (DashMaster.PRO) com multi‑tenant, roles e addons acelera M1.
- Menos código do zero, mais foco na experiência e nos resultados de IA.
- Entregáveis visuais desde cedo (seguindo wireframe) reduzem retrabalho.

### O que você leva

- MVP utilizável: login, empresas, dashboard automático com tiles de IA (Q&A/chat), fullscreen, scoring e upload em massa de prompts.
- Base sólida para crescer: múltiplos dashboards, templates, personalização, contexto rico (notas/arquivos), treino da IA.
- Pronto para monetizar: Stripe, créditos por uso, referral e painel de plano/créditos.
- Infra e deploy: GitHub Actions + Netlify (preview/produção) e documentação.
- Segurança: auth centralizada, rate limit e sanitização de inputs.

### Preços e formatos

- Time & Materials: US$ 22/h.
  - Semana cheia (40h): US$ 880/semana.
  - Preço especial sugerido (20h/semana): US$ 440/semana.
- Alternativa (preço fixo): incluir 15%–20% de buffer em cada milestone para cobrir riscos e garantir prazo.

### Por que agora

- Com a base existente, o MVP sai mais rápido e com menos risco.
- O escopo de M1 já entrega valor real para times comerciais testarem no campo.
