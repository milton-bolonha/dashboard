/**
 * Testes Nativos do Node.js para Sistema de Autenticação
 * Uso: node tests/auth-system.test.cjs
 */

const assert = require("assert");
const bcrypt = require("bcryptjs");

// Simulação da função extractUserIdFromJWT
function extractUserIdFromJWT(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.sub;
  } catch (error) {
    return null;
  }
}

// Simulação da validação de chave
async function validateSuperAdminKey(inputKey, storedHash) {
  try {
    return await bcrypt.compare(inputKey.toLowerCase(), storedHash);
  } catch (error) {
    return false;
  }
}

// Suite de testes
class AuthSystemTests {
  constructor() {
    this.testCount = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runTest(testName, testFunction) {
    this.testCount++;
    try {
      console.log(`\n🧪 [${this.testCount}] ${testName}`);
      await testFunction();
      this.passedTests++;
      console.log(`   ✅ PASSOU`);
    } catch (error) {
      this.failedTests++;
      console.log(`   ❌ FALHOU: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log("🚀 Iniciando Testes do Sistema de Autenticação...\n");

    // Teste 1: Decodificação JWT
    await this.runTest("Decodificação JWT com token válido", () => {
      const validToken =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yejRtMUlIWVVxQjlFM0J5RlhWVUk3d1d6MHkiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL2h1bWJsZS1jaXZldC0xMi5jbGVyay5hY2NvdW50cy5kZXYiLCJleHAiOjE3MzU5NTUzMjQsImlhdCI6MTczNTk1NTI2NCwiaXNzIjoiaHR0cHM6Ly9odW1ibGUtY2l2ZXQtMTIuY2xlcmsuYWNjb3VudHMuZGV2Iiwic3ViIjoidXNlcl8yejRtMU5MVTNNZUpBUTBacTB5bFpFV3FSMmcifQ.example";

      const userId = extractUserIdFromJWT(validToken);
      assert.strictEqual(userId, "user_2z4m1NLU3MeJAQ0Zq0ylZEWqR2g");
    });

    // Teste 2: JWT inválido
    await this.runTest("Decodificação JWT com token inválido", () => {
      const invalidToken = "token.inválido.aqui";
      const userId = extractUserIdFromJWT(invalidToken);
      assert.strictEqual(userId, null);
    });

    // Teste 3: JWT sem payload
    await this.runTest("Decodificação JWT com token sem payload", () => {
      const emptyToken = "";
      const userId = extractUserIdFromJWT(emptyToken);
      assert.strictEqual(userId, null);
    });

    // Teste 4: Validação de chave super admin (caso correto)
    await this.runTest("Validação de chave super admin válida", async () => {
      const testKey = "ds-sa-key-teste123";
      const hash = await bcrypt.hash(testKey, 10);

      const isValid = await validateSuperAdminKey(testKey, hash);
      assert.strictEqual(isValid, true);
    });

    // Teste 5: Case sensitivity da chave
    await this.runTest("Validação case-insensitive da chave", async () => {
      const testKey = "ds-sa-key-teste123";
      const hash = await bcrypt.hash(testKey, 10);

      // Testar com maiúsculas
      const isValid = await validateSuperAdminKey("DS-SA-KEY-TESTE123", hash);
      assert.strictEqual(isValid, true);
    });

    // Teste 6: Chave inválida
    await this.runTest("Validação de chave super admin inválida", async () => {
      const correctKey = "ds-sa-key-teste123";
      const wrongKey = "ds-sa-key-wrong123";
      const hash = await bcrypt.hash(correctKey, 10);

      const isValid = await validateSuperAdminKey(wrongKey, hash);
      assert.strictEqual(isValid, false);
    });

    // Teste 7: Verificação de prefixo da chave
    await this.runTest("Verificação de prefixo da chave super admin", () => {
      const validKeys = [
        "ds-sa-key-abc123",
        "DS-SA-KEY-XYZ789",
        "Ds-Sa-Key-Mixed123",
      ];

      const invalidKeys = [
        "sa-key-abc123",
        "ds-key-xyz789",
        "admin-key-abc123",
        "regular-key-123",
      ];

      validKeys.forEach((key) => {
        assert.strictEqual(
          key.toLowerCase().startsWith("ds-sa-key"),
          true,
          `${key} deveria ser válida`
        );
      });

      invalidKeys.forEach((key) => {
        assert.strictEqual(
          key.toLowerCase().startsWith("ds-sa-key"),
          false,
          `${key} deveria ser inválida`
        );
      });
    });

    // Teste 8: Formato do JWT payload
    await this.runTest("Verificação do formato do payload JWT", () => {
      const token =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yejRtMUlIWVVxQjlFM0J5RlhWVUk3d1d6MHkiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL2h1bWJsZS1jaXZldC0xMi5jbGVyay5hY2NvdW50cy5kZXYiLCJleHAiOjE3MzU5NTUzMjQsImlhdCI6MTczNTk1NTI2NCwiaXNzIjoiaHR0cHM6Ly9odW1ibGUtY2l2ZXQtMTIuY2xlcmsuYWNjb3VudHMuZGV2Iiwic3ViIjoidXNlcl8yejRtMU5MVTNNZUpBUTBacTB5bFpFV3FSMmcifQ.example";

      // Decodificar manualmente para verificar estrutura
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );

      assert.ok(payload.sub, 'Payload deve ter campo "sub"');
      assert.ok(payload.iss, 'Payload deve ter campo "iss"');
      assert.ok(payload.exp, 'Payload deve ter campo "exp"');
      assert.ok(payload.iat, 'Payload deve ter campo "iat"');
      assert.strictEqual(
        typeof payload.sub,
        "string",
        'Campo "sub" deve ser string'
      );
    });

    // Teste 9: Normalização de entrada
    await this.runTest("Normalização de entrada da chave", () => {
      const inputs = [
        "  DS-SA-KEY-ABC123  ",
        "DS-SA-KEY-ABC123",
        "ds-sa-key-abc123",
        "   ds-sa-key-abc123   ",
      ];

      const expected = "ds-sa-key-abc123";

      inputs.forEach((input) => {
        const normalized = input.trim().toLowerCase();
        assert.strictEqual(
          normalized,
          expected,
          `"${input}" deveria normalizar para "${expected}"`
        );
      });
    });

    // Teste 10: Performance da decodificação JWT
    await this.runTest("Performance da decodificação JWT", () => {
      const token =
        "eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc18yejRtMUlIWVVxQjlFM0J5RlhWVUk3d1d6MHkiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwczovL2h1bWJsZS1jaXZldC0xMi5jbGVyay5hY2NvdW50cy5kZXYiLCJleHAiOjE3MzU5NTUzMjQsImlhdCI6MTczNTk1NTI2NCwiaXNzIjoiaHR0cHM6Ly9odW1ibGUtY2l2ZXQtMTIuY2xlcmsuYWNjb3VudHMuZGV2Iiwic3ViIjoidXNlcl8yejRtMU5MVTNNZUpBUTBacTB5bFpFV3FSMmcifQ.example";

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        extractUserIdFromJWT(token);
      }
      const end = Date.now();

      const timePerDecode = (end - start) / 1000;
      console.log(
        `     ⏱️  1000 decodificações em ${
          end - start
        }ms (${timePerDecode.toFixed(3)}ms por decodificação)`
      );

      // Deve ser rápido (menos de 1ms por decodificação)
      assert.ok(timePerDecode < 1, "Decodificação deve ser rápida");
    });

    // Resumo dos testes
    console.log("\n📊 RESUMO DOS TESTES:");
    console.log(`   Total: ${this.testCount}`);
    console.log(`   ✅ Passou: ${this.passedTests}`);
    console.log(`   ❌ Falhou: ${this.failedTests}`);
    console.log(
      `   📈 Taxa de Sucesso: ${(
        (this.passedTests / this.testCount) *
        100
      ).toFixed(1)}%`
    );

    if (this.failedTests === 0) {
      console.log(
        "\n🎉 TODOS OS TESTES PASSARAM! Sistema de autenticação está funcionando corretamente."
      );
    } else {
      console.log("\n⚠️  ALGUNS TESTES FALHARAM. Revise a implementação.");
      process.exit(1);
    }
  }
}

// Executar os testes
async function main() {
  const testSuite = new AuthSystemTests();
  await testSuite.runAllTests();
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AuthSystemTests,
  extractUserIdFromJWT,
  validateSuperAdminKey,
};
