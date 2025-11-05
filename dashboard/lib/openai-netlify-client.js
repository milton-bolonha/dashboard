/**
 * Cliente para OpenAI via Netlify Server Functions
 * Otimiza performance usando Edge Runtime
 */

const NETLIFY_FUNCTION_URL = "/.netlify/functions/openai-stream";

export class NetlifyOpenAIClient {
  constructor() {
    this.baseUrl =
      typeof window !== "undefined"
        ? ""
        : process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_PUBLIC_URL ||
          "http://localhost:8888";
  }

  async createCompletion(params, options = {}) {
    const { stream = false, onStream } = options;

    try {
      const response = await fetch(`${this.baseUrl}${NETLIFY_FUNCTION_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...params,
          stream,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "OpenAI request failed");
      }

      if (stream && data.chunks && onStream) {
        // Simular streaming com chunks
        for (const chunk of data.chunks) {
          await new Promise((resolve) => setTimeout(resolve, 10)); // Simular delay
          onStream(chunk.content);
        }
      }

      return {
        choices: [
          {
            message: {
              content: stream
                ? data.chunks.map((c) => c.content).join("")
                : data.content,
            },
          },
        ],
        usage: data.usage,
        metrics: data.metrics,
      };
    } catch (error) {
      console.error("❌ Netlify OpenAI Client Error:", error);
      throw error;
    }
  }

  async createStreamingCompletion(params, onStream) {
    return this.createCompletion(params, { stream: true, onStream });
  }
}

// Singleton instance
export const netlifyOpenAI = new NetlifyOpenAIClient();
