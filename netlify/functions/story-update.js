export async function handler(event) {
  if (event.httpMethod !== "PATCH") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const { storyId, data } = JSON.parse(event.body || "{}");
  if (!storyId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing storyId" }),
    };
  }

  // TODO: Atualizar história no Clerk unsafeMetadata
  // Aqui fazemos stub que devolve dados simulados
  const updatedStory = {
    id: storyId,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return { statusCode: 200, body: JSON.stringify({ story: updatedStory }) };
}
