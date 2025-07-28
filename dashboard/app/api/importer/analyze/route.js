import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateSlug, isReservedWord } from "@/lib/slug-validation";
import pluralize from "pluralize";
import { ObjectId } from "mongodb";
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

// Processa um diretório de seção para determinar a estratégia de importação
async function processSectionDirectory(
  sectionPath,
  baseImportPath,
  importPlan
) {
  const sectionName = capitalize(path.basename(sectionPath));
  const sectionSlug = generateSlug(sectionName);

  const section = {
    _id: new ObjectId().toString(),
    slug: sectionSlug,
    name: sectionName,
    publicAccess: { isPublic: false },
    order: 0,
    icon: "folder-open",
  };

  const entries = fs.readdirSync(sectionPath, { withFileTypes: true });
  const contentFiles = entries.filter(
    (e) => e.isFile() && !e.name.startsWith(".")
  );

  if (contentFiles.length === 0) return;

  const firstFilePath = path.join(sectionPath, contentFiles[0].name);

  // Estratégia 1: Singleton (Diretório com um único arquivo de objeto)
  if (contentFiles.length === 1) {
    const fileAnalysis = analyzeFile(firstFilePath);
    // Um JSON que é um array é uma coleção, não um singleton.
    if (!Array.isArray(fileAnalysis.data)) {
      const baseName = path.basename(
        firstFilePath,
        path.extname(firstFilePath)
      );
      let contentTypeSlug = generateSlug(`${section.slug}-ct`);
      if (isReservedWord(contentTypeSlug))
        contentTypeSlug = `${contentTypeSlug}-type`;

      const contentType = {
        _id: new ObjectId().toString(),
        slug: contentTypeSlug,
        name: capitalize(baseName),
        addons: fileAnalysis.addons,
      };

      importPlan.files.push({
        section,
        contentType,
        itemsData: [{ data: fileAnalysis.data }],
        relativePath: path.relative(baseImportPath, firstFilePath),
        strategy: "singleton",
      });
      return;
    }
  }

  // Estratégia 2: Coleção (Múltiplos arquivos do mesmo tipo OU um único arquivo JSON de array)
  const firstExtension = path.extname(contentFiles[0].name);
  const allSameType = contentFiles.every(
    (file) => path.extname(file.name) === firstExtension
  );
  const isJsonArray =
    contentFiles.length === 1 &&
    firstExtension === ".json" &&
    Array.isArray(analyzeFile(firstFilePath).data);

  if (allSameType || isJsonArray) {
    const firstFileAnalysis = analyzeFile(firstFilePath);
    let contentTypeSlug = generateSlug(`${section.slug}-ct`);
    if (isReservedWord(contentTypeSlug))
      contentTypeSlug = `${contentTypeSlug}-type`;

    const sharedContentType = {
      _id: new ObjectId().toString(),
      slug: contentTypeSlug,
      name: pluralize.singular(section.name),
      addons: firstFileAnalysis.addons,
    };

    let itemsData = [];
    if (isJsonArray) {
      itemsData = firstFileAnalysis.data.map((item) => ({ data: item }));
      importPlan.files.push({
        section,
        contentType: sharedContentType,
        itemsData,
        relativePath: path.relative(baseImportPath, firstFilePath),
        strategy: "collection",
      });
    } else {
      for (const file of contentFiles) {
        const filePath = path.join(sectionPath, file.name);
        const { data } = analyzeFile(filePath);
        itemsData.push({ data });
      }
      importPlan.files.push({
        section,
        contentType: sharedContentType,
        itemsData,
        // Para múltiplos arquivos, a "relativePath" é a do diretório.
        relativePath: path.relative(baseImportPath, sectionPath),
        strategy: "collection",
      });
    }
    return;
  }

  // Estratégia 3: Agrupamento (Múltiplos arquivos de tipos diferentes)
  if (contentFiles.length > 1 && !allSameType) {
    for (const file of contentFiles) {
      const filePath = path.join(sectionPath, file.name);
      const { data, addons } = analyzeFile(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));

      let contentTypeSlug = generateSlug(`${section.slug}-${baseName}-ct`);
      if (isReservedWord(contentTypeSlug))
        contentTypeSlug = `${contentTypeSlug}-type`;

      const contentType = {
        _id: new ObjectId().toString(),
        slug: contentTypeSlug,
        name: capitalize(baseName),
        addons,
      };

      importPlan.files.push({
        section,
        contentType,
        itemsData: [{ data }],
        relativePath: path.relative(baseImportPath, filePath),
        strategy: "grouping",
      });
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

  for (const file of importPlan.files) {
    const { section, contentType } = file;
    if (!consolidatedSections.has(section.slug)) {
      const isNew = !existingSectionSlugs.has(section.slug);
      let finalSection = { ...section, isNew };
      if (!isNew) {
        finalSection._id = existingSections
          .find((s) => s.slug === section.slug)
          ._id.toString();
      }
      consolidatedSections.set(section.slug, finalSection);
    }
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
  }

  return {
    workspaceId: importPlan.workspaceId,
    sections: Array.from(consolidatedSections.values()),
    contentTypes: Array.from(consolidatedContentTypes.values()),
    files: importPlan.files,
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
