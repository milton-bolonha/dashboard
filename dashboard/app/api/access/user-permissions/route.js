import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = request.headers.get("x-workspace-id");
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    // Buscar workspace
    const workspace = await db.findOne("workspaces", { _id: workspaceId });
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Buscar membro
    const member = workspace.members?.find((m) => m.userId === userId);
    if (!member && workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      );
    }

    // Buscar plano
    let plan = null;
    let features = [];

    if (workspace.planId) {
      plan = await db.findOne("plans", { _id: workspace.planId });

      // Buscar features do plano
      if (plan?.features) {
        const featureIds = plan.features
          .filter((f) => f.enabled)
          .map((f) => f.featureId);

        const planFeatures = await db.find("features", {
          _id: { $in: featureIds },
          isActive: true,
        });

        features = planFeatures.map((f) => f.slug);
      }
    }

    // Buscar features compradas
    if (workspace.purchasedFeatures?.length > 0) {
      const activeFeatures = workspace.purchasedFeatures.filter(
        (f) => f.status === "active"
      );

      const featureIds = activeFeatures.map((f) => f.featureId);
      const purchasedFeatures = await db.find("features", {
        _id: { $in: featureIds },
        isActive: true,
      });

      features = [...features, ...purchasedFeatures.map((f) => f.slug)];
    }

    // Matriz de permissões por role
    const rolePermissions = {
      // Workspace
      "workspace.view": [
        "owner",
        "admin",
        "editor",
        "author",
        "viewer",
        "guest",
      ],
      "workspace.edit": ["owner", "admin"],
      "workspace.delete": ["owner"],

      // Sections
      "sections.create": ["owner", "admin", "editor"],
      "sections.edit": ["owner", "admin", "editor"],
      "sections.delete": ["owner", "admin"],
      "sections.view": ["owner", "admin", "editor", "author", "viewer"],

      // Items
      "items.create": ["owner", "admin", "editor", "author"],
      "items.edit.any": ["owner", "admin", "editor"],
      "items.edit.own": ["author"],
      "items.delete.any": ["owner", "admin"],
      "items.delete.own": ["editor", "author"],
      "items.view": ["owner", "admin", "editor", "author", "viewer"],

      // Content Types
      "contentTypes.create": ["owner", "admin"],
      "contentTypes.edit": ["owner", "admin"],
      "contentTypes.delete": ["owner"],

      // Billing
      "billing.view": ["owner", "admin"],
      "billing.manage": ["owner"],

      // Members
      "members.invite": ["owner", "admin"],
      "members.remove": ["owner", "admin"],
      "members.changeRole": ["owner"],

      // Settings
      "settings.view": ["owner", "admin", "editor"],
      "settings.edit": ["owner", "admin"],
    };

    // Calcular limites efetivos
    let limits = { ...(plan?.limits || {}) };

    // Aplicar modificadores de features
    for (const featureSlug of features) {
      const feature = await db.findOne("features", { slug: featureSlug });
      if (feature?.config?.limitModifiers) {
        for (const [key, modifier] of Object.entries(
          feature.config.limitModifiers
        )) {
          if (modifier.operation === "add") {
            limits[key] = (limits[key] || 0) + modifier.value;
          } else if (modifier.operation === "multiply") {
            limits[key] = (limits[key] || 0) * modifier.value;
          } else if (modifier.operation === "set") {
            limits[key] = modifier.value;
          }
        }
      }
    }

    // Aplicar limites customizados do workspace
    if (workspace.limits?.customLimits) {
      limits = { ...limits, ...workspace.limits.customLimits };
    }

    return NextResponse.json({
      member: member || {
        userId,
        role: workspace.ownerId === userId ? "owner" : "viewer",
      },
      plan: plan
        ? {
            id: plan._id,
            name: plan.name,
            slug: plan.slug,
          }
        : null,
      features: [...new Set(features)], // Remover duplicatas
      limits,
      usage: workspace.usage || {},
      rolePermissions,
    });
  } catch (error) {
    console.error("User permissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
