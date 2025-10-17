import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, apiKey: apiKeyFromClient, model: modelFromClient, temperature: tempFromClient } = body as { prompt: string; apiKey?: string; model?: string; temperature?: number }
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY || apiKeyFromClient
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500 })
    }
    const model = modelFromClient || process.env.OPENAI_MODEL || 'gpt-4o'
    const temperature = typeof tempFromClient === 'number' ? tempFromClient : (process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) : 0.7)

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are ChatGPT, a helpful and concise assistant with access to current information as of 2024. Provide accurate, up-to-date responses using clear Markdown formatting (headings, bullet lists, tables, and code blocks) when helpful. Focus on current market conditions, recent trends, and contemporary business insights.',
          },
          { role: 'user', content: prompt },
        ],
        temperature,
        response_format: { type: 'text' },
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return new Response(JSON.stringify({ error: 'OpenAI error', details: err }), { status: resp.status })
    }

    const data = await resp.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    return new Response(JSON.stringify({ content }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: e?.message || String(e) }), {
      status: 500,
    })
  }
}


