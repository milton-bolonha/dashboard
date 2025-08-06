import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";
import { ObjectId } from "mongodb";

// Função para processar URLs de imagem do Cloudinary
function processImageUrls(data) {
  if (!data) return data;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.log("[DEBUG] processImageUrls: cloudName não encontrado");
    return data;
  }

  console.log("[DEBUG] processImageUrls: cloudName =", cloudName);

  function processValue(value, key) {
    if (typeof value === "string" && key === "image") {
      // ✅ Verificar se é um public_id válido E se segue nosso padrão
      if (isValidPublicId(value) && isCloudinaryPublicId(value)) {
        const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${value}`;
        console.log(
          "[DEBUG] processImageUrls: Convertendo",
          value,
          "para",
          cloudinaryUrl
        );
        return cloudinaryUrl;
      }
      // ✅ Manter qualquer outro valor como está
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    if (value && typeof value === "object") {
      const newObj = {};
      for (const key in value) {
        newObj[key] = processValue(value[key], key);
      }
      return newObj;
    }

    return value;
  }

  return processValue(data);
}

// ✅ Função específica para detectar nosso padrão de public_id
function isCloudinaryPublicId(value) {
  // Deve ter pelo menos 3 partes separadas por /
  const parts = value.split("/");
  if (parts.length < 3) return false;

  // Deve começar com workspace (sem http, sem /)
  if (value.startsWith("http") || value.startsWith("/")) return false;

  // Deve conter 'uploads' ou 'pages-content' (nossos padrões)
  if (!value.includes("uploads") && !value.includes("pages-content"))
    return false;

  // Deve ter formato: workspace/section/user/filename
  // workspace: alfanumérico, hífens, underscores
  // section: alfanumérico, hífens, underscores
  // user: deve começar com 'user_'
  // filename: alfanumérico, hífens, underscores, extensões

  const workspacePattern = /^[a-zA-Z0-9_-]+$/;
  const userPattern = /^user_[a-zA-Z0-9_-]+$/;

  if (!workspacePattern.test(parts[0])) return false;
  if (!userPattern.test(parts[2])) return false;

  return true;
}

// ✅ Função para validar se é um public_id válido (usando regex do cloudinary.js)
function isValidPublicId(publicId) {
  if (!publicId || typeof publicId !== "string") return false;
  const validFormat = /^[a-zA-Z0-9_\-\/]+$/;
  return validFormat.test(publicId) && publicId.length > 0;
}

/**
 * GET /api/public/content
 * Retorna todos os dados de conteúdo organizados por seções para build do gatsby
 */
export async function GET(request) {
  try {
    console.log("[DEBUG] API PUBLIC CONTENT: Iniciando requisição");
    console.log(
      "[DEBUG] API PUBLIC CONTENT: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME =",
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    );

    const authResult = await requireApiKey(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const apiKey = authResult.key;
    const workspaceId = apiKey.workspaceId;

    const workspaceObjectId = new ObjectId(workspaceId);

    // Buscar todas as sections do workspace que têm acesso público
    const sections = await db.find("sections", {
      workspaceId: workspaceObjectId,
      "publicAccess.isPublic": true,
    });

    // Para cada section, buscar seus items publicados
    const content = await Promise.all(
      sections.map(async (section) => {
        const items = await db.find("items", {
          sectionId: section._id, // CORREÇÃO: Passar como ObjectId
          status: "published",
        });

        // Filtrar apenas os dados públicos dos items
        const publicItems = items.map((item) => {
          console.log(
            "[DEBUG] Item original:",
            item.slug,
            "data:",
            JSON.stringify(item.data, null, 2)
          );
          const processedData = processImageUrls(item.data);
          console.log(
            "[DEBUG] Item processado:",
            item.slug,
            "data:",
            JSON.stringify(processedData, null, 2)
          );

          return {
            id: item._id,
            title: item.title,
            slug: item.slug,
            data: processedData, // Processar URLs de imagem
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        });

        return {
          slug: section.slug,
          name: section.name,
          description: section.description,
          strategy: section.strategy,
          items: publicItems,
        };
      })
    );

    return NextResponse.json({
      content,
      workspace: {
        id: workspaceId,
        buildTimestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados de conteúdo:", error);
    if (
      error.message.includes(
        "Argument passed in must be a string of 12 bytes or a string of 24 hex characters"
      )
    ) {
      console.error(
        "[API PUBLIC CONTENT] Erro fatal: O workspaceId fornecido pela chave de API é inválido e não pôde ser convertido para ObjectId."
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
