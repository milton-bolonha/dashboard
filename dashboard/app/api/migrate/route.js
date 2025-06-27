import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";

/**
 * POST /api/migrate
 * Migra dados antigos sem userId para o usuário atual
 */
export async function POST() {
  try {
    const authData = getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log("🔄 MIGRAÇÃO: Iniciando migração para userId:", userId);

    let migratedCount = 0;

    // 1. Migrar Content Types sem userId
    const contentTypesWithoutUser = await db.find("contentTypes", {
      userId: { $exists: false },
    });

    for (const ct of contentTypesWithoutUser) {
      await db.updateOne("contentTypes", { _id: ct._id }, { userId: userId });
      migratedCount++;
    }

    console.log(
      `✅ MIGRAÇÃO: ${contentTypesWithoutUser.length} content types migrados`
    );

    // 2. Migrar Sections sem userId
    const sectionsWithoutUser = await db.find("sections", {
      userId: { $exists: false },
    });

    for (const section of sectionsWithoutUser) {
      await db.updateOne("sections", { _id: section._id }, { userId: userId });
      migratedCount++;
    }

    console.log(`✅ MIGRAÇÃO: ${sectionsWithoutUser.length} sections migradas`);

    // 3. Migrar Items sem userId (se existirem)
    try {
      const itemsWithoutUser = await db.find("items", {
        userId: { $exists: false },
      });

      for (const item of itemsWithoutUser) {
        await db.updateOne("items", { _id: item._id }, { userId: userId });
        migratedCount++;
      }

      console.log(`✅ MIGRAÇÃO: ${itemsWithoutUser.length} items migrados`);
    } catch (error) {
      console.log("⚠️ MIGRAÇÃO: Collection 'items' não existe ainda");
    }

    return NextResponse.json({
      success: true,
      message: `✅ Migração concluída! ${migratedCount} registros migrados para ${userId}`,
      details: {
        contentTypes: contentTypesWithoutUser.length,
        sections: sectionsWithoutUser.length,
        userId: userId,
        isAuthenticated: !!authData.userId,
      },
    });
  } catch (error) {
    console.error("❌ MIGRAÇÃO: Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "❌ Falha na migração",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migrate
 * Verifica dados órfãos (sem userId)
 */
export async function GET() {
  try {
    const authData = getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    const orphanContentTypes = await db.find("contentTypes", {
      userId: { $exists: false },
    });

    const orphanSections = await db.find("sections", {
      userId: { $exists: false },
    });

    let orphanItems = [];
    try {
      orphanItems = await db.find("items", {
        userId: { $exists: false },
      });
    } catch (error) {
      console.log("⚠️ Collection 'items' não existe");
    }

    const currentUserData = {
      contentTypes: await db.find("contentTypes", { userId }),
      sections: await db.find("sections", { userId }),
    };

    return NextResponse.json({
      orphanData: {
        contentTypes: orphanContentTypes.length,
        sections: orphanSections.length,
        items: orphanItems.length,
      },
      currentUserData: {
        contentTypes: currentUserData.contentTypes.length,
        sections: currentUserData.sections.length,
      },
      userId,
      isAuthenticated: !!authData.userId,
      needsMigration:
        orphanContentTypes.length > 0 ||
        orphanSections.length > 0 ||
        orphanItems.length > 0,
    });
  } catch (error) {
    console.error("❌ Erro ao verificar migração:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
