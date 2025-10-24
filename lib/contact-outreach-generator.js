import { generateTileWithOpenAI as generateTileOnServer } from "@/lib/ai-tile-generator";

// =========================================
// FUNÇÕES DO SERVIDOR (Chamada Direta)
// =========================================

async function generateContactInsightsOnServer(contact, company, context) {
  const prompt = `
    Analyze this contact for sales outreach:
    CONTACT:
    - Name: ${contact.name}
    - Role: ${contact.role || contact.title || "Unknown Role"}
    - Company: ${company.name}
    - Industry: ${company.industry || "Unknown"}
    COMPANY CONTEXT:
    - Business Goals: ${context.businessGoals || "Not specified"}
    - Challenges: ${context.challenges || "Not specified"}
    - Revenue Model: ${context.revenueModel || "Not specified"}
    - Files: ${context.fileCount || 0} documents uploaded
    - Notes: ${context.noteCount || 0} notes available
    Generate contact insights including:
    - Role summary and key responsibilities
    - Likely KPIs and success metrics
    - Pain points and challenges they face
    - Triggers and motivations for outreach
    - Best approach for initial contact
    Format as bullet points, max 200 words.
  `;

  return await generateTileOnServer(
    prompt,
    { title: "Contact Insights", company: company.name, isOutreach: true },
    company.name
  );
}

async function generateEmailPitchOnServer(contact, company, context) {
  const prompt = `
    Write a personalized cold email for this contact:
    CONTACT:
    - Name: ${contact.name}
    - Role: ${contact.role || contact.title || "Unknown Role"}
    - Company: ${company.name}
    COMPANY RESEARCH:
    - Business Goals: ${context.businessGoals || "Not specified"}
    - Current Challenges: ${context.challenges || "Not specified"}
    - Revenue Model: ${context.revenueModel || "Not specified"}
    - Context from ${context.fileCount || 0} uploaded files
    - Additional notes: ${context.noteCount || 0} notes
    Email requirements:
    - Personalized subject line
    - Reference their business goals or challenges
    - Keep it under 75 words
    - Include 3 bullet points maximum
    - Professional but conversational tone
    - Clear next steps
    Format as: Subject: [subject] / Body: [email content]
  `;

  return await generateTileOnServer(
    prompt,
    { title: "Email Pitch", company: company.name, isOutreach: true },
    company.name
  );
}

async function generateColdCallScriptOnServer(contact, company, context) {
  const prompt = `
    Create a cold call script for this contact:
    CONTACT:
    - Name: ${contact.name}
    - Role: ${contact.role || contact.title || "Unknown Role"}
    - Company: ${company.name}
    COMPANY CONTEXT:
    - Business Goals: ${context.businessGoals || "Not specified"}
    - Challenges: ${context.challenges || "Not specified"}
    - Industry: ${company.industry || "Unknown"}
    - Additional context from ${context.fileCount || 0} files
    - Notes: ${context.noteCount || 0} notes available
    Script structure:
    - Opening hook (reference their goals/challenges)
    - Value proposition
    - Discovery questions (3-4 questions)
    - Next steps
    - Objection handling
    Format as bullet points, conversational tone.
    Max 150 words.
  `;

  return await generateTileOnServer(
    prompt,
    { title: "Cold Call Script", company: company.name, isOutreach: true },
    company.name
  );
}

/**
 * FUNÇÃO PRINCIPAL - USADA PELA API add-contact
 */
export async function generateContactOutreachOnServer(
  contact,
  company,
  context = {}
) {
  try {
    console.log(`🚀 Gerando outreach tiles para: ${contact.name}`);

    const [contactInsights, emailPitch, coldCallScript] = await Promise.all([
      generateContactInsightsOnServer(contact, company, context),
      generateEmailPitchOnServer(contact, company, context),
      generateColdCallScriptOnServer(contact, company, context),
    ]);

    return {
      contactInsights,
      emailPitch,
      coldCallScript,
    };
  } catch (error) {
    console.error("❌ Erro ao gerar outreach tiles no servidor:", error);
    throw error;
  }
}

// =========================================
// FUNÇÕES DO CLIENTE (Chamada API)
// =========================================

async function generateTileWithApi(prompt, title, companyName) {
  const response = await fetch("/api/guest/generate-custom-tile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName,
      prompt: prompt.trim(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to generate tile: ${errorData.error || "Unknown error"}`
    );
  }

  const data = await response.json();
  return data.tile;
}

/**
 * Para regenerar tiles individuais no frontend
 */
export async function regenerateOutreachTile(
  tileType,
  contact,
  company,
  context = {}
) {
  console.log(`🔄 Regenerando ${tileType} via API...`);

  let prompt = "";

  switch (tileType) {
    case "contactInsights":
      prompt = `
        Analyze this contact for sales outreach:
        CONTACT: - Name: ${contact.name} - Role: ${
        contact.role || contact.title || "Unknown Role"
      } - Company: ${company.name} - Industry: ${company.industry || "Unknown"}
        COMPANY CONTEXT: - Business Goals: ${
          context.businessGoals || "Not specified"
        } - Challenges: ${
        context.challenges || "Not specified"
      } - Revenue Model: ${context.revenueModel || "Not specified"} - Files: ${
        context.fileCount || 0
      } documents uploaded - Notes: ${context.noteCount || 0} notes available
        Generate contact insights including: - Role summary and key responsibilities - Likely KPIs and success metrics - Pain points and challenges they face - Triggers and motivations for outreach - Best approach for initial contact
        Format as bullet points, max 200 words.
      `;
      break;

    case "emailPitch":
      prompt = `
        Write a personalized cold email for this contact:
        CONTACT: - Name: ${contact.name} - Role: ${
        contact.role || contact.title || "Unknown Role"
      } - Company: ${company.name}
        COMPANY RESEARCH: - Business Goals: ${
          context.businessGoals || "Not specified"
        } - Current Challenges: ${
        context.challenges || "Not specified"
      } - Revenue Model: ${
        context.revenueModel || "Not specified"
      } - Context from ${
        context.fileCount || 0
      } uploaded files - Additional notes: ${context.noteCount || 0} notes
        Email requirements: - Personalized subject line - Reference their business goals or challenges - Keep it under 75 words - Include 3 bullet points maximum - Professional but conversational tone - Clear next steps
        Format as: Subject: [subject] / Body: [email content]
      `;
      break;

    case "coldCallScript":
      prompt = `
        Create a cold call script for this contact:
        CONTACT: - Name: ${contact.name} - Role: ${
        contact.role || contact.title || "Unknown Role"
      } - Company: ${company.name}
        COMPANY CONTEXT: - Business Goals: ${
          context.businessGoals || "Not specified"
        } - Challenges: ${context.challenges || "Not specified"} - Industry: ${
        company.industry || "Unknown"
      } - Additional context from ${context.fileCount || 0} files - Notes: ${
        context.noteCount || 0
      } notes available
        Script structure: - Opening hook (reference their goals/challenges) - Value proposition - Discovery questions (3-4 questions) - Next steps - Objection handling
        Format as bullet points, conversational tone. Max 150 words.
      `;
      break;

    default:
      throw new Error(`Invalid tile type for regeneration: ${tileType}`);
  }

  return await generateTileWithApi(prompt, tileType, company.name);
}
