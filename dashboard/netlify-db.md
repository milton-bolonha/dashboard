# Plano de Migração: MongoDB → Netlify DB

## 📋 **Visão Geral**

Migrar o sistema trial (guest workspaces) do MongoDB para Netlify DB, aproveitando a integração nativa com PostgreSQL e a facilidade de configuração automática.

## 🎯 **Objetivos**

- ✅ **Simplificar infraestrutura**: Eliminar dependência do MongoDB
- ✅ **Melhorar DX**: Configuração automática com `npx netlify db init`
- ✅ **Manter funcionalidades**: Todas as features atuais preservadas
- ✅ **Otimizar performance**: PostgreSQL nativo com índices otimizados

## 🏗️ **Arquitetura Atual vs Nova**

### **Atual (MongoDB)**

```
Guest Workspaces → MongoDB Atlas
├── guest_workspaces (collection)
├── dashboard_templates (collection)
└── workspaces (collection)
```

### **Nova (Netlify DB)**

```
Guest Workspaces → Netlify DB (PostgreSQL)
├── guest_workspaces (table)
├── dashboard_templates (table)
├── workspaces (table)
└── Neon integration (production)
```

## 📊 **Mapeamento de Schemas**

### **1. Guest Workspaces**

```sql
CREATE TABLE guest_workspaces (
  id SERIAL PRIMARY KEY,
  guest_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),

  -- Workspace Data (JSONB)
  workspace_data JSONB NOT NULL DEFAULT '{}',

  -- Usage Tracking
  usage JSONB DEFAULT '{"requests": 0, "last_activity": null}',

  -- Indexes
  INDEX idx_guest_id (guest_id),
  INDEX idx_last_activity (last_activity),
  INDEX idx_workspace_data (workspace_data)
);
```

### **2. Dashboard Templates**

```sql
CREATE TABLE dashboard_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_custom BOOLEAN DEFAULT TRUE,

  -- Template Data (JSONB)
  tiles JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,

  -- Indexes
  INDEX idx_template_id (template_id),
  INDEX idx_created_by (created_by),
  INDEX idx_is_default (is_default),
  INDEX idx_is_custom (is_custom)
);
```

### **3. Workspaces (Produção)**

```sql
CREATE TABLE workspaces (
  id SERIAL PRIMARY KEY,
  workspace_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,

  -- Workspace Data (JSONB)
  workspace_data JSONB NOT NULL DEFAULT '{}',

  -- Onboarding
  onboarding JSONB DEFAULT '{}',

  -- Stripe Integration
  stripe JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_workspace_id (workspace_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_slug (slug),
  INDEX idx_type (type)
);
```

## 🔄 **Plano de Migração**

### **Fase 1: Setup Netlify DB**

```bash
# 1. Instalar Netlify DB
npx netlify db init

# 2. Instalar dependências
npm install @netlify/neon

# 3. Configurar variáveis de ambiente
# .env.local
NETLIFY_DATABASE_URL=postgresql://...
```

### **Fase 2: Criar Schemas**

```sql
-- 1. Executar scripts de criação
-- 2. Criar índices otimizados
-- 3. Configurar RLS (Row Level Security)
-- 4. Testar conexão
```

### **Fase 3: Migrar Dados**

```javascript
// Script de migração
const migrateData = async () => {
  // 1. Conectar MongoDB
  // 2. Conectar Netlify DB
  // 3. Migrar guest_workspaces
  // 4. Migrar dashboard_templates
  // 5. Migrar workspaces
  // 6. Validar integridade
};
```

### **Fase 4: Atualizar APIs**

```javascript
// Antes (MongoDB)
import { db } from "@/lib/db";
const workspace = await db.findOne("guest_workspaces", { guest_id });

// Depois (Netlify DB)
import { neon } from "@netlify/neon";
const sql = neon();
const workspace = await sql(
  "SELECT * FROM guest_workspaces WHERE guest_id = $1",
  [guest_id]
);
```

## 📁 **Arquivos a Modificar ou Criar**

### **1. Configuração**

- `lib/db.js` → `lib/netlify-db.js`
- `package.json` → Adicionar `@netlify/neon`
- `.env.local` → Adicionar `NETLIFY_DATABASE_URL`

### **2. APIs Guest**

- `app/api/guest/workspace/route.js`
- `app/api/guest/generate-tiles/route.js`
- `app/api/guest/add-company/route.js`
- `app/api/guest/add-contact/route.js`
- `app/api/guest/generate-custom-tile/route.js`
- `app/api/guest/reorder-tiles/route.js`
- `app/api/guest/convert/route.js`
- `app/api/guest/reset/route.js`
- `app/api/guest/templates/route.js`
- `app/api/guest/templates/apply/route.js`
- `app/api/guest/notes/route.js`
- `app/api/guest/notes/[id]/route.js`
- `app/api/guest/files/route.js`
- `app/api/guest/files/[id]/route.js`

### **3. APIs Produção**

- `app/api/workspaces/route.js`
- `app/api/dashboard/stats/route.js`
- `app/api/sync/clerk-users/route.js`

### **4. Schemas**

- `schemas/index.js` → Atualizar para PostgreSQL
- `schemas/templates.js` → Migrar para SQL

## 🔧 **Implementação Técnica**

### **1. Nova Biblioteca de DB**

```javascript
// lib/netlify-db.js
import { neon } from "@netlify/neon";

const sql = neon();

export const db = {
  // Guest Workspaces
  async findGuestWorkspace(guestId) {
    const result = await sql(
      "SELECT * FROM guest_workspaces WHERE guest_id = $1",
      [guestId]
    );
    return result[0] || null;
  },

  async createGuestWorkspace(guestId, workspaceData) {
    const result = await sql(
      "INSERT INTO guest_workspaces (guest_id, workspace_data) VALUES ($1, $2) RETURNING *",
      [guestId, JSON.stringify(workspaceData)]
    );
    return result[0];
  },

  async updateGuestWorkspace(guestId, updates) {
    const result = await sql(
      "UPDATE guest_workspaces SET workspace_data = $1, updated_at = NOW() WHERE guest_id = $2 RETURNING *",
      [JSON.stringify(updates), guestId]
    );
    return result[0];
  },

  // Templates
  async findTemplate(templateId) {
    const result = await sql(
      "SELECT * FROM dashboard_templates WHERE template_id = $1",
      [templateId]
    );
    return result[0] || null;
  },

  async createTemplate(templateData) {
    const result = await sql(
      "INSERT INTO dashboard_templates (template_id, name, description, tiles, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        templateData.id,
        templateData.name,
        templateData.description,
        JSON.stringify(templateData.tiles),
        templateData.createdBy,
      ]
    );
    return result[0];
  },

  async listTemplates(createdBy = null) {
    let query = "SELECT * FROM dashboard_templates";
    let params = [];

    if (createdBy) {
      query += " WHERE created_by = $1 OR is_default = true";
      params = [createdBy];
    } else {
      query += " WHERE is_default = true";
    }

    query += " ORDER BY created_at DESC";

    const result = await sql(query, params);
    return result;
  },
};
```

### **2. Migração de Dados**

```javascript
// scripts/migrate-to-netlify-db.js
import { MongoClient } from "mongodb";
import { neon } from "@netlify/neon";

const migrateGuestWorkspaces = async () => {
  // 1. Conectar MongoDB
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  const mongoDb = mongoClient.db(process.env.MONGODB_DB);

  // 2. Conectar Netlify DB
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  // 3. Migrar dados
  const guestWorkspaces = await mongoDb
    .collection("guest_workspaces")
    .find({})
    .toArray();

  for (const workspace of guestWorkspaces) {
    await sql(
      "INSERT INTO guest_workspaces (guest_id, workspace_data, created_at, updated_at) VALUES ($1, $2, $3, $4)",
      [
        workspace.guest_id,
        JSON.stringify(workspace.workspace_data),
        workspace.created_at || new Date(),
        workspace.updated_at || new Date(),
      ]
    );
  }

  console.log(`✅ Migrated ${guestWorkspaces.length} guest workspaces`);
};
```

### **3. Atualização de APIs**

```javascript
// app/api/guest/workspace/route.js (exemplo)
import { db } from "@/lib/netlify-db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const workspace = await db.findGuestWorkspace(guestId);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workspace: {
        guest_id: workspace.guest_id,
        workspace_data: workspace.workspace_data,
        created_at: workspace.created_at,
        updated_at: workspace.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🚀 **Vantagens da Migração**

### **1. Desenvolvimento**

- ✅ **Setup automático**: `npx netlify db init`
- ✅ **Zero configuração**: Variáveis de ambiente automáticas
- ✅ **Desenvolvimento local**: `netlify dev` provisiona DB automaticamente

### **2. Produção**

- ✅ **PostgreSQL nativo**: Performance superior
- ✅ **RLS (Row Level Security)**: Segurança avançada
- ✅ **Branching**: Desenvolvimento seguro com branches de DB
- ✅ **Escalabilidade**: Recursos computacionais sob demanda

### **3. Manutenção**

- ✅ **Menos dependências**: Elimina MongoDB Atlas
- ✅ **Integração nativa**: Tudo na plataforma Netlify
- ✅ **Backup automático**: Gerenciado pela Neon

## 📋 **Checklist de Migração**

### **Preparação**

- [ ] Instalar Netlify DB: `npx netlify db init`
- [ ] Instalar dependências: `npm install @netlify/neon`
- [ ] Configurar variáveis de ambiente
- [ ] Criar schemas SQL
- [ ] Configurar índices

### **Migração**

- [ ] Criar script de migração de dados
- [ ] Executar migração em ambiente de teste
- [ ] Validar integridade dos dados
- [ ] Atualizar todas as APIs
- [ ] Testar funcionalidades

### **Deploy**

- [ ] Configurar produção na Neon
- [ ] Executar migração em produção
- [ ] Atualizar variáveis de ambiente
- [ ] Monitorar performance
- [ ] Remover dependências MongoDB

## 🎯 **Cronograma Estimado**

- **Semana 1**: Setup e schemas
- **Semana 2**: Migração de dados e APIs
- **Semana 3**: Testes e validação
- **Semana 4**: Deploy e monitoramento

## 🧹 **Sistema de Limpeza Automática**

### **Política de Retenção**

- **Guest workspaces**: 7 dias de inatividade
- **Workspaces convertidos**: Deletar imediatamente após conversão
- **Templates**: Manter indefinidamente (não são limpos)

### **Implementação com Netlify Scheduled Functions**

```javascript
// netlify/functions/cleanup-guest-workspaces.mjs
import { neon } from "@netlify/neon";

export default async (req) => {
  const { next_run } = await req.json();
  console.log("🧹 Iniciando limpeza de guest workspaces...");

  const sql = neon();

  try {
    // 1. Buscar workspaces inativos há 7 dias
    const inactiveWorkspaces = await sql(`
      SELECT guest_id, last_activity, workspace_data 
      FROM guest_workspaces 
      WHERE last_activity < NOW() - INTERVAL '7 days'
      AND workspace_data->>'converted' IS NULL
    `);

    console.log(
      `📊 ${inactiveWorkspaces.length} workspaces inativos encontrados`
    );

    // 2. Buscar workspaces para aviso (6 dias de inatividade)
    const warningWorkspaces = await sql(`
      SELECT guest_id, last_activity 
      FROM guest_workspaces 
      WHERE last_activity < NOW() - INTERVAL '6 days'
      AND last_activity > NOW() - INTERVAL '7 days'
      AND workspace_data->>'converted' IS NULL
      AND workspace_data->>'warning_sent' IS NULL
    `);

    // 3. Enviar avisos (se implementado sistema de email)
    for (const workspace of warningWorkspaces) {
      // TODO: Implementar envio de email de aviso
      console.log(`⚠️ Aviso para workspace: ${workspace.guest_id}`);

      // Marcar como aviso enviado
      await sql(
        `
        UPDATE guest_workspaces 
        SET workspace_data = workspace_data || '{"warning_sent": true}'::jsonb
        WHERE guest_id = $1
      `,
        [workspace.guest_id]
      );
    }

    // 4. Deletar workspaces antigos
    let deletedCount = 0;
    for (const workspace of inactiveWorkspaces) {
      await sql(`DELETE FROM guest_workspaces WHERE guest_id = $1`, [
        workspace.guest_id,
      ]);
      deletedCount++;
      console.log(`🗑️ Deletado: ${workspace.guest_id}`);
    }

    // 5. Log de atividades
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: "cleanup_completed",
      stats: {
        total_inactive: inactiveWorkspaces.length,
        warnings_sent: warningWorkspaces.length,
        deleted: deletedCount,
      },
    };

    console.log("📝 Log de limpeza:", logEntry);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Limpeza concluída: ${deletedCount} workspaces removidos`,
        stats: logEntry.stats,
      }),
    };
  } catch (error) {
    console.error("❌ Erro na limpeza:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

export const config = {
  schedule: "@daily", // Todo dia às 00:00 UTC
};
```

### **Configuração no netlify.toml**

```toml
# netlify.toml
[functions."cleanup-guest-workspaces"]
schedule = "@daily"

# Configurações adicionais
[build]
  functions = "netlify/functions"
```

### **Sistema de Notificações (Opcional)**

```javascript
// lib/email-notifications.js
export async function sendCleanupWarning(guestId, workspaceData) {
  // Implementar envio de email usando:
  // - SendGrid
  // - Resend
  // - Netlify Forms (limitado)

  const emailData = {
    to: workspaceData.user_email || "noreply@example.com",
    subject: "Seu workspace será removido em 24h",
    template: "cleanup-warning",
    data: {
      guest_id: guestId,
      last_activity: workspaceData.last_activity,
      cleanup_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  };

  // TODO: Implementar envio real de email
  console.log("📧 Email de aviso:", emailData);
}
```

### **Monitoramento e Logs**

```sql
-- Tabela para logs de limpeza
CREATE TABLE cleanup_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  guest_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_cleanup_logs_action ON cleanup_logs(action);
CREATE INDEX idx_cleanup_logs_created_at ON cleanup_logs(created_at);
```

### **Vantagens do Sistema**

- ✅ **Nativo Netlify**: Sem dependências externas
- ✅ **Escalável**: Funciona com milhares de workspaces
- ✅ **Auditável**: Logs completos de todas as ações
- ✅ **Configurável**: Fácil ajustar políticas de retenção
- ✅ **Automático**: Execução diária sem intervenção manual

### **Configurações Flexíveis**

```javascript
// Configurações de limpeza
const CLEANUP_CONFIG = {
  retention_days: 7, // Dias para manter workspaces
  warning_days: 6, // Dias para enviar aviso
  batch_size: 100, // Workspaces por lote
  dry_run: false, // Modo teste (não deleta)
  email_notifications: true, // Enviar emails de aviso
};
```

## 📚 **Referências**

- [Netlify DB Documentation](https://www.netlify.com/blog/netlify-db-database-for-ai-native-development/)
- [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
- [Neon PostgreSQL](https://neon.tech/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Nota**: Este plano mantém todas as funcionalidades atuais enquanto aproveita as vantagens do Netlify DB para desenvolvimento AI-native e integração nativa com a plataforma Netlify.
