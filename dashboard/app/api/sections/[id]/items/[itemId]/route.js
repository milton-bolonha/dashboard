import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { ObjectId } from "mongodb";
import { getCurrentUserId, withAuth } from "@/lib/auth";

/**
 * PUT /api/sections/[id]/items/[itemId]
 * Atualiza um item específico (com triangulação por userId)
 */
export const PUT = withAuth(async (request, { params }) => {
  try {
    const { id, itemId } = await params;
    const data = await request.json();
    const userId = getCurrentUserId();

    // Validar IDs
    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Verificar se o item existe, pertence à section E ao usuário (triangulação)
    const existingItem = await db.findOne("items", {
      _id: new ObjectId(itemId),
      sectionId: id,
      userId: userId, // ← TRIANGULAÇÃO: só items do usuário
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Atualizar item (novo sistema com data dos addons)
    const updateData = {
      title: data.title || existingItem.title,
      status: data.status || existingItem.status,
      data: data.data !== undefined ? data.data : existingItem.data, // ← Dados dos addons
      // Manter compatibilidade com campo antigo
      content: data.content !== undefined ? data.content : existingItem.content,
      updatedAt: new Date(),
    };

    // Se título mudou, gerar novo slug
    if (data.title && data.title !== existingItem.title) {
      const newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Verificar se novo slug já existe NO ESCOPO DO USUÁRIO (triangulação)
      const slugExists = await db.findOne("items", {
        sectionId: id,
        userId: userId, // ← TRIANGULAÇÃO: só verificar no escopo do usuário
        slug: newSlug,
        _id: { $ne: new ObjectId(itemId) },
      });

      updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
    }

    const result = await db.updateOne(
      "items",
      {
        _id: new ObjectId(itemId),
        userId: userId, // ← TRIANGULAÇÃO: só atualizar se for do usuário
      },
      updateData
    );

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
export const DELETE = withAuth(async (request, { params }) => {
  try {
    const { id, itemId } = await params;
    const userId = getCurrentUserId();

    // Validar IDs
    if (!ObjectId.isValid(id) || !ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Verificar se o item existe, pertence à section E ao usuário (triangulação)
    const existingItem = await db.findOne("items", {
      _id: new ObjectId(itemId),
      sectionId: id,
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
