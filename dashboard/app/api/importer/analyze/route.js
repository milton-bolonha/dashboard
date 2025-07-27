import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

async function getCurrentWorkspace(userId, requestedWorkspaceId = null) {
  try {
    let workspace;

    // Se foi especificado um workspace, usar esse
    if (requestedWorkspaceId) {
      // ✅ CORREÇÃO: Converter string para ObjectId
      const workspaceObjectId = new ObjectId(requestedWorkspaceId);

      workspace = await db.findOne("workspaces", {
        _id: workspaceObjectId, // ← FIX: Usar ObjectId ao invés de string
        $or: [{ ownerId: userId }, { "members.userId": userId }],
      });

      if (workspace) {
        console.log(
          `🎯 Usando workspace específico: ${workspace.name} (${workspace._id})`
        );
        return workspace;
      } else {
        console.log(
          `⚠️ Workspace ${requestedWorkspaceId} não encontrado ou sem permissão`
        );
      }
    }

    // Fallback: buscar qualquer workspace do usuário
    workspace = await db.findOne("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      console.log(`🔧 Nenhum workspace encontrado para usuário: ${userId}`);
      return null;
    }

    console.log(
      `🏢 Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Erro ao obter workspace:", error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { userId } = await getCurrentAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { importPath, workspaceId } = body;

    console.log("DEBUG - Backend recebeu importPath:", importPath);
    console.log("DEBUG - Backend recebeu workspaceId:", workspaceId);
    console.log("DEBUG - Tipo do importPath:", typeof importPath);

    if (!importPath) {
      return NextResponse.json(
        { error: "Caminho de importação é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o caminho existe
    console.log("DEBUG - Verificando se caminho existe:", importPath);
    const pathExists = fs.existsSync(importPath);
    console.log("DEBUG - fs.existsSync result:", pathExists);

    if (!pathExists) {
      console.log("DEBUG - Caminho não encontrado!");
      console.log("DEBUG - Tentando normalizar o caminho...");

      // Tentar normalizar o caminho (remover barras duplas, etc.)
      const normalizedPath = importPath
        .replace(/\\/g, "/")
        .replace(/\/\//g, "/");
      console.log("DEBUG - Caminho normalizado:", normalizedPath);
      console.log(
        "DEBUG - Caminho normalizado existe:",
        fs.existsSync(normalizedPath)
      );

      return NextResponse.json(
        { error: `Caminho não encontrado: ${importPath}` },
        { status: 400 }
      );
    }

    const workspace = await getCurrentWorkspace(userId, workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado" },
        { status: 404 }
      );
    }

    console.log("DEBUG - Workspace encontrado:", workspace.name);

    // Analisar a estrutura de arquivos
    const importPlan = await analyzeFileStructure(
      importPath,
      workspace._id.toString()
    );

    return NextResponse.json({
      success: true,
      sectionsCount: importPlan.sections.length,
      itemsCount: importPlan.items.length,
      importPlan,
    });
  } catch (error) {
    console.error("Erro na análise:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function analyzeFileStructure(rootPath, workspaceId) {
  const sections = [];
  const items = [];
  const contentTypeMap = new Map();

  function processDirectory(dirPath, relativePath = "") {
    const files = fs.readdirSync(dirPath);

    // Cria section para toda pasta exceto a raiz
    if (relativePath) {
      const sectionName = path.basename(dirPath);
      const sectionSlug = sectionName.toLowerCase().replace(/[^a-z0-9]/g, "-");

      // Inferir contentType baseado no nome da pasta
      const inferredType = inferContentTypeFromName(sectionName);
      const contentTypeName = inferredType.name;

      // Adicionar contentType se não existir
      if (!contentTypeMap.has(contentTypeName)) {
        contentTypeMap.set(contentTypeName, inferredType);
      }

      sections.push({
        name: sectionName.charAt(0).toUpperCase() + sectionName.slice(1),
        slug: sectionSlug,
        description: `Section importada de ${relativePath}`,
        workspaceId,
        contentTypeId: contentTypeName,
        isActive: true,
        publicAccess: { isPublic: true },
        order: sections.length,
      });
    }

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        processDirectory(fullPath, path.join(relativePath, file));
      } else if (stat.isFile() && isContentFile(file)) {
        const itemName = path.basename(file, path.extname(file));
        const itemSlug = itemName.toLowerCase().replace(/[^a-z0-9]/g, "-");

        // Ler o conteúdo do arquivo para inferir o tipo
        const fileContent = readContentFile(fullPath);

        // Separa o title do resto dos dados
        const { title, ...customData } = fileContent;

        const inferredType = inferContentType(customData); // Sempre inferir addons

        if (!relativePath) {
          // Para arquivos na raiz, sobrescrever nome e slug do ContentType
          inferredType.name =
            itemName.charAt(0).toUpperCase() + itemName.slice(1);
          inferredType.slug = itemName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        }

        if (!contentTypeMap.has(inferredType.name)) {
          contentTypeMap.set(inferredType.name, inferredType);
        }

        // Se está na raiz, criar uma section para o arquivo também
        if (!relativePath) {
          const sectionName =
            itemName.charAt(0).toUpperCase() + itemName.slice(1);
          const sectionSlug = itemSlug;
          sections.push({
            name: sectionName,
            slug: sectionSlug,
            description: `Section importada de ${file}`,
            workspaceId,
            contentTypeId: inferredType.name,
            isActive: true,
            publicAccess: { isPublic: true },
            order: sections.length,
          });
        }

        items.push({
          name: title || itemName, // Usa o title do frontmatter, ou o nome do arquivo como fallback
          slug: itemSlug,
          description: `Item importado de ${path.join(relativePath, file)}`,
          workspaceId,
          contentTypeId: inferredType.name,
          sectionId: relativePath ? path.basename(dirPath) : itemSlug,
          data: customData, // Salva apenas os dados customizados, sem o title
          status: "published",
          isActive: true,
          order: items.length,
        });
      }
    }
  }

  // Começa processando a raiz (não cria section para raiz)
  processDirectory(rootPath, "");

  // Converter o Map de contentTypes para array
  const contentTypes = Array.from(contentTypeMap.values());

  return {
    sections,
    items,
    contentTypes,
  };
}

function isContentFile(filename) {
  const contentExtensions = [".json", ".md", ".txt", ".yaml", ".yml"];
  const ext = path.extname(filename).toLowerCase();
  return contentExtensions.includes(ext);
}

function readContentFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileContent = fs.readFileSync(filePath, "utf8");

  try {
    if (ext === ".json") {
      return JSON.parse(fileContent);
    } else if (ext === ".md") {
      const { data, content } = matter(fileContent);
      return { ...data, content }; // Retorna o frontmatter como campos e o resto como 'content'
    } else {
      return { content: fileContent, type: "text" };
    }
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error);
    return { error: `Erro ao ler arquivo: ${error.message}` };
  }
}

function inferContentTypeFromName(name) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("hero")) {
    return {
      name: "Hero Section",
      slug: "hero-section",
      addons: [
        { type: "textInput", name: "title", label: "Título" },
        { type: "textInput", name: "description", label: "Descrição" },
        { type: "textInput", name: "buttonText", label: "Texto do Botão" },
        { type: "textInput", name: "buttonUrl", label: "URL do Botão" },
      ],
    };
  } else if (lowerName.includes("service")) {
    return {
      name: "Services Section",
      slug: "services-section",
      addons: [
        { type: "textInput", name: "title", label: "Título" },
        { type: "textArea", name: "description", label: "Descrição" },
        { type: "textInput", name: "icon", label: "Ícone" },
      ],
    };
  } else if (lowerName.includes("testimonial")) {
    return {
      name: "Testimonials Section",
      slug: "testimonials-section",
      addons: [
        { type: "textInput", name: "name", label: "Nome" },
        { type: "textArea", name: "content", label: "Depoimento" },
        { type: "textInput", name: "company", label: "Empresa" },
      ],
    };
  } else if (lowerName.includes("page")) {
    return {
      name: "Page Content",
      slug: "page-content",
      addons: [
        { type: "textInput", name: "title", label: "Título" },
        { type: "textArea", name: "content", label: "Conteúdo" },
        { type: "textInput", name: "metaDescription", label: "Meta Descrição" },
      ],
    };
  } else if (lowerName.includes("city")) {
    return {
      name: "City Content",
      slug: "city-content",
      addons: [
        { type: "textInput", name: "name", label: "Nome da Cidade" },
        { type: "textArea", name: "description", label: "Descrição" },
        { type: "textInput", name: "state", label: "Estado" },
      ],
    };
  } else {
    return {
      name: "Generic Content",
      slug: "generic-content",
      addons: [
        { type: "textInput", name: "title", label: "Título" },
        { type: "textArea", name: "content", label: "Conteúdo" },
      ],
    };
  }
}

function inferContentType(content) {
  const addons = [];
  const keys = Object.keys(content);

  for (const key of keys) {
    // Não criar addon para o campo 'content' que é o corpo do markdown
    if (key === "content") continue;

    let fieldType;
    const value = content[key];

    if (typeof value === "boolean") {
      fieldType = "checkbox";
    } else if (typeof value === "number") {
      fieldType = "numberInput";
    } else if (Array.isArray(value)) {
      fieldType = "repeater";
    } else {
      fieldType = "textInput";
    }

    addons.push({
      type: fieldType,
      name: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
    });
  }

  // Lógica para nomear o ContentType
  let name = "Generic Content";
  if (keys.includes("page_builder")) {
    name = "Page with Builder";
  } else if (keys.includes("description")) {
    // Alterado para não depender de title
    name = "Standard Page";
  }

  return {
    name,
    slug: name.toLowerCase().replace(/ /g, "-"),
    addons,
  };
}
