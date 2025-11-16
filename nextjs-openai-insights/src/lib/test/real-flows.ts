export interface FlowStep {
  label: string;
  details: string;
}

export interface Flow {
  id: string;
  title: string;
  icon: string;
  steps: FlowStep[];
  result: string;
}

export const REAL_FLOWS: Flow[] = [
  {
    id: "create-workspace",
    title: "Criar Workspace",
    icon: "📤",
    steps: [
      { label: "Usuário preenche form", details: "ClassicHeroForm" },
      { label: "Valida membership/limits", details: "useMembership hook" },
      {
        label: "POST /api/generate",
        details: "Body: { salesRepCompany, targetCompany, templateId, ... }",
      },
      {
        label: "API processa template",
        details: "Gera 8 tiles com prompts do template",
      },
      { label: "Gera tiles com AI", details: "GPT-5-nano ou GPT-5 (Max Mode)" },
      { label: "Cria WorkspaceSnapshot", details: "Salva em cookie" },
      { label: "Redireciona para /admin", details: 'router.push("/admin")' },
    ],
    result: "Tiles aparecem no grid após geração",
  },
  {
    id: "create-prompt",
    title: "Criar Prompt Individual",
    icon: "➕",
    steps: [
      { label: 'Clica "Add Prompt"', details: "Abre AddPromptModal" },
      { label: "Preenche: title, prompt, Max Mode", details: "Form no modal" },
      {
        label: "POST /api/workspace/tiles",
        details: "Body: { title, prompt, useMaxPrompt?, requestSize? }",
      },
      { label: "API adiciona company context", details: "Invisível ao user" },
      {
        label: "API cria tile com orderIndex negativo",
        details: "orderIndex: -1, -2...",
      },
      {
        label: "Dashboard atualizado diretamente",
        details: "updateDashboard()",
      },
      { label: "Workspace sincronizado", details: "mutate()" },
    ],
    result: "Tile aparece primeiro no grid",
  },
  {
    id: "tile-chat",
    title: "Chat em Tile",
    icon: "💬",
    steps: [
      { label: 'Clica em tile', details: "Abre TileDetailModal" },
      { label: "Digita mensagem", details: "Input no modal" },
      {
        label: "POST /api/workspace/tiles/[tileId]/chat",
        details: "Body: { message, attachments? }",
      },
      { label: "API processa com contexto", details: "Company + tile history" },
      { label: "OpenAI gera resposta", details: "GPT-5 com contexto" },
      { label: "Tile atualizado com resposta", details: "Adiciona ao chat history" },
    ],
    result: "Resposta AI aparece no chat do tile",
  },
  {
    id: "regenerate-tile",
    title: "Regenerar Tile",
    icon: "🔄",
    steps: [
      { label: 'Clica "Regenerate"', details: "Botão no tile card" },
      {
        label: "POST /api/workspace/tiles/[tileId]/regenerate",
        details: "Body: { useMaxPrompt? }",
      },
      { label: "API regenera conteúdo", details: "Novo prompt para OpenAI" },
      { label: "Tile atualizado", details: "Conteúdo substituído" },
    ],
    result: "Tile tem novo conteúdo gerado",
  },
  {
    id: "create-contact",
    title: "Criar Contato",
    icon: "👤",
    steps: [
      { label: 'Clica "Add Contact"', details: "Abre AddContactModal" },
      { label: "Preenche: name, role", details: "Form no modal" },
      {
        label: "POST /api/workspace/contacts",
        details: "Body: { name, role }",
      },
      { label: "API gera outreach", details: "Insights, email, call script" },
      { label: "Contato criado", details: "Adicionado ao workspace" },
    ],
    result: "Contato aparece no painel com outreach gerado",
  },
  {
    id: "contact-chat",
    title: "Chat em Contato",
    icon: "💬",
    steps: [
      { label: 'Clica em contato', details: "Abre ContactDetailModal" },
      { label: "Digita mensagem", details: "Input no modal" },
      {
        label: "POST /api/workspace/contacts/[contactId]/chat",
        details: "Body: { message }",
      },
      { label: "API processa com contexto", details: "Contact + company context" },
      { label: "OpenAI gera resposta", details: "GPT-5 com contexto" },
      { label: "Contato atualizado", details: "Adiciona ao chat history" },
    ],
    result: "Resposta AI aparece no chat do contato",
  },
  {
    id: "create-note",
    title: "Criar Nota",
    icon: "📝",
    steps: [
      { label: 'Clica "Add Note"', details: "Revela form inline" },
      { label: "Preenche: title, content", details: "Form no painel" },
      {
        label: "POST /api/workspace/notes",
        details: "Body: { title, content }",
      },
      { label: "Nota criada", details: "Adicionada ao workspace" },
    ],
    result: "Nota aparece no painel",
  },
  {
    id: "migrate-to-mongo",
    title: "Migração MongoDB",
    icon: "🗄️",
    steps: [
      { label: "Usuário completa checkout", details: "Stripe checkout.session.completed" },
      { label: "Webhook recebido", details: "POST /api/webhooks/stripe" },
      { label: "Valida assinatura Stripe", details: "Verifica signature" },
      { label: "Cria/atualiza usuário", details: "MongoDB users collection" },
      {
        label: "Migra dados do localStorage",
        details: "migrateGuestDataToMember(userId)",
      },
      { label: "Associa dados ao userId", details: "Workspaces, dashboards, tiles" },
      { label: "Limpa localStorage", details: "Opcional: manter como cache" },
    ],
    result: "Todos os dados do guest migrados para MongoDB como member",
  },
];

