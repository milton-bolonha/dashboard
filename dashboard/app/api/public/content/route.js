import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";
import { ObjectId } from "mongodb";

// Função para processar URLs de imagem do Cloudinary
function processImageUrls(data) {
  if (!data || typeof data !== "object") return data;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return data; // Se não tiver Cloudinary configurado, retorna como está

  function processValue(value) {
    if (typeof value === "string") {
      // Verificar se é uma URL completa do Cloudinary - não processar
      if (value && value.startsWith("https://res.cloudinary.com/")) {
        console.log(`[CLOUDINARY] ✅ URL já processada: ${value}`);
        return value;
      }

      // Verificar se é um Public ID do Cloudinary (pode incluir folders)
      if (
        value &&
        !value.startsWith("http") &&
        !value.startsWith("/") &&
        !value.includes(".")
      ) {
        // Detectar se é public_id com estrutura de pastas do nosso sistema
        const isOurFolderStructure =
          value.includes("/") &&
          (value.includes("uploads/") ||
            value.includes("landing-page/") ||
            /user_\w+/.test(value));

        if (isOurFolderStructure) {
          // É um public_id completo com pastas - usar diretamente
          const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${value}`;
          console.log(
            `[CLOUDINARY] 🔧 Convertendo public_id com pastas: ${value} → ${cloudinaryUrl}`
          );
          return cloudinaryUrl;
        } else if (value.length > 10 && /^[a-zA-Z0-9_-]+$/.test(value)) {
          // É um public_id simples - usar diretamente
          const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto/${value}`;
          console.log(
            `[CLOUDINARY] 🔍 Convertendo public_id simples: ${value} → ${cloudinaryUrl}`
          );
          return cloudinaryUrl;
        }
      }

      // Debug: Log valores que não são convertidos
      if (value && value.length > 30) {
        console.log(
          `[CLOUDINARY] ⚠️ Valor não convertido: ${value.substring(0, 50)}...`
        );
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    if (value && typeof value === "object") {
      const processed = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    }

    return value;
  }

  return processValue(data);
}

/**
 * GET /api/public/content
 * Retorna todos os dados de conteúdo organizados por seções para build do gatsby
 */
export async function GET(request) {
  try {
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
        const publicItems = items.map((item) => ({
          id: item._id,
          title: item.title,
          slug: item.slug,
          data: processImageUrls(item.data), // Processar URLs de imagem
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

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
