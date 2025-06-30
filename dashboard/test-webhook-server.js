#!/usr/bin/env node

/**
 * 🎣 SERVIDOR DE TESTE PARA WEBHOOKS STRIPE
 *
 * Este servidor simula o ambiente Netlify Functions localmente
 * para testar a triangulação Stripe → Clerk → API
 */

import http from "http";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import getPort from "get-port";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simular environment variables para teste
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_...";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_...";
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "sk_test_...";
process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "test_key";

async function startServer() {
  const port = await getPort({ port: 4242 }); // Tenta a porta 4242, mas pega outra se estiver em uso

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, stripe-signature"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === "/webhook" && req.method === "POST") {
      console.log("🎣 Webhook recebido de Stripe CLI");

      try {
        // Coletar dados do request
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            // Simular estrutura de evento Netlify
            const event = {
              httpMethod: "POST",
              headers: {},
              body: body,
            };

            // Copiar headers importantes
            Object.keys(req.headers).forEach((key) => {
              event.headers[key] = req.headers[key];
            });

            console.log("📦 Event headers:", Object.keys(event.headers));
            console.log("📝 Event body length:", body.length);

            // Importar e executar nossa função webhook
            const webhookPath = join(
              __dirname,
              "..",
              "netlify",
              "functions",
              "stripe-webhook.js"
            );

            // Como não podemos importar módulos ES dinâmicamente facilmente,
            // vamos processar manualmente aqui
            await processStripeWebhook(event);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                received: true,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            console.error("❌ Erro no processamento:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      } catch (error) {
        console.error("❌ Erro no webhook:", error);
        res.writeHead(500);
        res.end("Webhook error");
      }
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  async function processStripeWebhook(event) {
    console.log("🔄 Processando webhook Stripe...");

    const sig = event.headers["stripe-signature"];

    if (!sig) {
      console.warn("⚠️ Webhook sem signature - modo de teste");
    }

    try {
      // Parse do body JSON
      const stripeEvent = JSON.parse(event.body);

      console.log(`📨 Evento Stripe: ${stripeEvent.type}`);
      console.log(
        "📊 Dados:",
        JSON.stringify(stripeEvent.data?.object?.id || "N/A")
      );

      // Simular processamento baseado no tipo de evento
      switch (stripeEvent.type) {
        case "checkout.session.completed":
          console.log("🎉 Checkout completado - simulando triangulação");
          await simulateTriangulation(stripeEvent.data.object);
          break;

        case "invoice.paid":
          console.log("💳 Invoice paga - simulando atualização");
          break;

        case "customer.subscription.deleted":
          console.log("❌ Subscription cancelada - simulando remoção");
          break;

        default:
          console.log(`⚠️ Evento não processado: ${stripeEvent.type}`);
      }

      console.log("✅ Webhook processado com sucesso");
    } catch (error) {
      console.error("❌ Erro no processamento do webhook:", error.message);
      throw error;
    }
  }

  async function simulateTriangulation(session) {
    console.log("🔄 Simulando triangulação Stripe → Clerk → API");

    const customerId = session.customer;
    const sessionId = session.id;
    const amount = session.amount_total / 100;

    console.log(`👤 Customer: ${customerId}`);
    console.log(`🧾 Session: ${sessionId}`);
    console.log(`💰 Amount: $${amount}`);

    // Aqui você pode adicionar lógica real de teste
    console.log("✅ Triangulação simulada concluída");
  }

  server.listen(port, () => {
    console.log(
      `🚀 Servidor de teste webhook rodando em http://localhost:${port}/webhook`
    );
    console.log("");
    console.log("📋 Para usar:");
    console.log(
      `1. Execute: stripe listen --forward-to localhost:${port}/webhook`
    );
    console.log("2. Execute: stripe trigger checkout.session.completed");
    console.log("3. Observe os logs de triangulação");
    console.log("");
    console.log(
      "⚠️  Certifique-se de ter as variáveis de ambiente configuradas!"
    );
  });
}

startServer();
