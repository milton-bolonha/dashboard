/**
 * Netlify Server Function para OpenAI com streaming
 * Otimiza chamadas OpenAI usando Edge Runtime
 */

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(event, context) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      messages,
      model = "gpt-4o-mini",
      temperature = 0.5,
      max_tokens = 400,
      stream = false,
    } = JSON.parse(event.body);

    console.log(
      `🚀 OpenAI request: ${model}, stream: ${stream}, tokens: ${max_tokens}`
    );

    const startTime = Date.now();

    if (stream) {
      // Streaming response
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true,
      });

      // Convert stream to chunks for Netlify
      const chunks = [];
      let firstTokenTime = null;
      let tokenCount = 0;

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content && !firstTokenTime) {
          firstTokenTime = Date.now();
        }

        if (content) {
          tokenCount++;
          chunks.push({
            content,
            timestamp: Date.now(),
            tokenCount,
          });
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const ttft = firstTokenTime ? firstTokenTime - startTime : 0;

      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          chunks,
          metrics: {
            total_time_ms: totalTime,
            ttft_ms: ttft,
            token_count: tokenCount,
            model,
          },
        }),
      };
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          content: completion.choices[0].message.content,
          usage: completion.usage,
          metrics: {
            total_time_ms: totalTime,
            model,
          },
        }),
      };
    }
  } catch (error) {
    console.error("❌ OpenAI Server Function Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        type: "openai_error",
      }),
    };
  }
}
