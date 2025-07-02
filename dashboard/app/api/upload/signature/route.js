import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload/signature
 * Gera assinatura segura para upload no Cloudinary
 * Organiza por: workspace/section/userId/
 */
export async function POST(request) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    console.log("🔑 User ID:", userId); // Debug

    if (!userId) {
      console.log("❌ Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar configuração do Cloudinary
    console.log("🌤️ Verificando config Cloudinary...");
    console.log("CLOUD_NAME:", !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    console.log("API_KEY:", !!process.env.CLOUDINARY_API_KEY);
    console.log("API_SECRET:", !!process.env.CLOUDINARY_API_SECRET);

    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.log("❌ Cloudinary não configurado");
      return NextResponse.json(
        { error: "Cloudinary não configurado" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      folder = "uploads",
      workspaceSlug,
      sectionSlug,
      addonFolder,
    } = body;

    // 🗂️ NOVA ESTRUTURA ORGANIZACIONAL
    let finalFolder;

    if (workspaceSlug && sectionSlug) {
      // Estrutura completa: workspace/section/userId/addon
      const addonPath = addonFolder ? `/${addonFolder}` : "";
      finalFolder = `${workspaceSlug}/${sectionSlug}/${userId}${addonPath}`;
    } else if (workspaceSlug) {
      // Apenas workspace: workspace/userId/folder
      finalFolder = `${workspaceSlug}/${userId}/${folder}`;
    } else {
      // Fallback original: folder/userId
      finalFolder = `${folder}/${userId}`;
    }

    // Parâmetros do upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder: finalFolder,
      upload_preset: undefined, // Usar assinatura em vez de preset
    };

    // Gerar assinatura
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    // Upload organizado automaticamente

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: finalFolder,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error("Erro ao gerar assinatura:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
