# 🎯 Decisões Necessárias do Cliente

## 📋 Introdução

Este documento lista todas as configurações, decisões técnicas e estratégias comerciais que você precisa definir para o sistema funcionar completamente. O sistema foi desenvolvido de forma rápida e enxuta, mas agora requer suas decisões sobre aspectos técnicos e comerciais.

---

## 🔧 CONFIGURAÇÕES TÉCNICAS

### 1. Modelos de IA e Estratégia de Custos

#### Decisão Necessária: Qual modelo usar em cada situação?

**Situação Atual:**

- Sistema usa `gpt-5-mini` por padrão (mais barato)
- Existe conceito de "max mode" que deveria usar `gpt-5` (mais caro)
- Você inventou o conceito de "max mode" junto com tamanhos de requisição

**Perguntas para Você:**

1. **Estratégia de Modelos:**

   - [ ] Usar `gpt-5-mini` sempre (mais econômico)
   - [ ] Usar `gpt-5-mini` por padrão e `gpt-5` apenas no "max mode"
   - [ ] Usar `gpt-5` sempre (melhor qualidade)
   - [ ] Outra estratégia: ********\_********

2. **Quando Ativar Max Mode:**

   - [ ] Apenas quando usuário marcar checkbox "Max Mode"
   - [ ] Automaticamente para requisições "alto" (tamanho máximo)
   - [ ] Baseado em algum critério de plano/billing
   - [ ] Outro critério: ********\_********

3. **Tamanhos de Requisição:**
   - **Pequeno**: Quantos tokens/caracteres? (atual: ~200-400 tokens)
   - **Médio**: Quantos tokens/caracteres? (sugestão: ~800 tokens)
   - **Alto**: Quantos tokens/caracteres? (sugestão: ~1600 tokens)
   - **Alto só no Max Mode?** [ ] Sim [ ] Não

**Custo Estimado (exemplo):**

- GPT-5-mini: ~$0.001 por 1K tokens
- GPT-5: ~$0.01 por 1K tokens (10x mais caro)
- Requisição média: ~600 tokens
- Custo por requisição pequena (mini): ~$0.0006
- Custo por requisição alta (gpt-5): ~$0.016

**Recomendação Técnica:**

- Pequeno: 200-400 tokens, sempre mini
- Médio: 600-800 tokens, sempre mini
- Alto: 1200-1600 tokens, mini por padrão, gpt-5 apenas se max mode ativado

---

### 2. Billing & Usage Limits

#### Decisão Necessária: Definir limites por plano

**Situação Atual:**

- Sistema tem estrutura de limites mas não está conectada ao billing real
- Limites atuais são apenas para guest mode (localStorage)
- Não há integração com Stripe ainda

**Perguntas para Você:**

1. **Planos que você quer oferecer:**

   - [ ] Plano Gratuito (Free)
   - [ ] Plano Básico (Basic)
   - [ ] Plano Pro (Pro)
   - [ ] Plano Enterprise (Enterprise)
   - [ ] Outros: ********\_********

2. **Limites por Plano:**

   **Plano Gratuito:**

   - Máximo de workspaces: **\_**
   - Máximo de companies por workspace: **\_**
   - Máximo de tiles por company: **\_**
   - Máximo de contacts: **\_**
   - Máximo de notes: **\_**
   - Máximo de requisições AI por dia: **\_**
   - Máximo de requisições AI por mês: **\_**
   - Acesso a templates: [ ] Apenas padrão [ ] Todos [ ] Nenhum
   - Max Mode disponível: [ ] Sim [ ] Não

   **Plano Básico ($**\_**/mês):**

   - Máximo de workspaces: **\_**
   - Máximo de companies por workspace: **\_**
   - Máximo de tiles por company: **\_**
   - Máximo de contacts: **\_**
   - Máximo de notes: **\_**
   - Máximo de requisições AI por dia: **\_**
   - Máximo de requisições AI por mês: **\_**
   - Acesso a templates: [ ] Apenas padrão [ ] Todos [ ] Customizados também
   - Max Mode disponível: [ ] Sim [ ] Não
   - Limite de Max Mode por mês: **\_**

   **Plano Pro ($**\_**/mês):**

   - Máximo de workspaces: [ ] Ilimitado [ ] **\_**
   - Máximo de companies por workspace: [ ] Ilimitado [ ] **\_**
   - Máximo de tiles por company: [ ] Ilimitado [ ] **\_**
   - Máximo de contacts: [ ] Ilimitado [ ] **\_**
   - Máximo de notes: [ ] Ilimitado [ ] **\_**
   - Máximo de requisições AI por dia: [ ] Ilimitado [ ] **\_**
   - Máximo de requisições AI por mês: [ ] Ilimitado [ ] **\_**
   - Acesso a templates: [ ] Todos incluindo customizados
   - Max Mode disponível: [ ] Sim, ilimitado [ ] Sim, limitado a **\_**/mês [ ] Não

   **Plano Enterprise ($**\_**/mês ou customizado):**

   - Tudo ilimitado?
   - Features extras: ********\_********

3. **Estratégia de Reset:**

   - Limites diários resetam: [ ] Meia-noite UTC [ ] Meia-noite horário do usuário [ ] Outro: **\_**
   - Limites mensais resetam: [ ] Dia 1 do mês [ ] Dia da assinatura [ ] Outro: **\_**

4. **O que acontece quando limite é atingido:**
   - [ ] Bloqueia completamente até reset
   - [ ] Permite upgrade para plano superior
   - [ ] Oferece compra de créditos extras
   - [ ] Outro: ********\_********

---

### 3. Tokens e Configurações de API

#### Decisão Necessária: Configurar tokens e estratégias comerciais

**Situação Atual:**

- Sistema precisa de `OPENAI_API_KEY` configurada
- Não há sistema de rate limiting por usuário
- Não há controle de custos por usuário

**Perguntas para Você:**

1. **OpenAI API Key:**

   - [ ] Você já tem uma chave? (precisa fornecer)
   - [ ] Precisa criar uma nova?
   - [ ] Quer usar múltiplas chaves (rotação)?

2. **Rate Limiting:**

   - Limite de requisições por segundo por usuário: **\_**
   - Limite de requisições por minuto por usuário: **\_**
   - Limite global de requisições por segundo: **\_**

3. **Controle de Custos:**

   - [ ] Limitar custo total por mês: $**\_**
   - [ ] Alertar quando custo atingir: $**\_**
   - [ ] Bloquear requisições se custo exceder: $**\_**
   - [ ] Outro controle: ********\_********

4. **Estratégia de Fallback:**
   - Se OpenAI API falhar: [ ] Retornar erro [ ] Usar modelo alternativo [ ] Cache de respostas anteriores
   - Modelo alternativo (se aplicável): ********\_********

---

### 4. Estratégias Comerciais Envolvendo Aspectos Técnicos

#### Decisão Necessária: Como monetizar features técnicas

**Perguntas para Você:**

1. **Max Mode como Feature Premium:**

   - [ ] Max Mode disponível apenas em planos pagos
   - [ ] Max Mode disponível em todos os planos mas limitado
   - [ ] Max Mode como add-on separado ($**\_**/mês)
   - [ ] Outro: ********\_********

2. **Tamanhos de Requisição:**

   - [ ] Todos os tamanhos disponíveis em todos os planos
   - [ ] "Alto" apenas em planos pagos
   - [ ] "Alto" como feature premium separada
   - [ ] Outro: ********\_********

3. **Templates Customizados:**

   - [ ] Apenas planos pagos podem criar templates customizados
   - [ ] Todos podem criar mas limitado a **\_** templates no free
   - [ ] Templates como feature premium
   - [ ] Outro: ********\_********

4. **Dashboards Múltiplos:**

   - [ ] Apenas planos pagos podem criar múltiplos dashboards
   - [ ] Free: 1 dashboard, Paid: ilimitado
   - [ ] Outro: ********\_********

5. **Regeneração de Tiles:**

   - [ ] Ilimitada em todos os planos
   - [ ] Limitada por plano (Free: 5/mês, Paid: ilimitado)
   - [ ] Outro: ********\_********

6. **Chat com Tiles/Contacts:**
   - [ ] Ilimitado em todos os planos
   - [ ] Limitado por plano (Free: 10/mês, Paid: ilimitado)
   - [ ] Outro: ********\_********

---

## 🗄️ CONFIGURAÇÕES DE BANCO DE DADOS

### 5. MongoDB vs Outras Opções

#### Decisão Necessária: Onde persistir dados?

**Situação Atual:**

- Guest workspaces persistem em MongoDB
- Workspaces reais não persistem (apenas cookies/localStorage)
- Roadmap prevê migração completa para MongoDB

**Perguntas para Você:**

1. **Banco de Dados:**

   - [ ] MongoDB Atlas (recomendado, já em uso parcial)
   - [ ] PostgreSQL (Netlify DB)
   - [ ] Outro: ********\_********

2. **Estratégia de Migração:**

   - [ ] Migrar tudo para MongoDB agora
   - [ ] Manter guest em MongoDB, migrar resto depois
   - [ ] Usar solução híbrida temporariamente
   - [ ] Outro: ********\_********

3. **Backup e Segurança:**
   - Frequência de backup: [ ] Diário [ ] Semanal [ ] Mensal
   - Retenção de backups: **\_** dias
   - [ ] Criptografia de dados sensíveis
   - [ ] Conformidade com LGPD/GDPR

---

## 🔐 AUTENTICAÇÃO E SEGURANÇA

### 6. Clerk vs Outras Opções

#### Decisão Necessária: Sistema de autenticação

**Situação Atual:**

- Clerk planejado mas não integrado (Fase 3)
- Sistema atual usa guest mode (cookies)

**Perguntas para Você:**

1. **Provedor de Autenticação:**

   - [ ] Clerk (recomendado no roadmap)
   - [ ] Auth0
   - [ ] NextAuth.js
   - [ ] Solução própria
   - [ ] Outro: ********\_********

2. **Métodos de Login:**

   - [ ] Email/Senha
   - [ ] OAuth (Google, GitHub, etc)
   - [ ] Magic Link
   - [ ] SSO (para Enterprise)
   - [ ] Todos os acima

3. **Guest Mode:**
   - [ ] Manter guest mode (trial sem cadastro)
   - [ ] Remover guest mode (obrigar cadastro)
   - [ ] Guest mode limitado a **\_** dias

---

## 💳 PAGAMENTOS

### 7. Stripe Configuration

#### Decisão Necessária: Configurar Stripe

**Situação Atual:**

- Stripe planejado mas não integrado (Fase 3)
- Não há checkout funcionando

**Perguntas para Você:**

1. **Stripe Account:**

   - [ ] Você já tem conta Stripe?
   - [ ] Precisa criar conta?
   - [ ] Modo de teste ou produção?

2. **Produtos e Preços:**

   - Criar produtos no Stripe para cada plano
   - Definir preços mensais/anuais
   - Configurar webhooks

3. **Moeda:**

   - [ ] USD ($)
   - [ ] BRL (R$)
   - [ ] EUR (€)
   - [ ] Múltiplas moedas
   - [ ] Outro: ********\_********

4. **Ciclo de Cobrança:**

   - [ ] Apenas mensal
   - [ ] Mensal e anual (com desconto)
   - [ ] Outro: ********\_********

5. **Período de Trial:**
   - [ ] Sem trial
   - [ ] Trial de **\_** dias
   - [ ] Trial apenas para plano específico

---

## 📊 MONITORAMENTO E ANALYTICS

### 8. Métricas e Monitoramento

#### Decisão Necessária: O que monitorar?

**Perguntas para Você:**

1. **Métricas Importantes:**

   - [ ] Número de requisições AI por usuário
   - [ ] Custo por usuário
   - [ ] Taxa de conversão (guest → paid)
   - [ ] Uso de features por plano
   - [ ] Outros: ********\_********

2. **Alertas:**

   - [ ] Alertar quando custo mensal atingir: $**\_**
   - [ ] Alertar quando usuário atingir limite
   - [ ] Alertar em caso de erro de API
   - [ ] Outros: ********\_********

3. **Dashboard de Analytics:**
   - [ ] Quer dashboard interno para ver métricas?
   - [ ] Integrar com Google Analytics?
   - [ ] Outro: ********\_********

---

## 🎨 PERSONALIZAÇÃO E BRANDING

### 9. Configurações de Tema

#### Decisão Necessária: Personalização visual

**Situação Atual:**

- Sistema tem color picker funcionando
- Cores são personalizáveis por workspace

**Perguntas para Você:**

1. **Cores Padrão:**

   - Cor base padrão: #**\_**
   - Cores da marca: ********\_********

2. **Limitações de Personalização:**
   - [ ] Usuários podem personalizar cores livremente
   - [ ] Apenas planos pagos podem personalizar
   - [ ] Personalização limitada a paleta pré-definida
   - [ ] Outro: ********\_********

---

## 📝 PRÓXIMOS PASSOS

### Após Preencher Este Documento:

1. ✅ Revisar todas as respostas
2. ✅ Priorizar implementações baseadas nas decisões
3. ✅ Atualizar código com as configurações definidas
4. ✅ Configurar variáveis de ambiente
5. ✅ Testar fluxos completos
6. ✅ Documentar decisões finais

---

## ⚠️ IMPORTANTE

**Este documento deve ser preenchido completamente antes de:**

- Integração com Stripe
- Integração com Clerk
- Migração completa para MongoDB
- Lançamento em produção

**Decisões pendentes podem causar:**

- Retrabalho
- Custo excessivo de API
- Experiência ruim do usuário
- Problemas de escalabilidade

---

## 📞 Contato

Se tiver dúvidas sobre qualquer item deste documento, entre em contato para discutirmos as melhores opções técnicas e comerciais.
