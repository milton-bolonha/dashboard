/**
 * Contact Outreach Generator
 * Gera automaticamente 3 tiles de outreach para cada contato
 */

// Função para chamar API de geração de tiles
async function generateTileWithOpenAI(prompt, title, companyName = "Corassol") {
  try {
    const response = await fetch("/api/guest/generate-custom-tile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        prompt: prompt.trim(), // Remover whitespace
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error:", errorData);
      throw new Error(
        `Failed to generate tile: ${errorData.error || "Unknown error"}`
      );
    }

    const data = await response.json();
    return data.tile;
  } catch (error) {
    console.error("❌ Erro ao gerar tile:", error);
    throw error;
  }
}

/**
 * Gera tiles de outreach para um contato
 * @param {Object} contact - Dados do contato
 * @param {Object} company - Dados da empresa
 * @param {Object} context - Contexto adicional (tiles, files, notes)
 */
export async function generateContactOutreach(contact, company, context = {}) {
  try {
    console.log(
      `🎯 Gerando outreach tiles para: ${contact.name} (${contact.role})`
    );

    const outreachTiles = await Promise.all([
      generateContactInsights(contact, company, context),
      generateEmailPitch(contact, company, context),
      generateColdCallScript(contact, company, context),
    ]);

    return {
      contactInsights: outreachTiles[0],
      emailPitch: outreachTiles[1],
      coldCallScript: outreachTiles[2],
    };
  } catch (error) {
    console.error("❌ Erro ao gerar outreach tiles:", error);
    throw error;
  }
}

/**
 * 1. Contact Insights Tile
 * Análise do contato: role, KPIs, challenges, triggers
 */
async function generateContactInsights(contact, company, context) {
  const prompt = `
    Analyze this contact for sales outreach:
    
    CONTACT:
    - Name: ${contact.name}
    - Role: ${contact.role || contact.title || "Unknown Role"}
    - Company: ${company.name}
    - Industry: ${company.industry || "Unknown"}
    
    COMPANY CONTEXT:
    ${
      context.companyTiles
        ? `- Business Goals: ${context.companyTiles.goals || "Not specified"}
    - Challenges: ${context.companyTiles.challenges || "Not specified"}
    - Revenue Model: ${context.companyTiles.revenue || "Not specified"}`
        : "- No company research available"
    }
    
    ${
      context.uploadedFiles
        ? `- Files: ${context.uploadedFiles.length} documents uploaded`
        : ""
    }
    ${context.notes ? `- Notes: ${context.notes.length} notes available` : ""}
    
    Generate contact insights including:
    - Role summary and key responsibilities
    - Likely KPIs and success metrics
    - Pain points and challenges they face
    - Triggers and motivations for outreach
    - Best approach for initial contact
    
    Format as bullet points, max 200 words.
  `;

  return await generateTileWithOpenAI(prompt, "Contact Insights", company.name);
}

/**
 * 2. Email Pitch Tile
 * Cold email personalizado usando contexto da empresa
 */
async function generateEmailPitch(contact, company, context) {
  const prompt = `
    Write a personalized cold email for this contact:
    
    CONTACT:
    - Name: ${contact.name}
    - Role: ${contact.role || contact.title || "Unknown Role"}
    - Company: ${company.name}
    
    COMPANY RESEARCH:
    ${
      context.companyTiles
        ? `
    - Business Goals: ${context.companyTiles.goals || "Not specified"}
    - Current Challenges: ${context.companyTiles.challenges || "Not specified"}
    - Revenue Model: ${context.companyTiles.revenue || "Not specified"}
    - Industry: ${company.industry || "Unknown"}`
        : "- Limited company research available"
    }
    
    ${
      context.uploadedFiles
        ? `- Context from ${context.uploadedFiles.length} uploaded files`
        : ""
    }
    ${context.notes ? `- Additional notes: ${context.notes.length} notes` : ""}
    
    Email requirements:
    - Personalized subject line
    - Reference their business goals or challenges
    - Keep it under 75 words
    - Include 3 bullet points maximum
    - Professional but conversational tone
    - Clear next steps
    
    Format as: Subject: [subject] / Body: [email content]
  `;

  return await generateTileWithOpenAI(prompt, "Email Pitch", company.name);
}

/**
 * 3. Cold Call Script Tile
 * Script estruturado para cold call
 */
async function generateColdCallScript(contact, company, context) {
  const prompt = `
    Create a cold call script for this contact:
    
    CONTACT:
    - Name: ${contact.name}
    - Role: ${contact.role || contact.title || "Unknown Role"}
    - Company: ${company.name}
    
    COMPANY CONTEXT:
    ${
      context.companyTiles
        ? `
    - Business Goals: ${context.companyTiles.goals || "Not specified"}
    - Challenges: ${context.companyTiles.challenges || "Not specified"}
    - Industry: ${company.industry || "Unknown"}`
        : "- Limited company research available"
    }
    
    ${
      context.uploadedFiles
        ? `- Additional context from ${context.uploadedFiles.length} files`
        : ""
    }
    ${context.notes ? `- Notes: ${context.notes.length} notes available` : ""}
    
    Script structure:
    - Opening hook (reference their goals/challenges)
    - Value proposition
    - Discovery questions (3-4 questions)
    - Next steps
    - Objection handling
    
    Format as bullet points, conversational tone.
    Max 150 words.
  `;

  return await generateTileWithOpenAI(prompt, "Cold Call Script", company.name);
}

/**
 * Regenera um tile específico de outreach
 */
export async function regenerateOutreachTile(
  tileType,
  contact,
  company,
  context
) {
  switch (tileType) {
    case "contactInsights":
      return await generateContactInsights(contact, company, context);
    case "emailPitch":
      return await generateEmailPitch(contact, company, context);
    case "coldCallScript":
      return await generateColdCallScript(contact, company, context);
    default:
      throw new Error(`Unknown tile type: ${tileType}`);
  }
}

/**
 * Salva variant de outreach tile
 */
export async function saveOutreachVariant(tileId, variantName, content) {
  // TODO: Implementar salvamento de variants
  console.log(`💾 Salvando variant: ${variantName} para tile ${tileId}`);
  return { success: true, variantId: `variant_${Date.now()}` };
}
