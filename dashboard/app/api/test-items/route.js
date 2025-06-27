import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "API funcionando!",
    items: [
      {
        _id: "test1",
        title: "Item de Teste 1",
        content: "Conteúdo de teste",
        status: "draft",
        slug: "item-teste-1",
        createdAt: new Date().toISOString(),
      },
    ],
  });
}

export async function POST(request) {
  try {
    const data = await request.json();

    const newItem = {
      _id: `test-${Date.now()}`,
      title: data.title,
      content: data.content || "",
      status: data.status || "draft",
      slug: data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "item",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        item: newItem,
        message: "Item criado com sucesso!",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao criar item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
