
### 📖 Comece Aqui

1. **[boas-praticas.md](./boas-praticas.md)** — **LEIA PRIMEIRO**  
   Padrões e técnicas de desenvolvimento utilizadas no projeto (Tailwind, TypeScript, React, Containerização)

2. **[01-arquitetura/arquitetura-consolidada.md](./01-arquitetura/arquitetura-consolidada.md)** — Arquitetura  
   Arquitetura completa organizada por Produto/Plataforma/SaaS e Home/Admin/Shared

3. **[01-arquitetura/status-implementacao.md](./01-arquitetura/status-implementacao.md)** — Status Real  
   O que está implementado de verdade (MongoDB ~80%, Clerk ~20%, Stripe ~40%)

---

## 📁 Estrutura por Domínios

### 📚 Guias de Desenvolvimento

| Arquivo | Descrição |
|---------|-----------|
| [`boas-praticas.md`](./boas-praticas.md) | Padrões e técnicas de código (Tailwind, TypeScript, React, Containerização) |

### 01. Arquitetura

Documentação arquitetural e status de implementação.

| Arquivo | Descrição |
|---------|-----------|
| [`arquitetura-consolidada.md`](./01-arquitetura/arquitetura-consolidada.md) | Arquitetura completa (Produto/Plataforma/SaaS + Home/Admin/Shared) |
| [`blueprint-tecnico.md`](./01-arquitetura/blueprint-tecnico.md) | Blueprint técnico detalhado (External API Orchestration Engine) |
| [`status-implementacao.md`](./01-arquitetura/status-implementacao.md) | Status real das implementações (baseado em código) |

---

### 02. Guias Operacionais

Guias práticos para desenvolvimento e uso do sistema.

| Arquivo | Descrição |
|---------|-----------|
| [`fluxo-operacional.md`](./02-guias-operacionais/fluxo-operacional.md) | Fluxo completo Home → Geração → Admin (Nov/2025) |
| [`fluxo-tiles.md`](./02-guias-operacionais/fluxo-tiles.md) | Como tiles são criados e prompts são engenheirados |
| [`guia-admin.md`](./02-guias-operacionais/guia-admin.md) | Guia completo do Admin Dashboard (temas, estrutura, fluxos) |

---

### 03. Configuração

Documentação de configuração e setup.

| Arquivo | Descrição |
|---------|-----------|
| [`templates.md`](./03-configuracao/templates.md) | Configuração de templates (onde estão, como ajustar) |
| [`variaveis-ambiente.md`](./03-configuracao/variaveis-ambiente.md) | Variáveis de ambiente e rate limiting |
| [`plano-templates-editaveis.md`](./03-configuracao/plano-templates-editaveis.md) | Plano para templates editáveis (estratégia e implementação) |

---

### 04. Checklist e Planos

Checklists e planos de desenvolvimento.

| Arquivo | Descrição |
|---------|-----------|
| [`checklist-admin.md`](./04-checklist-planos/checklist-admin.md) | Checklist do Admin (o que funciona, o que falta) |
| [`plano-finalizacao.md`](./04-checklist-planos/plano-finalizacao.md) | Plano histórico de finalização (14/11/2024) |

---

### 05. Relatórios

Relatórios de mudanças e entregas (ordem cronológica reversa).

| Arquivo | Descrição |
|---------|-----------|
| [`relatorio-nov-23-2025.md`](./05-relatorios/relatorio-nov-23-2025.md) | **NOVO** - Melhorias de segurança, escalabilidade e UX (23 Nov 2025) |
| [`relatorio-nov-21-2025.md`](./05-relatorios/relatorio-nov-21-2025.md) | Correções críticas: geração duplicada, persistência, UI (21 Nov 2025) |
| [`relatorio-nov-2025.md`](./05-relatorios/relatorio-nov-2025.md) | Relatório completo das entregas (10 Nov 2025) |
| [`report-update.md`](./05-relatorios/report-update.md) | Análise de streaming, polling e Stripe security |
| [`rebatendo-analise-vulnerabilidades.md`](./05-relatorios/rebatendo-analise-vulnerabilidades.md) | Rebuttal técnico de análise externa |

---

### 06. Especificações

Especificações técnicas e prompts.

| Arquivo | Descrição |
|---------|-----------|
| [`visualizacao-arquitetura.md`](./06-especificacoes/visualizacao-arquitetura.md) | Especificação para sistema de visualização de arquitetura (dev tool style) |

---

### 📁 Histórico

Documentação histórica mantida para referência.

- `historico/` — Documentação antiga e obsoleta (11 arquivos)

---

## 🗺️ Mapa de Navegação

```
docs/
├── README.md (você está aqui)
├── boas-praticas.md          ← PADRÕES DE CÓDIGO
│
├── 01-arquitetura/
│   ├── arquitetura-consolidada.md    ← LEIA PRIMEIRO
│   ├── blueprint-tecnico.md
│   └── status-implementacao.md       ← STATUS REAL
│
├── 02-guias-operacionais/
│   ├── fluxo-operacional.md          ← FLUXO END-TO-END
│   ├── fluxo-tiles.md                ← FLUXO DE TILES
│   └── guia-admin.md                 ← GUIA DO ADMIN
│
├── 03-configuracao/
│   ├── templates.md
│   ├── variaveis-ambiente.md
│   └── plano-templates-editaveis.md
│
├── 04-checklist-planos/
│   ├── checklist-admin.md
│   └── plano-finalizacao.md
│
├── 05-relatorios/
│   └── relatorio-nov-2025.md
│
├── 06-especificacoes/
│   └── visualizacao-arquitetura.md
│
└── historico/                        ← DOCUMENTAÇÃO HISTÓRICA
    └── (11 arquivos históricos)
```

---

## 🚀 Por Onde Começar?

### Para Novos Desenvolvedores

1. **Dia 1**: [`boas-praticas.md`](./boas-praticas.md) — **LEIA PRIMEIRO** - Padrões de código e técnicas
2. **Dia 2**: [`01-arquitetura/arquitetura-consolidada.md`](./01-arquitetura/arquitetura-consolidada.md) — Entenda a arquitetura
3. **Dia 3**: [`01-arquitetura/status-implementacao.md`](./01-arquitetura/status-implementacao.md) — Saiba o que está funcionando
4. **Dia 4**: [`02-guias-operacionais/fluxo-operacional.md`](./02-guias-operacionais/fluxo-operacional.md) — Entenda o fluxo
5. **Dia 5**: [`02-guias-operacionais/guia-admin.md`](./02-guias-operacionais/guia-admin.md) — Entenda o Admin
6. **Dia 6**: [`02-guias-operacionais/fluxo-tiles.md`](./02-guias-operacionais/fluxo-tiles.md) — Entenda tiles

### Para Desenvolvedores Experientes

1. [`01-arquitetura/arquitetura-consolidada.md`](./01-arquitetura/arquitetura-consolidada.md) — Revisão rápida
2. [`01-arquitetura/status-implementacao.md`](./01-arquitetura/status-implementacao.md) — Status atual
3. [`01-arquitetura/blueprint-tecnico.md`](./01-arquitetura/blueprint-tecnico.md) — Detalhes técnicos
4. [`04-checklist-planos/checklist-admin.md`](./04-checklist-planos/checklist-admin.md) — O que falta

### Para Product Managers

1. [`01-arquitetura/arquitetura-consolidada.md`](./01-arquitetura/arquitetura-consolidada.md) — Visão geral
2. [`01-arquitetura/status-implementacao.md`](./01-arquitetura/status-implementacao.md) — Status de implementação
3. [`05-relatorios/relatorio-nov-21-2025.md`](./05-relatorios/relatorio-nov-21-2025.md) — **NOVO** - Correções críticas (21 Nov)
4. [`05-relatorios/relatorio-nov-2025.md`](./05-relatorios/relatorio-nov-2025.md) — Mudanças anteriores (10 Nov)

---

## 📊 Domínios Conceituais

A documentação segue a organização por **domínios conceituais**:

- **Produto** → O que o usuário vê (Home, Admin, Shared)
- **Plataforma** → O que sustenta tecnicamente (APIs, Storage, AI Engine)
- **SaaS** → Regras de negócio (Limites, Planos, Billing)

Veja [`01-arquitetura/arquitetura-consolidada.md`](./01-arquitetura/arquitetura-consolidada.md) para detalhes completos.

---

**Última atualização**: Novembro/2025  
**Mantido por**: Equipe de desenvolvimento
