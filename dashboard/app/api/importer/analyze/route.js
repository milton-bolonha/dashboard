import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateSlug, isReservedWord } from "@/lib/slug-validation";
import pluralize from "pluralize";
import { ObjectId } from "mongodb"; // RESTAURADO
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper para capitalizar a primeira letra
function capitalize(s) {
  if (typeof s !== "string" || !s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Função recursiva para inferir os tipos de campos
function inferFieldsRecursive(data) {
  const addons = [];
  if (!data || typeof data !== "object") return addons;

  for (const key in data) {
    const value = data[key];
    let field = {
      id: generateSlug(key),
      name: key,
      label: capitalize(key.replace(/_/g, " ")),
      type: "textInput", // default
    };

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object") {
        field.type = "repeater";
        field.fields = inferFieldsRecursive(value[0]);
      }
    } else if (typeof value === "object" && value !== null) {
      field.type = "group";
      field.fields = inferFieldsRecursive(value);
    } else if (typeof value === "boolean") {
      field.type = "checkboxInput";
    } else if (typeof value === "number") {
      field.type = "numberInput";
    } else if (
      typeof value === "string" &&
      (value.includes("\n") || value.length > 255)
    ) {
      field.type = "textarea";
    }

    // ✅ DEBUG: Log para investigar inferência
    console.log(`🔍 DEBUG: Inferindo campo "${key}"`, {
      value: value,
      valueType: typeof value,
      isArray: Array.isArray(value),
      inferredType: field.type,
      hasFields: !!field.fields,
    });

    addons.push(field);
  }
  return addons;
}

// Analisa um único arquivo e retorna sua estrutura de dados e addons.
function analyzeFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileType = path.extname(filePath).slice(1).toLowerCase();
  const fileContent = fileBuffer.toString("utf-8");

  let data;
  let addons;

  if (fileType === "json") {
    data = JSON.parse(fileContent);
    // Para inferir addons de uma coleção em JSON, usamos o primeiro item.
    const inferenceData = Array.isArray(data) ? data[0] || {} : data;
    addons = inferFieldsRecursive(inferenceData);
  } else {
    // md, markdown, etc.
    const { data: frontmatter, content } = matter(fileContent);
    data = { ...frontmatter, content };
    // O conteúdo do markdown não deve influenciar a inferência de tipo de campo.
    const inferenceData = { ...frontmatter, content: "" };
    addons = inferFieldsRecursive(inferenceData);
  }

  return { data, addons };
}

// Função auxiliar para comparar as estruturas dos addons (campos)
function compareAddonStructures(addonsA, addonsB) {
  if (addonsA.length !== addonsB.length) return false;
  const idsA = new Set(addonsA.map((a) => a.id).sort());
  const idsB = new Set(addonsB.map((b) => b.id).sort());
  if (idsA.size !== idsB.size) return false;
  for (const id of idsA) {
    if (!idsB.has(id)) return false;
  }
  return true;
}

// Processa um diretório de seção para determinar a estratégia de importação
async function processSectionDirectory(
  sectionPath,
  baseImportPath,
  importPlan
) {
  const sectionName = capitalize(path.basename(sectionPath));
  const sectionSlug = generateSlug(sectionName);

  const section = {
    // _id: new ObjectId().toString(), // REMOVIDO
    slug: sectionSlug,
    name: sectionName,
    publicAccess: { isPublic: false },
    order: 0,
    icon: "folder-open",
    // ADICIONADO: A estratégia será definida abaixo
    strategy: "",
  };

  const entries = fs.readdirSync(sectionPath, { withFileTypes: true });
  const contentFiles = entries.filter(
    (e) => e.isFile() && !e.name.startsWith(".")
  );

  if (contentFiles.length === 0) return;

  const firstFilePath = path.join(sectionPath, contentFiles[0].name);

  // Se houver múltiplos arquivos, precisamos decidir entre Coleção e Agrupamento
  if (contentFiles.length > 1) {
    const firstFileAnalysis = analyzeFile(firstFilePath);
    let allSameStructure = true;

    for (let i = 1; i < contentFiles.length; i++) {
      const otherFilePath = path.join(sectionPath, contentFiles[i].name);
      const otherFileAnalysis = analyzeFile(otherFilePath);
      if (
        !compareAddonStructures(
          firstFileAnalysis.addons,
          otherFileAnalysis.addons
        )
      ) {
        allSameStructure = false;
        break;
      }
    }

    if (allSameStructure) {
      section.strategy = "collection";
    } else {
      section.strategy = "grouping";
    }
  } else if (contentFiles.length === 1) {
    // Se for um único arquivo, pode ser um Singleton ou uma Coleção (se for um array JSON)
    const fileAnalysis = analyzeFile(firstFilePath);
    if (Array.isArray(fileAnalysis.data)) {
      section.strategy = "collection";
    } else {
      section.strategy = "singleton";
    }
  } else {
    return; // Nenhum arquivo de conteúdo, não faz nada
  }

  // --- LÓGICA DE PROCESSAMENTO UNIFICADA COM BASE NA ESTRATÉGIA DECIDIDA ---

  if (section.strategy === "singleton" || section.strategy === "grouping") {
    // Processamento para Singleton e Agrupamento (um item por arquivo)
    for (const file of contentFiles) {
      const filePath = path.join(sectionPath, file.name);
      const { data, addons } = analyzeFile(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));

      let contentTypeSlug = generateSlug(`${sectionSlug}-${baseName}-ct`);
      if (section.strategy === "singleton") {
        contentTypeSlug = generateSlug(`${sectionSlug}-ct`);
      }
      if (isReservedWord(contentTypeSlug)) {
        contentTypeSlug = `${contentTypeSlug}-type`;
      }

      // ✅ CORREÇÃO: Verificar se addons foram inferidos corretamente
      const contentType = {
        slug: contentTypeSlug,
        name: capitalize(baseName),
        addons:
          addons.length > 0
            ? addons
            : [
                // ✅ FALLBACK: Addon básico se inferência falhar
                {
                  id: generateSlug(`${baseName}-title`),
                  name: "Título",
                  label: "Título",
                  type: "textInput",
                  required: true,
                },
              ],
      };

      // ✅ VALIDAÇÃO: Log para debug
      console.log(
        `🔍 Content Type "${contentType.name}" criado com ${contentType.addons.length} addons`
      );

      const itemSlug = generateSlug(baseName);
      const itemData = {
        data,
        title: capitalize(baseName.replace(/-/g, " ")),
        slug: itemSlug,
        status: "published",
      };

      importPlan.files.push({
        section,
        contentType,
        itemsData: [itemData],
        relativePath: path.relative(baseImportPath, filePath),
      });
    }
  } else if (section.strategy === "collection") {
    // Processamento para Coleção
    const firstFileAnalysis = analyzeFile(firstFilePath);
    let contentTypeSlug = generateSlug(`${sectionSlug}-ct`);
    if (isReservedWord(contentTypeSlug)) {
      contentTypeSlug = `${contentTypeSlug}-type`;
    }

    // ✅ CORREÇÃO: Verificar se addons foram inferidos corretamente
    const sharedContentType = {
      slug: contentTypeSlug,
      name: pluralize.singular(sectionName),
      addons:
        firstFileAnalysis.addons.length > 0
          ? firstFileAnalysis.addons
          : [
              // ✅ FALLBACK: Addon básico se inferência falhar
              {
                id: generateSlug(`${sectionName}-title`),
                name: "Título",
                label: "Título",
                type: "textInput",
                required: true,
              },
            ],
    };

    // ✅ VALIDAÇÃO: Log para debug
    console.log(
      `🔍 Content Type "${sharedContentType.name}" criado com ${sharedContentType.addons.length} addons`
    );

    if (contentFiles.length === 1 && Array.isArray(firstFileAnalysis.data)) {
      // Caso de um único arquivo JSON que é um array
      const itemsData = firstFileAnalysis.data.map((item) => {
        const title = item.title || item.name || "Untitled";
        const slug = item.slug || generateSlug(title);
        return { data: item, title, slug, status: "published" };
      });
      importPlan.files.push({
        section,
        contentType: sharedContentType,
        itemsData,
        relativePath: path.relative(baseImportPath, firstFilePath),
      });
    } else {
      // Caso de múltiplos arquivos com a mesma estrutura
      for (const file of contentFiles) {
        const filePath = path.join(sectionPath, file.name);
        const { data } = analyzeFile(filePath);
        const baseName = path.basename(filePath, path.extname(filePath));
        const title = capitalize(baseName.replace(/-/g, " "));
        const slug = generateSlug(baseName);
        const itemData = { data, title, slug, status: "published" };

        importPlan.files.push({
          section,
          contentType: sharedContentType,
          itemsData: [itemData],
          relativePath: path.relative(baseImportPath, filePath),
        });
      }
    }
  }
}

// Consolida o plano de importação e marca entidades como novas ou existentes
async function consolidateAndIdentifyNew(importPlan, workspace) {
  const workspaceId = workspace._id.toString();
  const [existingSections, existingContentTypes] = await Promise.all([
    db.find("sections", { workspaceId }),
    db.find("contentTypes", { workspaceId }),
  ]);
  const existingSectionSlugs = new Set(existingSections.map((s) => s.slug));
  const existingContentTypeSlugs = new Set(
    existingContentTypes.map((ct) => ct.slug)
  );

  const consolidatedSections = new Map();
  const consolidatedContentTypes = new Map();
  const tree = new Map();

  for (const file of importPlan.files) {
    const { section, contentType, itemsData, relativePath } = file;

    // Consolidar Seção
    if (!consolidatedSections.has(section.slug)) {
      const isNew = !existingSectionSlugs.has(section.slug);
      let finalSection = { ...section, isNew };
      if (!isNew) {
        const existingSection = existingSections.find(
          (s) => s.slug === section.slug
        );
        finalSection._id = existingSection._id.toString();
        finalSection.strategy = existingSection.strategy;
      }
      consolidatedSections.set(section.slug, finalSection);
    }

    // Consolidar Content Type
    if (!consolidatedContentTypes.has(contentType.slug)) {
      const isNew = !existingContentTypeSlugs.has(contentType.slug);
      let finalContentType = { ...contentType, isNew };
      if (!isNew) {
        finalContentType._id = existingContentTypes
          .find((ct) => ct.slug === contentType.slug)
          ._id.toString();
      }
      consolidatedContentTypes.set(contentType.slug, finalContentType);
    }

    // Construir a árvore hierárquica
    if (!tree.has(section.slug)) {
      tree.set(section.slug, {
        section: consolidatedSections.get(section.slug),
        files: [],
      });
    }

    const treeNode = tree.get(section.slug);
    treeNode.files.push({
      relativePath,
      contentType: consolidatedContentTypes.get(contentType.slug),
      itemsData,
    });
  }

  // A resposta final para o frontend não precisa mais de 'files' separados
  return {
    workspaceId: importPlan.workspaceId,
    sections: Array.from(consolidatedSections.values()),
    contentTypes: Array.from(consolidatedContentTypes.values()),
    // O 'plan' agora é a árvore, mais fácil para o UI processar
    plan: Array.from(tree.values()),
  };
}

export async function POST(req) {
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { importPath, workspaceId } = await req.json();
    if (!importPath || !workspaceId) {
      return Response.json(
        { error: "Caminho de importação e ID do workspace são obrigatórios" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(importPath)) {
      return Response.json(
        { error: `Caminho não encontrado: ${importPath}` },
        { status: 404 }
      );
    }

    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
    });
    if (!workspace) {
      return Response.json(
        { error: "Workspace não encontrado" },
        { status: 404 }
      );
    }

    const importPlan = { workspaceId, files: [] };
    const topLevelDirs = fs
      .readdirSync(importPath, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("."));

    for (const dir of topLevelDirs) {
      const sectionPath = path.join(importPath, dir.name);
      await processSectionDirectory(sectionPath, importPath, importPlan);
    }

    const consolidatedPlan = await consolidateAndIdentifyNew(
      importPlan,
      workspace
    );

    return Response.json(consolidatedPlan);
  } catch (error) {
    console.error("Erro na análise:", error);
    return Response.json(
      { error: "Falha na análise dos arquivos", details: error.message },
      { status: 500 }
    );
  }
}
