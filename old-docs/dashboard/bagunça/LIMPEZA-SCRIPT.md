# 🧹 **SCRIPT DE LIMPEZA DE DADOS ÓRFÃOS**

## 📋 **O QUE FAZ**

O script `cleanup-orphan-data.js` foi criado para:

- ✅ **Remover dados antigos** sem `userId` do MongoDB
- ✅ **Limpar usuários órfãos** sem `clerkId`
- ✅ **Relatório detalhado** de tudo que será removido
- ✅ **Confirmação manual** obrigatória (segurança)
- ✅ **Auto-destruição** após execução bem-sucedida
- ✅ **Logs coloridos** para acompanhar o processo

## ⚠️ **ATENÇÃO - IMPORTANTE**

**🚨 ESTE SCRIPT É DESTRUTIVO!**

- Remove dados **PERMANENTEMENTE**
- **NÃO É POSSÍVEL** desfazer as operações
- **FAÇA BACKUP** do seu banco antes de executar
- **TESTE PRIMEIRO** em ambiente de desenvolvimento

## 🎯 **DADOS QUE SERÃO REMOVIDOS**

1. **Content Types** sem `userId`
2. **Sections** sem `userId`
3. **Items** sem `userId`
4. **Users** sem `clerkId`

## 🚀 **COMO USAR**

### 1. Navegue até a pasta do dashboard:

```bash
cd dashboard
```

### 2. Execute o script:

```bash
node cleanup-orphan-data.js
```

### 3. Siga as confirmações:

- ✅ Confirme o escaneamento
- ✅ Revise o relatório de dados órfãos
- ✅ Confirme a deleção **2 vezes** (segurança)
- ✅ Escolha se quer auto-destruir o script

## 📊 **EXEMPLO DE EXECUÇÃO**

```bash
[2024-01-15T10:30:00.000Z] 🧹 INICIANDO LIMPEZA DE DADOS ÓRFÃOS
[2024-01-15T10:30:00.001Z] ⚠️ ESTE SCRIPT DELETA DADOS PERMANENTEMENTE!
Deseja continuar? (sim/não): sim

[2024-01-15T10:30:01.000Z] 🔌 Conectando ao MongoDB...
[2024-01-15T10:30:01.200Z] ✅ Conectado!
[2024-01-15T10:30:01.300Z] 🔍 Escaneando dados órfãos...

[2024-01-15T10:30:02.000Z] 📊 ÓRFÃOS ENCONTRADOS: 15 registros
[2024-01-15T10:30:02.001Z]    Content Types: 5
[2024-01-15T10:30:02.002Z]    Sections: 8
[2024-01-15T10:30:02.003Z]    Items: 2
[2024-01-15T10:30:02.004Z]    Users: 0

🚨 CONFIRMA DELEÇÃO PERMANENTE? (sim/não): sim

[2024-01-15T10:30:05.000Z] 🧹 Limpando...
[2024-01-15T10:30:05.100Z] ✅ Content types: 5 removidos
[2024-01-15T10:30:05.200Z] ✅ Sections: 8 removidas
[2024-01-15T10:30:05.300Z] ✅ Items: 2 removidos

[2024-01-15T10:30:05.400Z] 🎉 LIMPEZA CONCLUÍDA! 15 registros removidos

🚨 Auto-destruir script? (sim/não): sim
[2024-01-15T10:30:08.000Z] 💥 Script auto-destruído!
```

## 🔧 **VARIÁVEIS DE AMBIENTE**

O script usa a variável `MONGODB_URI` do seu `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/dashboard-engine
```

## 🛡️ **RECURSOS DE SEGURANÇA**

1. **Dupla confirmação** antes de deletar
2. **Relatório detalhado** do que será removido
3. **Logs coloridos** para acompanhar cada etapa
4. **Tratamento de erros** robusto
5. **Auto-destruição opcional** do script

## 🚨 **EM CASO DE EMERGÊNCIA**

Se algo der errado durante a execução:

1. **Ctrl+C** para interromper o script
2. **Restaurar backup** do banco de dados
3. **Verificar logs** para entender o que aconteceu

## ✅ **APÓS A EXECUÇÃO**

1. ✅ **Dados órfãos removidos**
2. ✅ **Banco de dados limpo**
3. ✅ **Script auto-destruído** (se escolhido)
4. ✅ **Aplicação funcionando** sem dados antigos

---

## 🎯 **QUANDO USAR**

- Após **migração de sistema**
- Para **limpar dados de teste**
- Quando houver **inconsistências** no banco
- Para **preparar produção**

**💡 DICA:** Execute primeiro em desenvolvimento para testar!
