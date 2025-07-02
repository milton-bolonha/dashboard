import { auth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Verificar se é super admin
async function checkSuperAdmin() {
  const { userId } = auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await currentUser();
  if (user?.publicMetadata?.role !== "superadmin") {
    return { error: "Forbidden - Super admin only", status: 403 };
  }

  return { userId, user };
}

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
    const { id } = params;
    const data = await request.json();

    // Verificar se plano existe
    const existing = await db.findOne("plans", { _id: id });
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Se mudando slug, verificar se novo slug já existe
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await db.findOne("plans", {
        slug: data.slug,
        _id: { $ne: id },
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
        { isDefault: true, _id: { $ne: id } },
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

    // Atualizar plano
    await db.updateOne("plans", { _id: id }, { $set: updateData });

    // Retornar plano atualizado
    const updated = await db.findOne("plans", { _id: id });
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

    // Verificar se plano existe
    const plan = await db.findOne("plans", { _id: id });
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
    await db.deleteOne("plans", { _id: id });

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
