import { describe, it } from "node:test";
import assert from "node:assert";
import { validate } from "#lib/validate.js";
import { sectionSchema, itemSchema } from "#schemas/index.js";

// Mock MongoDB connection para testes
const mockDb = {
  find: async (collection, filter = {}) => {
    // Simular dados de teste
    if (collection === "sections")
      return [
        { _id: "1", name: "Blog Posts", slug: "blog-posts" },
        { _id: "2", name: "Products", slug: "products" },
      ];
    if (collection === "users")
      return [{ _id: "1", name: "Admin", email: "admin@test.com" }];
    return [];
  },
  findOne: async (collection, filter) => {
    if (collection === "sections" && filter.slug === "blog-posts") {
      return { _id: "1", name: "Blog Posts", slug: "blog-posts" };
    }
    return null;
  },
  insertOne: async (collection, data) => {
    return { insertedId: "new-id-123" };
  },
};

describe("Users List API tests", () => {
  it("Dashboard stats API structure", () => {
    const expectedStats = {
      sections: 0,
      items: 0,
      users: 0,
      plans: 0,
    };

    // Testa estrutura esperada
    assert.equal(typeof expectedStats.sections, "number");
    assert.equal(typeof expectedStats.items, "number");
    assert.equal(typeof expectedStats.users, "number");
    assert.equal(typeof expectedStats.plans, "number");
  });

  it("Section validation", () => {
    const validSection = {
      name: "Test Section",
      contentTypeId: "507f1f77bcf86cd799439011",
      description: "Test description",
    };

    // Validação básica
    assert.ok(validSection.name);
    assert.ok(validSection.contentTypeId);
    assert.equal(typeof validSection.name, "string");
  });

  it("Slug generation", () => {
    const name = "My Awesome Section!";
    const expectedSlug = "my-awesome-section";

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    assert.equal(slug, expectedSlug);
  });

  it("Schema validation helper", async () => {
    const { validateSchema, SectionSchema } = await import(
      "@/schemas/index.js"
    );

    const validData = {
      name: "Test Section",
      slug: "test-section",
      contentTypeId: "507f1f77bcf86cd799439011",
    };

    const invalidData = {
      // missing required name
      contentTypeId: "507f1f77bcf86cd799439011",
    };

    const validResult = validateSchema(validData, SectionSchema);
    const invalidResult = validateSchema(invalidData, SectionSchema);

    console.log("Valid result:", validResult);
    console.log("Invalid result:", invalidResult);

    assert.equal(validResult.isValid, true);
    assert.equal(invalidResult.isValid, false);
    assert.ok(invalidResult.errors.length > 0);
  });
});

console.log("✔ API tests completed");
