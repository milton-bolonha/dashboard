/**
 * Guest Custom Tile Generation API
 * POST: Gera um tile customizado para uma entidade específica
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import { buildPromptContext } from "@/lib/theme-context-mapper";
import { generateTileWithMetrics } from "@/lib/ai-tile-generator-optimized";
import Joi from "joi";
import crypto from "crypto";

const customTileSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
  companyId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  prompt: Joi.string().max(1000).trim().required(),
}).strict();

const normalizeEntityKey = (themeSnapshot, providedKey) => {
  if (providedKey) return providedKey;
  if (!themeSnapshot) return "companies";
  const primaryEntity = themeSnapshot.entities?.find(
    (entity) => entity.isPrimary
  );
  if (!primaryEntity?.id) return "companies";
  const candidate = `${primaryEntity.id}s`;
  return candidate === "companys" ? "companies" : candidate;
};

const findEntityIndex = (entities, companyId) =>
  entities.findIndex(
    (entity) =>
      entity.id === companyId ||
      entity.name === companyId ||
      entity.title === companyId
  );

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/generate-custom-tile - Iniciando...");

    const body = await req.json();
    const { error, value } = customTileSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const {
      jobId,
      guestId,
      token,
      companyId,
      entityKey: providedEntityKey,
      prompt,
    } = value;

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.guestId !== guestId) {
      return NextResponse.json(
        { error: "Guest ID mismatch for this job" },
        { status: 403 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { error: "Invalid access token for this job" },
        { status: 403 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const entityKey = normalizeEntityKey(
      guestWorkspace.themeSnapshot,
      providedEntityKey
    );

    const entities = Array.isArray(guestWorkspace.workspace_data?.[entityKey])
      ? [...guestWorkspace.workspace_data[entityKey]]
      : [];

    const entityIndex = findEntityIndex(entities, companyId);
    if (entityIndex === -1) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const entity = entities[entityIndex];

    const promptContext = buildPromptContext(
      guestWorkspace.themeSnapshot,
      entity,
      guestWorkspace.context || {}
    );

    const tileDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: "Custom Research",
      prompt,
      category: "custom",
      order: entity.tiles?.length || 0,
      defaultSize: { w: 4, h: 2 },
      isCustom: true,
    };

    let generatedTile;

    try {
      const result = await generateTileWithMetrics(
        tileDefinition,
        promptContext,
        {
          theme: guestWorkspace.themeSnapshot,
          profile: { name: "CUSTOM_TILE", temperature: 0.6, maxTokens: 600 },
        }
      );

      generatedTile = {
        id: result.id || tileDefinition.id,
        title: result.title || tileDefinition.title,
        prompt: tileDefinition.prompt,
        question: tileDefinition.prompt,
        answer: result.answer || "No answer generated",
        excerpt:
          result.excerpt || (result.answer ? result.answer.slice(0, 200) : ""),
        category: tileDefinition.category,
        created_at: new Date().toISOString(),
        isCustom: true,
        metrics: {
          model: result.metrics?.model,
          generationTimeMs: result.metrics?.generation_duration_ms,
          attempts: result.metrics?.attempts || 1,
          fallback: Boolean(result.metrics?.fallback),
          tokens: result.metrics?.tokens,
        },
      };
    } catch (generationError) {
      console.error("⚠️ Falha ao gerar tile customizado:", generationError);
      generatedTile = {
        id: tileDefinition.id,
        title: tileDefinition.title,
        prompt: tileDefinition.prompt,
        question: tileDefinition.prompt,
        answer:
          "⚠️ No AI output was generated for this custom prompt. Please try again later.",
        excerpt:
          "Custom prompt failed. The AI did not return any content. Please retry.",
        category: tileDefinition.category,
        created_at: new Date().toISOString(),
        isCustom: true,
        metrics: {
          model: "gpt-4o-mini",
          fallback: true,
        },
      };
    }

    const tiles = Array.isArray(entity.tiles) ? [...entity.tiles] : [];
    tiles.push(generatedTile);

    entities[entityIndex] = {
      ...entity,
      tiles,
      tiles_status:
        tiles.length >= (entity.tiles_to_generate || tiles.length)
          ? "completed"
          : entity.tiles_status || "partial",
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          [`workspace_data.${entityKey}`]: entities,
          "usage.last_activity": new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✅ Tile customizado salvo para entidade ${companyId}`);

    return NextResponse.json({
      success: true,
      tile: generatedTile,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar tile customizado:", error);
    return NextResponse.json(
      { error: "Failed to generate custom tile" },
      { status: 500 }
    );
  }
}
