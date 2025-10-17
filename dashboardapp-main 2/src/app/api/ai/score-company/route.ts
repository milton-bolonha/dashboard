import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { company } = await request.json();

    if (!company) {
      return NextResponse.json({ error: 'Company data is required' }, { status: 400 });
    }

    const prompt = `You are a senior business analyst with access to current market data as of 2024. Analyze this company and provide a score from 1-5 based on current market conditions, recent industry trends, and up-to-date business intelligence.

Company Information:
- Name: ${company.name}
- Industry: ${company.industry || 'Not specified'}
- Size: ${company.size || 'Not specified'}
- Location: ${company.location || 'Not specified'}
- Description: ${company.description || 'Not specified'}
- Website: ${company.url || 'Not specified'}

Evaluation Criteria (2024 Market Context):
- Current market position and competitive advantage
- Recent growth trends and financial performance indicators
- Industry disruption potential and technology adoption
- Market size and expansion opportunities
- Brand strength and customer acquisition potential
- Innovation pipeline and R&D investment
- Regulatory environment and market barriers
- Economic resilience and sustainability factors

Consider current market conditions, recent industry reports, and 2024 business trends in your analysis.

Provide ONLY a single number from 1-5 as your response, where:
1 = High risk, poor prospects, declining market position
2 = Below average, limited growth potential, market challenges
3 = Average prospects, stable but limited upside
4 = Good prospects, solid growth potential, competitive advantages
5 = Excellent prospects, high growth potential, market leadership

Score:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a senior business analyst with access to current market data as of 2024. You evaluate companies based on current market conditions, recent industry trends, and up-to-date business intelligence. Always respond with only a single number from 1-5.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 10,
      temperature: 0.2,
    });

    const scoreText = completion.choices[0]?.message?.content?.trim();
    const score = parseInt(scoreText || '3');

    // Ensure score is between 1-5
    const normalizedScore = Math.max(1, Math.min(5, score));

    return NextResponse.json({ 
      score: normalizedScore,
      reasoning: `AI-generated score based on company analysis: ${company.name}`
    });

  } catch (error) {
    console.error('Error generating company score:', error);
    return NextResponse.json({ error: 'Failed to generate company score' }, { status: 500 });
  }
}
