import { auth } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

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

// GET - Listar todos os planos
export async function GET(request) {
  const authCheck = await checkSuperAdmin();
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const plans = await db.find("plans", {}).sort({ hierarchy: 1 });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Criar novo plano
export async function POST(request) {
  const authCheck = await checkSuperAdmin();
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const data = await request.json();

    // Validações básicas
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Verificar se slug já existe
    const existing = await db.findOne("plans", { slug: data.slug });
    if (existing) {
      return NextResponse.json(
        { error: "Plan with this slug already exists" },
        { status: 400 }
      );
    }

    // Se marcando como default, desmarcar outros
    if (data.isDefault) {
      await db.updateMany(
        "plans",
        { isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    // Criar plano
    const plan = {
      _id: new ObjectId().toString(),
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      hierarchy: data.hierarchy || 0,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault || false,
      stripePriceIds: data.stripePriceIds || {},
      limits: {
        workspaces: data.limits?.workspaces || 1,
        workspaceMembers: data.limits?.workspaceMembers || 5,
        sections: data.limits?.sections || 10,
        itemsPerSection: data.limits?.itemsPerSection || 100,
        storage: data.limits?.storage || 1073741824,
        apiCalls: data.limits?.apiCalls || 1000,
        customLimits: data.limits?.customLimits || {},
      },
      features: data.features || [],
      permissions: data.permissions || [],
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: authCheck.userId,
    };

    await db.insertOne("plans", plan);

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
