# Regras de Negócio - Sistema de Chaves de Acesso

## Visão Geral

O sistema de chaves de acesso permite que super administradores criem códigos especiais que usuários podem usar para:

- Fazer upgrade de planos
- Ativar funcionalidades específicas
- Adicionar complementos (addons)

## Tipos de Chaves

### 1. Chaves de Plano (`plan`)

- **Propósito**: Upgrade automático para um plano específico
- **Funcionamento**: Quando ativada, o usuário é promovido para o plano definido na chave
- **Uso Comum**: Promoções, beta testers, demos

### 2. Chaves de Funcionalidade (`feature`)

- **Propósito**: Ativar funcionalidades específicas sem mudar o plano
- **Funcionamento**: Adiciona permissões específicas ao usuário
- **Uso Comum**: Testes de funcionalidades, acesso temporário

### 3. Chaves de Complemento (`addon`)

- **Propósito**: Adicionar complementos específicos
- **Funcionamento**: Ativa addons adicionais no workspace do usuário
- **Uso Comum**: Recursos premium, extensões

## Configurações de Uso

### Limites de Uso

- **Máximo de Usos**: Define quantas vezes a chave pode ser usada
  - `0` = Uso ilimitado
  - `1` = Uso único (padrão)
  - `N` = Número específico de usos

### Controles de Reutilização

- **Múltiplos usos por usuário**: Se o mesmo usuário pode usar a chave várias vezes
- **Múltiplos usos por workspace**: Se a chave pode ser usada em diferentes workspaces

## Fluxo de Ativação

### 1. Criação da Chave (Super Admin)

1. Super admin acessa `/dashboard/admin/access-keys`
2. Clica em "Nova Chave"
3. Preenche informações:
   - Nome e descrição
   - Tipo (plan/feature/addon)
   - Configurações de uso
   - Restrições (se aplicável)
4. Sistema gera código único automaticamente

### 2. Distribuição

- Super admin compartilha o código com usuários autorizados
- Códigos são únicos e não podem ser adivinhados

### 3. Ativação pelo Usuário

1. Usuário acessa `/dashboard/access/permissions`
2. Clica no botão "Ativar Chave"
3. Insere o código da chave
4. Sistema valida:
   - Chave existe e está ativa
   - Não excedeu limite de usos
   - Usuário pode usar (se há restrições)
   - Workspace pode usar (se há restrições)
5. Se válida, aplica os benefícios

## Validações e Restrições

### Validações de Ativação

- ✅ Chave existe no sistema
- ✅ Chave está ativa (`isActive: true`)
- ✅ Não excedeu limite de usos
- ✅ Usuário está autenticado
- ✅ Workspace está selecionado
- ✅ Restrições de email/domínio (se aplicável)

### Prevenção de Abuso

- **Limite de usos**: Evita uso excessivo
- **Controle por usuário**: Evita que mesmo usuário abuse
- **Controle por workspace**: Evita uso em múltiplos workspaces
- **Restrições de email**: Limita a usuários específicos
- **Restrições de domínio**: Limita a organizações específicas

## Estados da Chave

### Ativa (`isActive: true`)

- Pode ser usada para ativação
- Aparece na listagem como "Ativa"
- Contabiliza usos

### Inativa (`isActive: false`)

- Não pode ser usada
- Aparece na listagem como "Inativa"
- Pode ser reativada pelo super admin

### Revogada

- Estado especial de inativa
- Não pode ser reativada
- Histórico de revogação mantido

## Monitoramento e Auditoria

### Métricas Disponíveis

- **Total de chaves**: Quantidade total criada
- **Chaves ativas**: Quantidade atualmente utilizável
- **Total de usos**: Soma de todas as ativações
- **Chaves por tipo**: Distribuição por plan/feature/addon

### Histórico de Uso

- Cada ativação é registrada com:
  - Data/hora da ativação
  - Usuário que ativou
  - Workspace onde foi ativada
  - IP de origem (se disponível)

## Regras de Negócio Específicas

### Chaves de Plano

1. **Upgrade Automático**: Usuário é promovido para o plano especificado
2. **Não Downgrade**: Chave não pode rebaixar um plano superior
3. **Workspace Único**: Plano é aplicado apenas ao workspace atual
4. **Sincronização**: Mudança é sincronizada com sistema de billing

### Chaves de Funcionalidade

1. **Permissões Aditivas**: Funcionalidades são adicionadas, não substituídas
2. **Escopo Workspace**: Funcionalidades são aplicadas apenas ao workspace atual
3. **Temporárias**: Podem ter data de expiração (futuro)

### Chaves de Complemento

1. **Addons Específicos**: Cada chave ativa um addon específico
2. **Compatibilidade**: Addon deve ser compatível com o plano atual
3. **Limites**: Respeitam limites do plano base

## Segurança

### Geração de Códigos

- Códigos são gerados aleatoriamente
- Não seguem padrões previsíveis
- Comprimento suficiente para evitar força bruta

### Validação de Acesso

- Apenas super admins podem criar/gerenciar chaves
- Usuários comuns só podem ativar chaves
- Logs de segurança para todas as operações

### Proteção contra Abuso

- Rate limiting na ativação
- Monitoramento de padrões suspeitos
- Revogação automática se necessário

## Cenários de Uso

### 1. Promoção de Plano

```
Situação: Black Friday - 50% desconto no plano Pro
Solução: Criar chave tipo "plan" com upgrade para Pro
Configuração: Múltiplos usos, sem restrições
```

### 2. Beta Testing

```
Situação: Testar nova funcionalidade com usuários selecionados
Solução: Criar chave tipo "feature" com funcionalidade específica
Configuração: Uso único por usuário, emails específicos
```

### 3. Demo para Cliente

```
Situação: Demonstrar funcionalidades premium para prospect
Solução: Criar chave tipo "addon" com recursos premium
Configuração: Uso único, domínio específico do cliente
```

## Troubleshooting

### Problemas Comuns

#### "Chave não encontrada"

- Verificar se código foi digitado corretamente
- Confirmar se chave não foi revogada
- Verificar se chave ainda está ativa

#### "Limite de usos excedido"

- Verificar configuração de máximo de usos
- Criar nova chave se necessário
- Ajustar limites da chave existente

#### "Usuário não autorizado"

- Verificar restrições de email/domínio
- Confirmar se usuário está no workspace correto
- Verificar se usuário tem permissão básica

### Logs de Debug

- Ativar `DASH_DEBUG_MODE=true` para logs detalhados
- Verificar logs de ativação em `/api/access-keys/activate`
- Monitorar métricas de uso no dashboard admin

## Futuras Melhorias

### Planejadas

- [ ] Chaves com data de expiração
- [ ] Chaves com limite de tempo de uso
- [ ] Notificações automáticas de uso
- [ ] Relatórios de uso por período
- [ ] API para integração externa

### Consideradas

- [ ] Chaves com código customizado
- [ ] Chaves com QR Code
- [ ] Chaves com link de ativação
- [ ] Chaves com aprovação manual
