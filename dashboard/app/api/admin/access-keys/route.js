import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AccessKeys } from "@/lib/access-keys";
import { checkSuperAdmin } from "@/lib/auth";

// GET - Listar chaves
export async function GET(request) {
  const authCheck = await checkSuperAdmin();
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get("type") || undefined,
      isActive:
        searchParams.get("isActive") === "true"
          ? true
          : searchParams.get("isActive") === "false"
          ? false
          : undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean),
    };

    const keys = await AccessKeys.listKeys(filters);

    return NextResponse.json(keys);
  } catch (error) {
    console.error("Erro ao listar chaves:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Criar nova chave
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

    // Validações
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    if (!["plan", "feature", "addon", "custom"].includes(data.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Validar grants baseado no tipo
    if (data.type === "plan" && !data.grants?.planId) {
      return NextResponse.json(
        { error: "planId is required for plan type" },
        { status: 400 }
      );
    }

    if (
      data.type === "feature" &&
      (!data.grants?.featureIds || data.grants.featureIds.length === 0)
    ) {
      return NextResponse.json(
        { error: "featureIds are required for feature type" },
        { status: 400 }
      );
    }

    const keyConfig = {
      name: data.name,
      description: data.description || "",
      type: data.type,
      grants: data.grants || {},
      usage: {
        maxUses: data.usage?.maxUses || 1,
        allowMultiplePerUser: data.usage?.allowMultiplePerUser || false,
        allowMultiplePerWorkspace:
          data.usage?.allowMultiplePerWorkspace || false,
      },
      restrictions: {
        validFrom: data.restrictions?.validFrom
          ? new Date(data.restrictions.validFrom)
          : null,
        validUntil: data.restrictions?.validUntil
          ? new Date(data.restrictions.validUntil)
          : null,
        allowedEmails: data.restrictions?.allowedEmails || [],
        allowedDomains: data.restrictions?.allowedDomains || [],
        isPublic: data.restrictions?.isPublic || false,
      },
      tags: data.tags || [],
      createdBy: authCheck.userId,
    };

    console.log("Creating key with config:", keyConfig);
    const key = await AccessKeys.generateKey(keyConfig);

    return NextResponse.json(key, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar chave:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
