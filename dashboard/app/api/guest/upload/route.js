import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import { uploadFile as uploadToCloudinary } from "@/lib/cloudinary";
import Joi from "joi";
import crypto from "crypto";
import { withMongoErrorHandler } from "@/lib/withMongoErrorHandler";
import { withMongoConnectionHandler } from "@/lib/withMongoConnectionHandler";

const uploadSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  companyName: Joi.string().optional(),
  category: Joi.string().optional(),
  fileData: Joi.string().required(),
  fileName: Joi.string().required(),
}).strict();

const uploadHandler = async (req) => {
  try {
    console.log("📥 POST /api/guest/upload - Iniciando upload...");

    const body = await req.json();
    const { error, value } = uploadSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.details[0].message },
        { status: 400 }
      );
    }

    const { jobId, guestId, token, companyId, companyName, category } = value;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }
    if (job.guestId !== guestId) {
      return NextResponse.json(
        { success: false, error: "Guest ID mismatch for this job" },
        { status: 403 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { success: false, error: "Invalid access token for this job" },
        { status: 403 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const folderCompanySegment = companyName || companyId;
    const folder = `workspaces/${guestId}/entities/${folderCompanySegment}/${
      category || "documents"
    }`;

    const fileBuffer = Buffer.from(value.fileData, "base64");
    console.log(
      `📊 File info: ${value.fileName}, size: ${fileBuffer.length} bytes`
    );

    const result = await uploadToCloudinary(fileBuffer, value.fileName, folder);
    console.log("✅ Arquivo enviado com sucesso para o Cloudinary:", result);

    return NextResponse.json({
      success: true,
      file: result,
    });
  } catch (error) {
    console.error("❌ Erro no upload para o Cloudinary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file to Cloudinary" },
      { status: 500 }
    );
  }
};

export const POST = withMongoConnectionHandler(
  withMongoErrorHandler(uploadHandler, {
    message: "Failed to upload file",
  }),
  {
    label: "guest-upload:post",
    stage: "guest-upload",
  }
);
