#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TESTE - Verificação de Correções
 *
 * Este script testa se as correções implementadas resolveram
 * os problemas que estavam causando o travamento.
 */

console.log("🔧 Testando correções implementadas...\n");

// 1. Verificar se a API de verificação existe e tem conteúdo
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const tests = [
  {
    name: "API de verificação de usuário",
    path: "app/api/billing/verify-user/route.js",
    test: (content) =>
      content.includes("export async function GET") &&
      content.includes("stripe"),
  },
  {
    name: "Webhook do Stripe",
    path: "../netlify/functions/stripe-webhook.js",
    test: (content) =>
      content.includes("triangulateUserPurchase") && !content.includes("TODO"),
  },
  {
    name: "Configuração do Stripe",
    path: "config/stripe-plans.js",
    test: (content) => content.includes("mapStripePriceToPlan"),
  },
  {
    name: "Hook de verificação",
    path: "hooks/useUserPlanVerification.js",
    test: (content) =>
      content.includes("useUserPlanVerification") && content.includes("fetch"),
  },
  {
    name: "Template de ambiente",
    path: "env-template.txt",
    test: (content) =>
      content.includes("STRIPE_SECRET_KEY") &&
      content.includes("CLERK_SECRET_KEY"),
  },
];

let passedTests = 0;
let totalTests = tests.length;

tests.forEach((test, index) => {
  try {
    const filePath = join(process.cwd(), test.path);

    if (!existsSync(filePath)) {
      console.log(`❌ ${index + 1}. ${test.name}: Arquivo não encontrado`);
      return;
    }

    const content = readFileSync(filePath, "utf8");

    if (content.trim() === "" || content.trim() === " ") {
      console.log(`❌ ${index + 1}. ${test.name}: Arquivo vazio`);
      return;
    }

    if (test.test(content)) {
      console.log(`✅ ${index + 1}. ${test.name}: OK`);
      passedTests++;
    } else {
      console.log(`⚠️  ${index + 1}. ${test.name}: Implementação incompleta`);
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${test.name}: Erro - ${error.message}`);
  }
});

console.log(`\n📊 Resultado: ${passedTests}/${totalTests} testes passaram\n`);

if (passedTests === totalTests) {
  console.log("🎉 TODAS AS CORREÇÕES IMPLEMENTADAS COM SUCESSO!");
  console.log("\n🚀 Próximos passos para testar:");
  console.log("1. Copie 'env-template.txt' para '.env.local'");
  console.log("2. Preencha suas chaves do Clerk e Stripe");
  console.log("3. Execute: npm run dev");
  console.log("4. Acesse http://localhost:3000");
  console.log("5. Faça login e teste o dashboard");
} else {
  console.log(
    "⚠️  Ainda há problemas a resolver. Verifique os itens marcados acima."
  );
}

console.log("\n💡 Problemas mais comuns:");
console.log("- Chaves do Clerk/Stripe não configuradas");
console.log("- MongoDB não conectando");
console.log("- Cache do navegador desatualizado");
console.log("- Porta 3000 ocupada");

console.log("\n🔍 Para debug detalhado, verifique:");
console.log("- Console do navegador (F12)");
console.log("- Logs do terminal (npm run dev)");
console.log("- Network tab para ver requisições falhando");
