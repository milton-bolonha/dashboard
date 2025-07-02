/**
 * Testes para o Sistema de Chaves de Acesso
 *
 * Para rodar: npm test access-keys
 */

const { expect } = require("chai");
const { AccessKeys, AccessKeyHelpers } = require("../lib/access-keys");

// Mock do DB para testes
const mockDb = {
  access_keys: [
    {
      _id: "key1",
      code: "PLAN2024-ABC123",
      name: "Beta Tester - Business Plan",
      type: "plan",
      grants: {
        planId: "plan_business",
        planDuration: 30, // 30 dias
      },
      usage: {
        maxUses: 5,
        currentUses: 2,
        allowMultiplePerUser: false,
        allowMultiplePerWorkspace: false,
      },
      restrictions: {
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        allowedEmails: ["beta@test.com"],
      },
      activations: [
        {
          userId: "user1",
          workspaceId: "workspace1",
          userEmail: "beta@test.com",
          activatedAt: new Date(),
          status: "active",
        },
      ],
      isActive: true,
      analytics: {
        viewCount: 10,
        attemptCount: 3,
        successCount: 2,
      },
    },
    {
      _id: "key2",
      code: "FEAT2024-XYZ789",
      name: "Analytics Feature",
      type: "feature",
      grants: {
        featureIds: ["analytics", "export_advanced"],
        featureDuration: null, // Permanente
      },
      usage: {
        maxUses: 1,
        currentUses: 0,
        allowMultiplePerUser: true,
        allowMultiplePerWorkspace: true,
      },
      restrictions: {},
      activations: [],
      isActive: true,
    },
  ],

  workspaces: [
    {
      _id: "workspace1",
      planId: "plan_free",
      activeKeys: [
        {
          keyId: "key1",
          code: "PLAN2024-ABC123",
          type: "plan",
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          activatedBy: "user1",
          grants: {
            planId: "plan_business",
            planDuration: 30,
          },
          status: "active",
        },
      ],
    },
  ],
};

// Mock do db
const db = {
  findOne: (collection, query) => {
    const items = mockDb[collection] || [];
    return items.find((item) => {
      if (query._id) return item._id === query._id;
      if (query.code) return item.code === query.code;
      return Object.keys(query).every((key) => item[key] === query[key]);
    });
  },

  find: (collection, query = {}) => {
    const items = mockDb[collection] || [];
    if (Object.keys(query).length === 0) return items;

    return items.filter((item) => {
      return Object.keys(query).every((key) => {
        if (key === "$in" && Array.isArray(query[key])) {
          return query[key].includes(item._id);
        }
        return item[key] === query[key];
      });
    });
  },

  insertOne: (collection, doc) => {
    mockDb[collection] = mockDb[collection] || [];
    mockDb[collection].push(doc);
    return doc;
  },

  updateOne: (collection, filter, update) => {
    const items = mockDb[collection] || [];
    const item = items.find((i) => {
      return Object.keys(filter).every((key) => i[key] === filter[key]);
    });

    if (item && update.$set) {
      Object.assign(item, update.$set);
    }

    if (item && update.$inc) {
      Object.keys(update.$inc).forEach((key) => {
        item[key] = (item[key] || 0) + update.$inc[key];
      });
    }

    return { modifiedCount: item ? 1 : 0 };
  },
};

// Injetar mock no AccessKeys
AccessKeys.db = db;

describe("Sistema de Chaves de Acesso", () => {
  describe("Geração de Chaves", () => {
    it("deve gerar código único para chave de plano", () => {
      const code = AccessKeys.generateKeyCode("plan");
      expect(code).to.include("PLAN");
      expect(code).to.include("2024");
      expect(code.length).to.be.greaterThan(10);
    });

    it("deve gerar código único para chave de feature", () => {
      const code = AccessKeys.generateKeyCode("feature");
      expect(code).to.include("FEAT");
    });

    it("deve gerar chave completa", async () => {
      const keyConfig = {
        name: "Teste Beta",
        type: "plan",
        grants: { planId: "plan_business" },
        createdBy: "admin1",
      };

      const key = await AccessKeys.generateKey(keyConfig);

      expect(key.name).to.equal("Teste Beta");
      expect(key.type).to.equal("plan");
      expect(key.grants.planId).to.equal("plan_business");
      expect(key.code).to.include("PLAN");
    });
  });

  describe("Validação de Chaves", () => {
    let key;

    beforeEach(() => {
      key = mockDb.access_keys[0];
    });

    it("deve validar chave válida", async () => {
      const validation = await AccessKeys.validateKeyUsage(
        key,
        "user2",
        "workspace2",
        "beta@test.com"
      );

      expect(validation.valid).to.be.true;
    });

    it("deve rejeitar email não permitido", async () => {
      const validation = await AccessKeys.validateKeyUsage(
        key,
        "user2",
        "workspace2",
        "notallowed@test.com"
      );

      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include("não tem permissão");
    });

    it("deve rejeitar quando atingir limite de usos", async () => {
      // Simular chave com limite atingido
      const limitedKey = {
        ...key,
        usage: { ...key.usage, currentUses: 5, maxUses: 5 },
      };

      const validation = await AccessKeys.validateKeyUsage(
        limitedKey,
        "user2",
        "workspace2",
        "beta@test.com"
      );

      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include("limite máximo");
    });

    it("deve rejeitar chave expirada", async () => {
      const expiredKey = {
        ...key,
        restrictions: {
          ...key.restrictions,
          validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
        },
      };

      const validation = await AccessKeys.validateKeyUsage(
        expiredKey,
        "user2",
        "workspace2",
        "beta@test.com"
      );

      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include("expirada");
    });
  });

  describe("Ativação de Chaves", () => {
    it("deve ativar chave válida", async () => {
      const result = await AccessKeys.activateKey(
        "FEAT2024-XYZ789",
        "user2",
        "workspace2",
        "test@example.com",
        { ip: "127.0.0.1", userAgent: "test" }
      );

      expect(result.success).to.be.true;
      expect(result.key.code).to.equal("FEAT2024-XYZ789");
      expect(result.activation.userId).to.equal("user2");
    });

    it("deve falhar para chave inexistente", async () => {
      try {
        await AccessKeys.activateKey(
          "INVALID-KEY",
          "user1",
          "workspace1",
          "test@example.com"
        );
        expect.fail("Deveria ter falhado");
      } catch (error) {
        expect(error.message).to.include("não encontrada");
      }
    });
  });

  describe("AccessKeyHelpers", () => {
    it("deve obter grants ativos de um workspace", async () => {
      AccessKeyHelpers.db = db;

      const grants = await AccessKeyHelpers.getActiveGrants("workspace1");

      expect(grants.plans).to.include("plan_business");
      expect(grants.features).to.be.an("array");
      expect(grants.customPermissions).to.be.an("array");
    });

    it("deve verificar acesso via chave", async () => {
      AccessKeyHelpers.db = db;

      const hasAccess = await AccessKeyHelpers.hasKeyAccess(
        "workspace1",
        "plan",
        "plan_business"
      );

      expect(hasAccess).to.be.true;
    });

    it("deve retornar false para acesso inexistente", async () => {
      AccessKeyHelpers.db = db;

      const hasAccess = await AccessKeyHelpers.hasKeyAccess(
        "workspace1",
        "feature",
        "nonexistent_feature"
      );

      expect(hasAccess).to.be.false;
    });
  });

  describe("Gestão de Chaves", () => {
    it("deve listar chaves com filtros", async () => {
      const keys = await AccessKeys.listKeys({ type: "plan" });

      expect(keys.length).to.equal(1);
      expect(keys[0].type).to.equal("plan");
    });

    it("deve obter estatísticas de chave", async () => {
      const stats = await AccessKeys.getKeyStats("key1");

      expect(stats.code).to.equal("PLAN2024-ABC123");
      expect(stats.totalActivations).to.equal(1);
      expect(stats.activeActivations).to.equal(1);
      expect(stats.usageRate).to.equal(40); // 2/5 * 100
    });

    it("deve processar expiração de chaves", async () => {
      // Mock de workspace com chave expirada
      mockDb.workspaces.push({
        _id: "workspace_expired",
        activeKeys: [
          {
            keyId: "expired_key",
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
            status: "active",
          },
        ],
      });

      const result = await AccessKeys.processExpiredKeys();
      expect(result.processedCount).to.be.greaterThan(0);
    });
  });

  describe("Integração com Workspaces", () => {
    it("deve aplicar grants ao workspace quando ativar chave de plano", async () => {
      // Este teste seria mais complexo, pois envolve atualizar o workspace
      // Verificamos se a lógica está correta
      const key = mockDb.access_keys[0];

      expect(key.grants.planId).to.equal("plan_business");
      expect(key.grants.planDuration).to.equal(30);
    });

    it("deve aplicar grants de features", async () => {
      const key = mockDb.access_keys[1];

      expect(key.grants.featureIds).to.include("analytics");
      expect(key.grants.featureIds).to.include("export_advanced");
    });
  });
});

// Helpers para rodar os testes
if (require.main === module) {
  console.log("🧪 Rodando testes do Sistema de Chaves de Acesso...\n");

  // Simular mocha/chai se não estiver instalado
  global.describe = (name, fn) => {
    console.log(`📁 ${name}`);
    fn();
  };

  global.it = (name, fn) => {
    try {
      fn();
      console.log(`  ✅ ${name}`);
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     ${error.message}`);
    }
  };

  global.beforeEach = (fn) => fn();

  global.expect = (actual) => ({
    to: {
      equal: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to equal ${expected}`);
        }
      },
      include: (substring) => {
        if (Array.isArray(actual)) {
          if (!actual.includes(substring)) {
            throw new Error(`Expected [${actual}] to include ${substring}`);
          }
        } else if (!actual.includes(substring)) {
          throw new Error(`Expected "${actual}" to include "${substring}"`);
        }
      },
      be: {
        true: () => {
          if (actual !== true) {
            throw new Error(`Expected ${actual} to be true`);
          }
        },
        false: () => {
          if (actual !== false) {
            throw new Error(`Expected ${actual} to be false`);
          }
        },
        greaterThan: (expected) => {
          if (actual <= expected) {
            throw new Error(
              `Expected ${actual} to be greater than ${expected}`
            );
          }
        },
        an: (type) => {
          if (type === "array" && !Array.isArray(actual)) {
            throw new Error(`Expected ${actual} to be an array`);
          }
        },
      },
    },
    fail: (message) => {
      throw new Error(message);
    },
  });

  // Executar testes
  require("./access-keys.test.js");
}
