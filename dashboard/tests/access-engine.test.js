/**
 * Testes para o Access Engine
 *
 * Para rodar: npm test access-engine
 */

const { expect } = require("chai");
const { AccessEngine } = require("../lib/access-engine");

// Mock do DB para testes
const mockDb = {
  plans: [
    {
      _id: "plan_free",
      name: "Free",
      slug: "free",
      hierarchy: 0,
      limits: { sections: 3, items: 100 },
      features: [],
      permissions: [{ resource: "sections", actions: ["view", "create"] }],
    },
    {
      _id: "plan_business",
      name: "Business",
      slug: "business",
      hierarchy: 2,
      limits: { sections: 50, items: 1000 },
      features: [{ featureId: "analytics", enabled: true }],
      permissions: [
        { resource: "sections", actions: ["view", "create", "edit", "delete"] },
        { resource: "analytics", actions: ["view"] },
      ],
    },
  ],

  features: [
    {
      _id: "analytics",
      slug: "analytics",
      name: "Analytics Premium",
      isActive: true,
    },
  ],

  workspaces: [
    {
      _id: "workspace1",
      planId: "plan_free",
      members: [
        { userId: "user1", role: "owner" },
        { userId: "user2", role: "editor" },
        { userId: "user3", role: "viewer" },
      ],
      usage: { sections: 2, items: 50 },
    },
  ],
};

// Mock do db
const db = {
  findOne: (collection, query) => {
    return mockDb[collection]?.find((item) => {
      if (query._id) return item._id === query._id;
      if (query.slug) return item.slug === query.slug;
      return Object.keys(query).every((key) => item[key] === query[key]);
    });
  },

  find: (collection, query) => {
    const items = mockDb[collection] || [];
    if (!query || Object.keys(query).length === 0) return items;

    return items.filter((item) => {
      return Object.keys(query).every((key) => {
        if (key === "$in" && Array.isArray(query[key])) {
          return query[key].includes(item._id);
        }
        return item[key] === query[key];
      });
    });
  },
};

describe("AccessEngine", () => {
  let workspace, plan, user;

  beforeEach(() => {
    workspace = mockDb.workspaces[0];
    plan = mockDb.plans[0]; // Free plan
    user = { id: "user1" };
  });

  describe("Inicialização", () => {
    it("deve inicializar corretamente", () => {
      const engine = new AccessEngine(workspace, user);

      expect(engine.workspace).to.equal(workspace);
      expect(engine.user).to.equal(user);
      expect(engine.member.role).to.equal("owner");
    });

    it("deve encontrar o membro correto no workspace", () => {
      const user2 = { id: "user2" };
      const engine = new AccessEngine(workspace, user2);

      expect(engine.member.role).to.equal("editor");
    });
  });

  describe("Verificação de Roles", () => {
    it("owner deve poder fazer tudo", async () => {
      const engine = new AccessEngine(workspace, user);
      engine.plan = plan;
      engine._initialized = true;

      const canCreateSection = await engine.checkRolePermission(
        "create",
        "sections"
      );
      const canDeleteSection = await engine.checkRolePermission(
        "delete",
        "sections"
      );

      expect(canCreateSection).to.be.true;
      expect(canDeleteSection).to.be.true;
    });

    it("viewer não deve poder criar", async () => {
      const viewerUser = { id: "user3" };
      const engine = new AccessEngine(workspace, viewerUser);
      engine.plan = plan;
      engine._initialized = true;

      const canCreate = await engine.checkRolePermission("create", "sections");
      const canView = await engine.checkRolePermission("view", "sections");

      expect(canCreate).to.be.false;
      expect(canView).to.be.true;
    });

    it("editor deve poder criar mas não deletar", async () => {
      const editorUser = { id: "user2" };
      const engine = new AccessEngine(workspace, editorUser);
      engine.plan = plan;
      engine._initialized = true;

      const canCreate = await engine.checkRolePermission("create", "sections");
      const canDelete = await engine.checkRolePermission("delete", "sections");

      expect(canCreate).to.be.true;
      expect(canDelete).to.be.false;
    });
  });

  describe("Verificação de Planos", () => {
    it("deve verificar permissões do plano", async () => {
      const engine = new AccessEngine(workspace, user);
      engine.plan = plan;
      engine._initialized = true;

      const canCreateSection = await engine.checkPlanPermission(
        "create",
        "sections"
      );
      const canViewAnalytics = await engine.checkPlanPermission(
        "view",
        "analytics"
      );

      expect(canCreateSection).to.be.true;
      expect(canViewAnalytics).to.be.false; // Free plan não tem analytics
    });

    it("business plan deve ter acesso a analytics", async () => {
      const businessWorkspace = {
        ...workspace,
        planId: "plan_business",
      };

      const engine = new AccessEngine(businessWorkspace, user);
      engine.plan = mockDb.plans[1]; // Business plan
      engine._initialized = true;

      const canViewAnalytics = await engine.checkPlanPermission(
        "view",
        "analytics"
      );
      expect(canViewAnalytics).to.be.true;
    });
  });

  describe("Verificação de Limites", () => {
    it("deve permitir criação dentro dos limites", async () => {
      const engine = new AccessEngine(workspace, user);
      engine.plan = plan;
      engine._initialized = true;

      const withinLimits = await engine.checkLimits("create", "sections");
      expect(withinLimits).to.be.true; // 2 usadas de 3 permitidas
    });

    it("deve bloquear criação fora dos limites", async () => {
      const limitedWorkspace = {
        ...workspace,
        usage: { sections: 3, items: 100 }, // Atingiu o limite
      };

      const engine = new AccessEngine(limitedWorkspace, user);
      engine.plan = plan;
      engine._initialized = true;

      const withinLimits = await engine.checkLimits("create", "sections");
      expect(withinLimits).to.be.false;
    });
  });

  describe("hasFeature", () => {
    it("deve verificar features do plano", () => {
      const businessWorkspace = {
        ...workspace,
        planId: "plan_business",
      };

      const engine = new AccessEngine(businessWorkspace, user);
      engine.plan = mockDb.plans[1]; // Business plan
      engine.features = [mockDb.features[0]]; // Analytics

      expect(engine.hasFeature("analytics")).to.be.true;
      expect(engine.hasFeature("nonexistent")).to.be.false;
    });
  });

  describe("getEffectiveLimits", () => {
    it("deve retornar limites do plano", () => {
      const engine = new AccessEngine(workspace, user);
      engine.plan = plan;

      const limits = engine.getEffectiveLimits();

      expect(limits.sections).to.equal(3);
      expect(limits.items).to.equal(100);
    });

    it("deve aplicar modificadores de features", () => {
      const engine = new AccessEngine(workspace, user);
      engine.plan = plan;
      engine.features = [
        {
          config: {
            limitModifiers: {
              sections: { operation: "add", value: 5 },
            },
          },
        },
      ];

      const limits = engine.getEffectiveLimits();

      expect(limits.sections).to.equal(8); // 3 + 5
    });
  });

  describe("getAccessDeniedMessage", () => {
    it("deve retornar mensagem para limite atingido", async () => {
      const limitedWorkspace = {
        ...workspace,
        usage: { sections: 3 },
      };

      const engine = new AccessEngine(limitedWorkspace, user);
      engine.plan = plan;

      const message = await engine.getAccessDeniedMessage("create", "sections");
      expect(message).to.include("Limite de 3 seções atingido");
    });

    it("deve retornar mensagem para role insuficiente", async () => {
      const viewerUser = { id: "user3" };
      const engine = new AccessEngine(workspace, viewerUser);
      engine.plan = plan;

      const message = await engine.getAccessDeniedMessage("delete", "sections");
      expect(message).to.include("Seu papel (viewer) não tem permissão");
    });
  });

  describe("Integração completa - can()", () => {
    it("owner no free plan deve poder criar section", async () => {
      const engine = new AccessEngine(workspace, user);

      // Mock da inicialização
      engine.plan = plan;
      engine.features = [];
      engine.accessRules = [];
      engine._initialized = true;

      const canCreate = await engine.can("create", "sections");
      expect(canCreate).to.be.true;
    });

    it("viewer não deve poder criar section", async () => {
      const viewerUser = { id: "user3" };
      const engine = new AccessEngine(workspace, viewerUser);

      engine.plan = plan;
      engine.features = [];
      engine.accessRules = [];
      engine._initialized = true;

      const canCreate = await engine.can("create", "sections");
      expect(canCreate).to.be.false;
    });

    it("deve bloquear quando limite atingido", async () => {
      const limitedWorkspace = {
        ...workspace,
        usage: { sections: 3 },
      };

      const engine = new AccessEngine(limitedWorkspace, user);
      engine.plan = plan;
      engine.features = [];
      engine.accessRules = [];
      engine._initialized = true;

      const canCreate = await engine.can("create", "sections");
      expect(canCreate).to.be.false;
    });
  });
});

// Helpers para rodar os testes
if (require.main === module) {
  console.log("🧪 Rodando testes do Access Engine...\n");

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
      },
      include: (substring) => {
        if (!actual.includes(substring)) {
          throw new Error(`Expected "${actual}" to include "${substring}"`);
        }
      },
    },
  });

  // Executar testes
  require("./access-engine.test.js");
}
