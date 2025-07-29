import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { ObjectId } from "mongodb";
import { getCurrentUserId, withAuth } from "@/lib/auth";
import { checkItemLimit, logPlanCheck } from "@/lib/planLimits";

/**
 * GET /api/sections/[id]/items
 * Lista todos os items de uma section pelo ID (com triangulação por userId)
 */
export const GET = withAuth(async (request, { params }, { userId }) => {
  try {
    const { id } = await params;
    console.log("🔧 Items GET: userId =", userId);

    // Validar ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Buscar a section pelo ID E userId (triangulação)
    const section = await db.findOne("sections", {
      _id: new ObjectId(id),
      userId: userId, // ← TRIANGULAÇÃO: só sections do usuário
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Buscar items da section E userId (dupla triangulação)
    const items = await db.find("items", {
      sectionId: section._id, // <-- CORREÇÃO: Usar ObjectId, não string
      userId: userId, // ← TRIANGULAÇÃO: só items do usuário
    });

    const contentType = await db.findOne("contentTypes", {
      _id: new ObjectId(section.contentTypeId),
      userId: userId,
    });

    return NextResponse.json({
      items,
      contentType,
      section: {
        _id: section._id,
        name: section.name,
        slug: section.slug,
      },
    });
  } catch (error) {
    console.error("Error loading items:", error);
    return NextResponse.json(
      { error: "Failed to load items" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/sections/[id]/items
 * Cria um novo item na section pelo ID (com triangulação por userId)
 */
export const POST = withAuth(async (request, { params }, { userId }) => {
  try {
    const { id } = await params;
    const data = await request.json();
    console.log("🔧 Items POST: userId =", userId);

    // Validar ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid section ID" },
        { status: 400 }
      );
    }

    // Buscar a section pelo ID E userId (triangulação)
    const section = await db.findOne("sections", {
      _id: new ObjectId(id),
      userId: userId, // ← TRIANGULAÇÃO: só sections do usuário
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Validar dados básicos
    if (!data.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // ✅ VERIFICAR LIMITES DE PLANO (com bypass para dev)
    try {
      const currentItemCount = await db
        .find("items", { userId })
        .then((items) => items.length);
      const limitCheck = await checkItemLimit(userId, [], currentItemCount);

      logPlanCheck(userId, "criar item", limitCheck);

      if (!limitCheck.canCreate) {
        return NextResponse.json(
          {
            error: "Limite de items atingido",
            details: limitCheck.reason,
            limit: limitCheck.limit,
            current: currentItemCount,
          },
          { status: 403 }
        );
      }
    } catch (limitError) {
      console.warn(
        "⚠️ Erro na verificação de limites, permitindo criação:",
        limitError.message
      );
      // Em caso de erro na verificação, permite criar (fail-safe)
    }

    // Gerar slug único para o item
    const itemSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Verificar se slug já existe na section DO USUÁRIO (triangulação)
    const existingItem = await db.findOne("items", {
      sectionId: section._id.toString(),
      userId: userId, // ← TRIANGULAÇÃO: só verificar no escopo do usuário
      slug: itemSlug,
    });

    let finalSlug = itemSlug;
    if (existingItem) {
      // Adicionar timestamp para tornar único DENTRO DO ESCOPO DO USUÁRIO
      finalSlug = `${itemSlug}-${Date.now()}`;
    }

    // Criar o item com userId (triangulação)
    const itemData = {
      title: data.title,
      slug: finalSlug,
      sectionId: section._id.toString(),
      userId: userId, // ← TRIANGULAÇÃO: associar ao usuário
      status: data.status || "draft",
      data: data.data || {}, // ← Dados dos addons (novo sistema)
      // Manter campos antigos para compatibilidade
      content: data.content || "",
      sectionSlug: section.slug,
      contentTypeId: section.contentTypeId,
      metadata: {
        author: userId, // ← User ID do Clerk
        tags: data.tags || [],
        featured: data.featured || false,
      },
    };

    const result = await db.insertOne("items", itemData);

    // Buscar o item criado
    const newItem = await db.findOne("items", { _id: result.insertedId });

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
});
