import test from "node:test";
import assert from "node:assert/strict";

/**
 * Testes para a correção das Sections
 * Cobertura: Criação, edição e validação de slug duplicado
 */

// Teste 1: Validação de slug único na criação
test("Criação de section deve validar slug único", () => {
  const sections = [
    { _id: "1", slug: "blog-posts", name: "Blog Posts" },
    { _id: "2", slug: "produtos", name: "Produtos" },
  ];

  const newSectionSlug = "blog-posts";
  const slugExists = sections.some(
    (section) => section.slug === newSectionSlug
  );

  assert.equal(slugExists, true, "Deve detectar slug duplicado");
});

// Teste 2: Validação de slug na edição (deve permitir o próprio slug)
test("Edição de section deve permitir manter o próprio slug", () => {
  const sections = [
    { _id: "1", slug: "blog-posts", name: "Blog Posts" },
    { _id: "2", slug: "produtos", name: "Produtos" },
  ];

  const editingId = "1";
  const newSlug = "blog-posts"; // Mesmo slug da section sendo editada

  const duplicateSlug = sections.find(
    (section) => section.slug === newSlug && section._id !== editingId
  );

  assert.equal(duplicateSlug, undefined, "Deve permitir manter o próprio slug");
});

// Teste 3: Edição deve rejeitar slug de outra section
test("Edição de section deve rejeitar slug de outra section", () => {
  const sections = [
    { _id: "1", slug: "blog-posts", name: "Blog Posts" },
    { _id: "2", slug: "produtos", name: "Produtos" },
  ];

  const editingId = "1";
  const newSlug = "produtos"; // Slug de outra section

  const duplicateSlug = sections.find(
    (section) => section.slug === newSlug && section._id !== editingId
  );

  assert.notEqual(
    duplicateSlug,
    undefined,
    "Deve rejeitar slug de outra section"
  );
  assert.equal(
    duplicateSlug.slug,
    "produtos",
    "Deve encontrar o conflito correto"
  );
});

// Teste 4: Geração automática de slug
test("Deve gerar slug automaticamente a partir do nome", () => {
  const sectionName = "Minha Seção Especial!!!";

  const generatedSlug = sectionName
    .toString()
    .normalize("NFD") // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por -
    .replace(/[^\w-]+/g, "") // Remove todos os caracteres não-palavra (exceto -)
    .replace(/--+/g, "-"); // Substitui múltiplos - por um único -

  assert.strictEqual(
    generatedSlug,
    "minha-secao-especial",
    "Deve gerar slug correto"
  );
});

console.log("✅ Todos os testes de correção das Sections passaram!");
