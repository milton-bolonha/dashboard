import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";
import crypto from "crypto";

const getTemplatesSchema = Joi.object({
  jobId: Joi.string().required(),
  guestId: Joi.string().required(),
  token: Joi.string().required(),
}).strict();

const templateSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().allow("").max(500),
  tiles: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        prompt: Joi.string().required(),
        category: Joi.string().required(),
        order: Joi.number().required(),
        defaultSize: Joi.object({
          w: Joi.number().required(),
          h: Joi.number().required(),
        }).required(),
        isCustom: Joi.boolean().optional(),
      })
    )
    .required(),
}).strict();

const defaultTemplates = [
  {
    id: "template_1",
    name: "Essential Research",
    description: "Basic company research with 8 key insights",
    isDefault: true,
    isCustom: false,
    tiles: [
      {
        id: "funding",
        title: "Funding",
        prompt: "What is the latest funding information for {{company_name}}?",
        category: "Financial",
        order: 1,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "competitors",
        title: "Competitors",
        prompt: "Who are the main competitors of {{company_name}}?",
        category: "Market",
        order: 2,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "key_events",
        title: "Key Events",
        prompt: "What are the recent key events for {{company_name}}?",
        category: "News",
        order: 3,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "expansion",
        title: "Expansion",
        prompt: "What are the expansion plans for {{company_name}}?",
        category: "Growth",
        order: 4,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "offices",
        title: "Offices",
        prompt: "How many offices does {{company_name}} have worldwide?",
        category: "Operations",
        order: 5,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "revenue",
        title: "Revenue",
        prompt: "What is the revenue model of {{company_name}}?",
        category: "Financial",
        order: 6,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "challenges",
        title: "Challenges",
        prompt: "What are the main challenges {{company_name}} faces?",
        category: "Strategy",
        order: 7,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "goals",
        title: "Goals",
        prompt: "What are the business goals of {{company_name}}?",
        category: "Strategy",
        order: 8,
        defaultSize: { w: 2, h: 1 },
      },
    ],
  },
  {
    id: "template_2",
    name: "Advanced Analysis",
    description: "Comprehensive analysis with 9 detailed insights",
    isDefault: true,
    isCustom: false,
    tiles: [
      {
        id: "funding",
        title: "Funding",
        prompt: "What is the latest funding information for {{company_name}}?",
        category: "Financial",
        order: 1,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "competitors",
        title: "Competitors",
        prompt: "Who are the main competitors of {{company_name}}?",
        category: "Market",
        order: 2,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "key_events",
        title: "Key Events",
        prompt: "What are the recent key events for {{company_name}}?",
        category: "News",
        order: 3,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "expansion",
        title: "Expansion",
        prompt: "What are the expansion plans for {{company_name}}?",
        category: "Growth",
        order: 4,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "offices",
        title: "Offices",
        prompt: "How many offices does {{company_name}} have worldwide?",
        category: "Operations",
        order: 5,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "revenue",
        title: "Revenue",
        prompt: "What is the revenue model of {{company_name}}?",
        category: "Financial",
        order: 6,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "challenges",
        title: "Challenges",
        prompt: "What are the main challenges {{company_name}} faces?",
        category: "Strategy",
        order: 7,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "goals",
        title: "Goals",
        prompt: "What are the business goals of {{company_name}}?",
        category: "Strategy",
        order: 8,
        defaultSize: { w: 2, h: 1 },
      },
      {
        id: "technology",
        title: "Technology",
        prompt: "What technology stack does {{company_name}} use?",
        category: "Technical",
        order: 9,
        defaultSize: { w: 2, h: 1 },
      },
    ],
  },
];

const authorizeRequest = async ({ jobId, guestId, token }) => {
  const job = await getJob(jobId);
  if (!job) {
    throw new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
    });
  }
  if (job.guestId !== guestId) {
    throw new Response(JSON.stringify({ error: "Guest ID mismatch" }), {
      status: 403,
    });
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  if (job.accessTokenHash !== tokenHash) {
    throw new Response(JSON.stringify({ error: "Invalid access token" }), {
      status: 403,
    });
  }
  return job;
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const payload = {
      jobId: searchParams.get("job_id"),
      guestId: searchParams.get("guest_id"),
      token: searchParams.get("token"),
    };

    const { error, value } = getTemplatesSchema.validate(payload);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.details[0].message },
        { status: 400 }
      );
    }

    try {
      await authorizeRequest(value);
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: value.guestId,
    });

    const customTemplates = guestWorkspace?.custom_templates || [];

    return NextResponse.json({
      success: true,
      templates: [...defaultTemplates, ...customTemplates],
    });
  } catch (error) {
    console.error("❌ Erro ao listar templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { jobId, guestId, token, template } = body || {};

    const { error: templateValidationError, value: templateValue } =
      templateSchema.validate(template || {});

    if (!jobId || !guestId || !token) {
      return NextResponse.json(
        { error: "jobId, guestId and token are required" },
        { status: 400 }
      );
    }

    if (templateValidationError) {
      return NextResponse.json(
        { error: templateValidationError.details[0].message },
        { status: 400 }
      );
    }

    try {
      await authorizeRequest({ jobId, guestId, token });
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
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

    const newTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      isDefault: false,
      isCustom: true,
      ...templateValue,
      createdAt: new Date().toISOString(),
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: { custom_templates: newTemplate },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error) {
    console.error("❌ Erro ao salvar template:", error);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}
