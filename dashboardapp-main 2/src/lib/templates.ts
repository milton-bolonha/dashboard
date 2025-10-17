export type TemplateTile = {
  title: string
  prompt: string
}

export const TEMPLATE_1: TemplateTile[] = [
  { title: 'What they do', prompt: 'Succinctly describe what this company does.' },
  { title: 'Revenue model', prompt: 'How does the company generate revenue?' },
  { title: 'International offices', prompt: 'Do they have international offices? List locations.' },
  {
    title: 'Goals 2025 (sources)',
    prompt:
      'What are the business goals or priorities for 2025? Provide 3, with sources and links to articles or quotes from the company for each goal. Articles must be dated after January 2025. Provide each answer in detail.'
  },
  { title: 'Business challenges', prompt: 'What are the business challenges for this calendar year?' },
  { title: 'Why they need us', prompt: "Why may they be in need of my company's solutions?" },
  { title: 'CEO', prompt: 'Who is the CEO?' },
  {
    title: 'Email to CEO',
    prompt:
      "Based on previous answers, write a sales email to their CEO pitching my company's solutions. It must reference their business goals, include bullet points, maximum 120 words."
  }
]

export const TEMPLATE_2: TemplateTile[] = [
  { title: 'What they do', prompt: 'Succinctly describe what this company does.' },
  { title: 'Revenue model', prompt: 'How does the company generate revenue?' },
  {
    title: 'Top goal 2025+ (source)',
    prompt:
      'What is their biggest business goal or priority for 2025 and beyond? Provide 1, with sources and links to articles or quotes (dated after Jan 2025). Max 75 words.'
  },
  { title: 'Industry challenges', prompt: "What are the challenges facing this company's industry during this calendar year?" },
  { title: 'Why they need us', prompt: "Why may they be in need of my company's solutions?" },
  { title: 'Closest competitors', prompt: 'Who are their 10 closest competitors?' },
  { title: 'Ownership', prompt: 'Do they have a holding company or investment firm that owns them?' },
  { title: 'CEO', prompt: 'Who is the CEO?' },
  {
    title: 'Cold call openers',
    prompt:
      "Provide 2 cold call opening scripts referencing their business goals or challenges, for pitching my company's solutions to their CEO."
  }
]
