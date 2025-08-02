import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { ObjectId } from "mongodb";
import { getCurrentUserId, withAuth } from "@/lib/auth";

/**
 * GET /api/sections/[id]/items/[itemId]
 * Busca um item específico (com triangulação por userId)
 */
export const GET = withAuth(async (request, { params }, { userId }) => {
  try {
    console.log("🔧 Items GET: userId =", userId);
    const { id, itemId } = await params;

    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const item = await db.findOne("items", {
      _id: new ObjectId(itemId),
      sectionId: new ObjectId(id),
      userId: userId,
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/sections/[id]/items/[itemId]
 * Atualiza um item específico (com triangulação por userId)
 */
export const PUT = withAuth(async (request, { params }, { userId }) => {
  try {
    const { id, itemId } = await params;
    const data = await request.json();
    console.log("🔧 Items PUT: userId =", userId);
    console.log("--- DEBUG: Dados recebidos do cliente ---");
    console.log(JSON.stringify(data, null, 2));

    // Validar IDs
    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Verificar se o item existe, pertence à section E ao usuário (triangulação)
    const existingItem = await db.findOne("items", {
      _id: new ObjectId(itemId),
      sectionId: new ObjectId(id),
      userId: userId, // ← TRIANGULAÇÃO: só items do usuário
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Atualizar item (novo sistema com data dos addons)
    const updateData = {
      title: data.title || existingItem.title,
      status: data.status || existingItem.status,
      // Merge para preservar campos não alterados no objeto data
      data: { ...existingItem.data, ...(data.data || {}) },
    };

    // Tratar `content` separadamente para permitir que seja `null` ou string vazia,
    // mantendo o valor existente se não for fornecido.
    if (data.content !== undefined) {
      updateData.content = data.content;
    } else if (existingItem.content !== undefined) {
      updateData.content = existingItem.content;
    }

    // Se título mudou, gerar novo slug
    if (data.title && data.title !== existingItem.title) {
      const newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Verificar se novo slug já existe NO ESCOPO DO USUÁRIO (triangulação)
      const slugExists = await db.findOne("items", {
        sectionId: new ObjectId(id),
        userId: userId, // ← TRIANGULAÇÃO: só verificar no escopo do usuário
        slug: newSlug,
        _id: { $ne: new ObjectId(itemId) },
      });

      updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
    }

    console.log("--- DEBUG: Objeto de atualização construído ---");
    console.log(JSON.stringify(updateData, null, 2));

    const result = await db.updateOne(
      "items",
      {
        _id: new ObjectId(itemId),
        userId: userId, // ← TRIANGULAÇÃO: só atualizar se for do usuário
      },
      updateData
    );

    console.log("--- DEBUG: Resultado da operação no MongoDB ---");
    console.log(result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Buscar item atualizado
    const updatedItem = await db.findOne("items", {
      _id: new ObjectId(itemId),
      userId: userId, // ← TRIANGULAÇÃO: confirmar que é do usuário
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/sections/[id]/items/[itemId]
 * Deleta um item específico (com triangulação por userId)
 */
export const DELETE = withAuth(async (request, { params }, { userId }) => {
  try {
    const { id, itemId } = await params;
    console.log("🔧 Items DELETE: userId =", userId);

    // Validar IDs
    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Verificar se o item existe, pertence à section E ao usuário (triangulação)
    const existingItem = await db.findOne("items", {
      _id: new ObjectId(itemId),
      sectionId: new ObjectId(id),
      userId: userId, // ← TRIANGULAÇÃO: só items do usuário
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Deletar item (com triangulação)
    const result = await db.deleteOne("items", {
      _id: new ObjectId(itemId),
      userId: userId, // ← TRIANGULAÇÃO: só deletar se for do usuário
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Item deleted successfully",
      deletedItem: existingItem,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
});
