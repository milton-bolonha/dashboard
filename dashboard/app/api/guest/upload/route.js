import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadFile as uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/upload - Iniciando upload...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;
    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fileData, fileName, companyName, category } = body;

    if (!fileData || !fileName || !companyName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for upload." },
        { status: 400 }
      );
    }

    const folder = `workspaces/${guestId}/companies/${companyName}/${
      category || "documents"
    }`;

    // Converter base64 para buffer
    const fileBuffer = Buffer.from(fileData, "base64");
    const result = await uploadToCloudinary(fileBuffer, fileName, folder);

    console.log("✅ Arquivo enviado com sucesso para o Cloudinary.");

    return NextResponse.json({ success: true, file: result });
  } catch (error) {
    console.error("❌ Erro no upload para o Cloudinary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file to Cloudinary" },
      { status: 500 }
    );
  }
}
