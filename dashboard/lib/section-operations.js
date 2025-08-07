import { db } from "./db.js";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { validateSlug, generateSlug, isSlugUnique } from "./slug-validation.js";

/**
 * Cria uma nova seção e, se for um singleton, seu item inicial.
 * Esta função centraliza a lógica de criação de seções.
 * @param {object} sectionData - Dados para a nova seção.
 * @returns {Promise<object>} - A nova seção criada.
 */
export async function createSectionAndInitialItem(sectionData) {
  // 1. Validar e preparar dados da Seção
  const slugToValidate = sectionData.slug || generateSlug(sectionData.name);
  const slugValidation = validateSlug(slugToValidate);
  if (!slugValidation.isValid) {
    throw new Error(`Slug inválido: ${slugValidation.errors.join(", ")}`);
  }
  const slug = slugValidation.slug;

  if (!(await isSlugUnique(slug, sectionData.workspaceId, "sections"))) {
    throw new Error("Uma Seção com este slug já existe neste workspace.");
  }

  // Validação Crítica: Garantir que singletons e coleções tenham um Content Type
  if (
    (sectionData.strategy === "singleton" ||
      sectionData.strategy === "collection") &&
    !sectionData.contentTypeId
  ) {
    throw new Error(
      "Seções do tipo 'Singleton' ou 'Coleção' devem obrigatoriamente ter um Content Type associado."
    );
  }

  // ✅ ADICIONAR: Validação específica para grouping
  if (sectionData.strategy === "grouping" && sectionData.contentTypeId) {
    console.warn("⚠️ Seção 'Grouping' não deve ter contentTypeId específico");
    delete sectionData.contentTypeId; // Remover se fornecido
  }

  const dataToInsert = {
    ...sectionData,
    slug,
    settings: {
      defaultView: "list",
      itemsPerPage: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...sectionData.settings,
    },
  };

  const validation = validateSchema(dataToInsert, SectionSchema);
  if (!validation.isValid) {
    throw new Error(`Validação falhou: ${validation.errors.join(", ")}`);
  }

  // 2. Criar a Seção
  const result = await db.insertOne("sections", dataToInsert);
  const newSection = await db.findOne("sections", { _id: result.insertedId });

  // 3. Se for um singleton, criar seu único item automaticamente
  if (newSection.strategy === "singleton") {
    // A verificação acima garante que contentTypeId existe.
    const initialItem = {
      title: newSection.name, // Usar 'title' para consistência com o schema de Item
      slug: newSection.slug,
      sectionId: newSection._id.toString(), // Garantir que o ID seja string
      contentTypeId: newSection.contentTypeId,
      userId: newSection.userId,
      workspaceId: newSection.workspaceId,
      data: {},
      status: "published",
    };
    await db.insertOne("items", initialItem);
    console.log(`✅ Item inicial criado para o singleton "${newSection.name}"`);
  }

  return newSection;
}
