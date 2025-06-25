import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const {
    originalText,
    genre = "romance",
    tone = "fofo",
    writingStyle = "narrativo",
  } = JSON.parse(event.body || "{}");
  if (!originalText) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing originalText" }),
    };
  }

  const prompt = `Melhore o texto abaixo mantendo o gênero ${genre}, tom ${tone} e estilo ${writingStyle}:\n\n${originalText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um talentoso escritor de histórias românticas.",
        },
        { role: "user", content: prompt },
      ],
    });

    const enhancedText = completion.choices[0].message.content.trim();

    return { statusCode: 200, body: JSON.stringify({ enhancedText }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "OpenAI error" }) };
  }
}
