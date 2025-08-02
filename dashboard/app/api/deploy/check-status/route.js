import { NextResponse } from "next/server";

export async function POST(request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
  }

  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    return NextResponse.json(
      {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Falha ao verificar a URL ${url}:`, error);
    // Retorna um objeto de erro consistente
    return NextResponse.json(
      {
        error: "Falha ao acessar a URL.",
        details: error.message,
        code: error.code || "FETCH_FAILED",
      },
      { status: 500 }
    );
  }
}
