/**
 * Cloudinary Integration
 * Sistema de upload e gestão de arquivos
 */

import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary
const cloudName =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("🔧 Cloudinary config:", {
  cloudName: cloudName ? "✅ Set" : "❌ Missing",
  apiKey: apiKey ? "✅ Set" : "❌ Missing",
  apiSecret: apiSecret ? "✅ Set" : "❌ Missing",
});

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("⚠️ Cloudinary not configured - using demo mode");
}

cloudinary.config({
  cloud_name: cloudName || "demo",
  api_key: apiKey || "demo",
  api_secret: apiSecret || "demo",
});

/**
 * Upload de arquivo para Cloudinary
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} folder - Pasta de destino
 * @param {object} options - Opções adicionais
 */
export async function uploadFile(fileBuffer, fileName, folder, options = {}) {
  try {
    console.log(`📤 Uploading file: ${fileName} to folder: ${folder}`);

    // Verificar se Cloudinary está configurado
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === "demo") {
      console.log("⚠️ Cloudinary not configured, returning mock success");
      return {
        success: true,
        file: {
          id: `mock_${Date.now()}`,
          secure_url: `https://via.placeholder.com/300x200?text=${fileName}`,
          url: `https://via.placeholder.com/300x200?text=${fileName}`,
          publicId: `mock_${Date.now()}`,
          format: fileName.split(".").pop(),
          size: fileBuffer.length,
          width: 300,
          height: 200,
          folder: folder,
          createdAt: new Date(),
        },
      };
    }

    const result = await cloudinary.uploader.upload(
      `data:application/octet-stream;base64,${fileBuffer.toString("base64")}`,
      {
        public_id: `${folder}/${fileName}`,
        resource_type: "auto",
        folder: folder,
        ...options,
      }
    );

    console.log(`✅ File uploaded successfully: ${result.public_id}`);
    return {
      success: true,
      file: {
        id: result.public_id,
        secure_url: result.secure_url,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        folder: result.folder,
        createdAt: new Date(),
      },
    };
  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deletar arquivo do Cloudinary
 * @param {string} publicId - ID público do arquivo
 */
export async function deleteFile(publicId) {
  try {
    console.log(`🗑️ Deleting file: ${publicId}`);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log(`✅ File deleted successfully: ${publicId}`);
      return { success: true };
    } else {
      console.log(`⚠️ File not found: ${publicId}`);
      return { success: false, error: "File not found" };
    }
  } catch (error) {
    console.error("❌ Erro ao deletar arquivo:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Listar arquivos de uma pasta
 * @param {string} folder - Pasta para listar
 */
export async function listFiles(folder) {
  try {
    console.log(`📁 Listing files in folder: ${folder}`);

    // Verificar se Cloudinary está configurado
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === "demo") {
      console.log("⚠️ Cloudinary not configured, returning empty list");
      return {
        success: true,
        files: [],
      };
    }

    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .max_results(100)
      .execute();

    console.log(`✅ Found ${result.resources.length} files in ${folder}`);
    return {
      success: true,
      files: result.resources.map((resource) => ({
        id: resource.public_id,
        url: resource.secure_url,
        publicId: resource.public_id,
        format: resource.format,
        size: resource.bytes,
        width: resource.width,
        height: resource.height,
        folder: resource.folder,
        createdAt: new Date(resource.created_at),
      })),
    };
  } catch (error) {
    console.error("❌ Erro ao listar arquivos:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gerar URL de upload assinada
 * @param {string} folder - Pasta de destino
 * @param {string} fileName - Nome do arquivo
 */
export function generateUploadUrl(folder, fileName) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${fileName}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        public_id: publicId,
        timestamp: timestamp,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME;
    return {
      success: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      params: {
        public_id: publicId,
        timestamp: timestamp,
        signature: signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder: folder,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao gerar URL de upload:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validar tipo de arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} mimeType - Tipo MIME
 */
export function validateFileType(fileName, mimeType) {
  const allowedTypes = {
    // Documentos
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "text/csv": [".csv"],
    "text/plain": [".txt"],

    // Imagens
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],

    // Outros
    "application/zip": [".zip"],
    "application/x-rar-compressed": [".rar"],
  };

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf("."));

  if (allowedTypes[mimeType] && allowedTypes[mimeType].includes(extension)) {
    return { valid: true, type: getFileCategory(mimeType) };
  }

  return { valid: false, type: "unknown" };
}

/**
 * Categorizar tipo de arquivo
 * @param {string} mimeType - Tipo MIME
 */
function getFileCategory(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("application/pdf")) return "document";
  if (
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "document";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
  return "other";
}

/**
 * Gerar nome de pasta para arquivo
 * @param {string} guestId - ID da sessão guest
 * @param {string} companyId - ID da company
 * @param {string} category - Categoria do arquivo
 */
export function generateFolderPath(guestId, companyId, category = "documents") {
  return `workspaces/${guestId}/companies/${companyId}/${category}`;
}
