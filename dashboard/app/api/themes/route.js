import { NextResponse } from "next/server";
import { BASE_THEMES } from "@/lib/base-themes";

export async function GET() {
  try {
    console.log("📥 GET /api/themes - Iniciando...");

    const themes = Object.values(BASE_THEMES);

    console.log(`✅ Retornando ${themes.length} temas`);

    return NextResponse.json({
      success: true,
      themes: themes,
    });
  } catch (error) {
    console.error("❌ Error fetching themes:", error);

    // Fallback em caso de erro
    const themes = Object.values(BASE_THEMES);
    return NextResponse.json({
      success: false,
      themes: themes,
      error: error.message,
    });
  }
}
