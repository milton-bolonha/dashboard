import { describe, it } from "node:test";
import assert from "node:assert";
import { db } from "#lib/db.js";
import { GET as getAll, POST } from "@/app/api/sections/route";
import { GET as getOne, PUT, DELETE } from "@/app/api/sections/[id]/route";
import { ObjectId } from "mongodb";
import { setup, teardown } from "./test-setup.js";
// Mock das funções da API
// import { createSection, getSection, updateSection, deleteSection } from '../app/api/sections';

// Mock do DB
describe("Sections API", () => {
  it.beforeEach(async () => {
    await db.deleteMany("sections");
    await db.deleteMany("contentTypes");
  });

  it("Sections API - CRUD completo", async () => {
    // 1. Criar um Content Type de pré-requisito
    const contentTypeData = { name: "Página", slug: "pagina" };
    const ctResult = await db.insertOne("contentTypes", contentTypeData);
    const contentTypeId = ctResult.insertedId.toString();

    // 2. POST - Criar uma nova section
    const mockRequestPost = {
      json: async () => ({
        name: "Página Sobre Nós",
        contentTypeId: contentTypeId,
      }),
    };
    const postResponse = await POST(mockRequestPost);
    assert.equal(postResponse.status, 201, "POST deve retornar 201");
    const { section: newSection } = await postResponse.json();
    assert.ok(newSection._id, "Section criada deve ter um ID");
    assert.equal(newSection.name, "Página Sobre Nós");
    assert.equal(newSection.slug, "pagina-sobre-nos");

    const sectionId = newSection._id;

    // 3. GET (all) - Listar sections
    const getResponse = await GET();
    assert.equal(getResponse.status, 200);
    const { sections } = await getResponse.json();
    assert.equal(sections.length, 1);
    assert.equal(sections[0].name, "Página Sobre Nós");

    // 4. GET (one) - Obter a section criada
    const getOneResponse = await getOne(null, { params: { id: sectionId } });
    assert.equal(getOneResponse.status, 200);
    const { section: fetchedSection } = await getOneResponse.json();
    assert.equal(fetchedSection.name, "Página Sobre Nós");

    // 5. PUT - Atualizar a section
    const mockRequestPut = {
      json: async () => ({
        name: "Página Sobre Nós - Atualizada",
        slug: "pagina-sobre-nos-atualizada",
        contentTypeId: contentTypeId,
      }),
    };
    const putResponse = await PUT(mockRequestPut, {
      params: { id: sectionId },
    });
    assert.equal(putResponse.status, 200);
    const { section: updatedSection } = await putResponse.json();
    assert.equal(updatedSection.name, "Página Sobre Nós - Atualizada");

    // 6. DELETE - Deletar a section
    const deleteResponse = await DELETE(null, { params: { id: sectionId } });
    assert.equal(deleteResponse.status, 200);

    // 7. Verificar se foi deletado
    const getOneAfterDelete = await getOne(null, { params: { id: sectionId } });
    assert.equal(
      getOneAfterDelete.status,
      404,
      "GET após DELETE deve retornar 404"
    );
  });
});
