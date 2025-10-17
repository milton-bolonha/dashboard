// Mock AI service for UI development
export interface AIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

export interface ContactInsights {
  painPoints: string[]
  interests: string[]
  communicationStyle: string
  decisionMakingRole: string
  budget: string
  timeline: string
  nextSteps: string[]
}

export class AIService {
  async generateResponse(
    prompt: string,
    context: { user: any; company?: any; contact?: any }
  ): Promise<AIResponse> {
    // Mock AI response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: `Mock AI response for: "${prompt.substring(0, 50)}..."`,
          usage: {
            prompt_tokens: 100,
            completion_tokens: 150,
            total_tokens: 250,
          },
          model: 'mock-model',
        })
      }, 1000)
    })
  }

  async refineResponse(
    originalPrompt: string,
    originalContent: string,
    refinement: string,
    context: { user: any; company?: any; contact?: any }
  ): Promise<AIResponse> {
    // Mock refined response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: `Mock refined response: "${refinement.substring(0, 50)}..."`,
          usage: {
            prompt_tokens: 120,
            completion_tokens: 180,
            total_tokens: 300,
          },
          model: 'mock-model',
        })
      }, 1000)
    })
  }

  async generateContactInsights(contact: any, company?: any): Promise<ContactInsights> {
    // Mock contact insights
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          painPoints: ['Budget constraints', 'Time management', 'Integration complexity'],
          interests: ['AI solutions', 'Automation', 'Cost reduction'],
          communicationStyle: 'Direct and data-driven',
          decisionMakingRole: 'Influencer',
          budget: '$50K - $100K',
          timeline: 'Q1 2024',
          nextSteps: ['Schedule demo', 'Send case studies', 'Connect on LinkedIn'],
        })
      }, 500)
    })
  }

  async generateOutreachContent(
    type: string,
    contact: any,
    company: any,
    context: any
  ): Promise<{ subject: string; content: string }> {
    // Mock outreach content
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          subject: `Mock ${type} for ${contact.name}`,
          content: `Mock outreach content for ${contact.name} at ${company.name}. This is a sample ${type} message.`,
        })
      }, 800)
    })
  }
}

export const aiService = new AIService()