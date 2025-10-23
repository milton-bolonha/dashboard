/**
 * Guest Files API - Individual File
 * DELETE: Deleta arquivo
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/cloudinary";

/**
 * DELETE /api/guest/files/[id]
 * Deleta um arquivo específico
 */
export async function DELETE(req, { params }) {
  try {
    console.log(`📥 DELETE /api/guest/files/${params.id} - Iniciando...`);

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const fileId = params.id;

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Buscar e deletar arquivo
    let fileFound = false;
    const companies = guestWorkspace.workspace_data.companies;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      if (company.files) {
        const fileIndex = company.files.findIndex((file) => file.id === fileId);
        if (fileIndex !== -1) {
          const file = company.files[fileIndex];

          // Deletar do Cloudinary
          const cloudinaryResult = await deleteFile(file.cloudinaryId);
          if (!cloudinaryResult.success) {
            console.warn(
              `⚠️ Failed to delete from Cloudinary: ${file.cloudinaryId}`
            );
          }

          // Deletar referência do banco
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $unset: {
                [`workspace_data.companies.${i}.files.${fileIndex}`]: 1,
              },
              $set: {
                "usage.last_activity": new Date(),
              },
            }
          );

          // Limpar array de arquivos (remover nulls)
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $pull: {
                [`workspace_data.companies.${i}.files`]: null,
              },
            }
          );

          fileFound = true;
          break;
        }
      }
    }

    if (!fileFound) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.log(`✅ Arquivo deletado: ${fileId}`);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar arquivo:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
