import { BASE_THEMES } from '@/lib/base-themes';

export async function GET() {
  try {
    // Por enquanto, sempre retornar os temas base
    // Em produção, buscar do MongoDB
    const themes = Object.values(BASE_THEMES);
    
    return Response.json({ 
      success: true,
      themes: themes 
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    
    // Fallback: retornar temas base mesmo em caso de erro
    const themes = Object.values(BASE_THEMES);
    return Response.json({ 
      success: false,
      themes: themes,
      error: error.message 
    });
  }
}
