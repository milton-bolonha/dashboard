import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSuperAdmin } from "@/lib/auth";
import { ObjectId } from "mongodb";

// PUT - Atualizar plano
export async function PUT(request, { params }) {
  const authCheck = await checkSuperAdmin();
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const data = await request.json();
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    const objectId = new ObjectId(id);

    // Verificar se plano existe
    const existing = await db.findOne("plans", { _id: objectId });
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Se mudando slug, verificar se novo slug já existe
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await db.findOne("plans", {
        slug: data.slug,
        _id: { $ne: objectId },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Plan with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Se marcando como default, desmarcar outros
    if (data.isDefault && !existing.isDefault) {
      await db.updateMany(
        "plans",
        { isDefault: true, _id: { $ne: objectId } },
        { $set: { isDefault: false } }
      );
    }

    // Preparar dados para atualização
    const updateData = {
      name: data.name || existing.name,
      slug: data.slug || existing.slug,
      description: data.description ?? existing.description,
      hierarchy: data.hierarchy ?? existing.hierarchy,
      isActive: data.isActive ?? existing.isActive,
      isDefault: data.isDefault ?? existing.isDefault,
      stripePriceIds: data.stripePriceIds || existing.stripePriceIds,
      limits: {
        ...existing.limits,
        ...data.limits,
      },
      features: data.features ?? existing.features,
      permissions: data.permissions ?? existing.permissions,
      metadata: data.metadata ?? existing.metadata,
      updatedAt: new Date(),
      updatedBy: authCheck.userId,
    };

    // Remover o _id dos dados de atualização para evitar erros
    const { _id, ...updatePayload } = updateData;

    // Atualizar plano
    await db.updateOne("plans", { _id: objectId }, updatePayload);

    // Retornar plano atualizado
    const updated = await db.findOne("plans", { _id: objectId });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar plano
export async function DELETE(request, { params }) {
  const authCheck = await checkSuperAdmin();
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { id } = params;
    const objectId = new ObjectId(id);

    // Verificar se plano existe
    const plan = await db.findOne("plans", { _id: objectId });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Não permitir deletar plano padrão
    if (plan.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default plan" },
        { status: 400 }
      );
    }

    // Verificar se há workspaces usando este plano
    const workspacesUsingPlan = await db.count("workspaces", { planId: id });
    if (workspacesUsingPlan > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan. ${workspacesUsingPlan} workspaces are using it.`,
        },
        { status: 400 }
      );
    }

    // Deletar plano
    await db.deleteOne("plans", { _id: objectId });

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
