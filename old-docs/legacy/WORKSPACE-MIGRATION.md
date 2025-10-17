# 🚀 Migração para Workspaces - Guia Completo

## ⚡ Execução Rápida

```bash
# Executar migração
npm run migrate:workspaces
```

## 📋 O que a Migração Faz

### Automaticamente:

1. **Busca usuários únicos** no sistema atual
2. **Cria workspace padrão** para cada usuário
3. **Migra dados existentes** (Content Types, Sections, Items)
4. **Preserva todos os dados** sem perda
5. **Valida cada etapa** com logs detalhados

### Estrutura do Workspace Criado:

- **Nome**: "Meu Workspace Principal"
- **Plano**: Free (1 usuário, 3 content types, 5 sections, 100 items)
- **Owner**: Usuário original com todas as permissões
- **Status**: Ativo

## 🔧 Verificação Pós-Migração

### Testes Manuais:

1. **Login no dashboard** - deve funcionar normalmente
2. **WorkspaceSelector no TopBar** - deve aparecer workspace criado
3. **Content Types/Sections/Items** - devem aparecer todos os dados
4. **Criar novos registros** - deve funcionar com workspaceId

### Debug:

```bash
# Ver logs da migração
node scripts/run-migration.js

# Status detalhado
console.log("Workspace atual:", currentWorkspace);
```

## ⚠️ Pontos de Atenção

### Antes da Migração:

- ✅ Backup do banco MongoDB
- ✅ Verificar variáveis de ambiente
- ✅ Sistema funcionando normalmente

### Durante a Migração:

- ⏱️ **Pode levar alguns minutos** para muitos usuários
- 📊 **Logs detalhados** mostram progresso
- 🔄 **Reversível** - dados originais preservados

### Após a Migração:

- 🔍 Testar criação de novos registros
- 🎯 Verificar filtros por workspace
- 📱 Confirmar UX do WorkspaceSelector

## 📊 Exemplo de Saída da Migração

```bash
🚀 Dashboard Engine - Migração para Workspaces
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 STEP 1: Status Atual
🔍 Verificando status da migração...
   Workspaces criados: 0
   Content Types migrados: 0
   Content Types pendentes: 12
   Sections migradas: 0
   Sections pendentes: 8
   Items migrados: 0
   Items pendentes: 25

🔄 STEP 2: Iniciando Migração
📊 Encontrados 3 usuários únicos

👤 Migrando usuário: user_ABC123
✅ Workspace criado: ObjectId('...')
📋 Migrando contentTypes: 5 registros
   ✅ contentTypes: 5/5 migrados
📋 Migrando sections: 3 registros
   ✅ sections: 3/3 migrados
📋 Migrando items: 12 registros
   ✅ items: 12/12 migrados
✅ Usuário user_ABC123 migrado com sucesso!

🎯 RELATÓRIO DE MIGRAÇÃO:
✅ Sucessos: 3
❌ Erros: 0
📊 Total: 3

🎉 Migração concluída com sucesso!
🎉 Sistema pronto para workspaces!
```

## 🎯 Próximos Passos

Após migração concluída com sucesso:

1. **Testar funcionalidades** básicas
2. **Implementar Sprint 5-6** (Multi-workspace UX)
3. **Configurar export APIs** (Sprint 7-8)
4. **Lançamento MVP** com workspaces

---

## 🆘 Troubleshooting

### "Erro de Conexão MongoDB"

```bash
# Verificar variáveis
echo $MONGODB_URI
# Testar conexão
npm run dev
```

### "Workspaces duplicados"

- Migração pode ser executada múltiplas vezes
- Verifica workspaces existentes antes de criar

### "Dados não aparecem"

- Verificar se workspaceId foi adicionado corretamente
- Checar logs de validação no console
