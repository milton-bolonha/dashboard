# Comparativo de Funcionalidades: Estado Atual vs. Planejado

Este documento cataloga as funcionalidades do DashMaster.PRO, comparando o estado atual com o que teremos após a implementação das Fases 1, 2 e 3.

---

| Categoria | Status Atual | Status Planejado (Pós-Fases 1-3) |
| :--- | :--- | :--- |
| **Gerenciamento de Conteúdo** | CRUD básico para Content Types, Sections e Items. | CRUD completo + **Sincronização com arquivos estáticos (Markdown/JSON) e versionamento Git.** |
| **Segurança e Acesso** | Autenticação de usuário via Clerk; roles básicos definidos. | **Controle de acesso granular via `Access Engine` centralizado**, com matriz de permissões por role. |
| **API e Integrações** | API interna para o dashboard; API Keys não funcionais. | **API Pública com gerenciamento de chaves, rate limiting e cache.** |
| **Landing Page** | Estática ou com dados mockados. | **Página estática gerada no build-time com conteúdo dinâmico** vindo do DashMaster.PRO. |
| **Performance** | Cache básico no cliente (Clerk/SWR). | **Cache de servidor (Redis) para dados da UI, permissões e respostas da API pública.** |
| **Resiliência e Background Jobs** | Processamento de webhooks simples em uma função serverless. | **Processamento de tarefas críticas (webhooks, etc.) em segundo plano via `deckEngine`**, com resiliência e logs. |
| **Automação** | Nenhuma. | **Motor de automação (`deckEngine`)** para tarefas agendadas e fluxos de trabalho internos. |
| **Observabilidade** | Logs básicos do servidor. | **Monitor de tarefas em segundo plano** com status e opção de retentativa (retry). |

---

Este catálogo demonstra a evolução planejada do DashMaster.PRO, de um sistema de gerenciamento funcional para uma plataforma robusta, escalável e pronta para desenvolvedores.