import { v4 as uuid } from "uuid";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Em produção, obter dados do usuário via Clerk através do token de autenticação
  const { title = "Minha História de Amor" } = JSON.parse(event.body || "{}");

  const newStory = {
    id: `story_${uuid()}`,
    title,
    slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    isComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // TODO: Persistir em Clerk unsafeMetadata

  return {
    statusCode: 200,
    body: JSON.stringify({ story: newStory }),
  };
}
