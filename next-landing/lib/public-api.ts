export type ContentResponse = {
  sections: Array<{
    slug: string;
    name: string;
    items: Array<{ slug: string; data: Record<string, unknown> }>;
  }>;
};

export async function fetchPublicContent(): Promise<ContentResponse> {
  const url = process.env.NEXT_PUBLIC_CONTENT_API_URL;
  const key = process.env.NEXT_PUBLIC_CONTENT_API_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_CONTENT_API_URL ausente");

  const res = await fetch(url, {
    headers: key ? { Authorization: `Bearer ${key}` } : undefined,
    // ISR configurado também via export const revalidate na page
    next: { revalidate: 60 },
  } as any);

  if (!res.ok) throw new Error(`Falha ao buscar conteúdo: ${res.status}`);
  return res.json();
}
