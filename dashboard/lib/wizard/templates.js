// Templates para Wizard de Onboarding
// Estruturas predefinidas para diferentes tipos de negócio

export const WIZARD_TEMPLATES = {
  // Template para Blog
  blog: {
    name: "Blog Pessoal/Corporativo",
    description: "Estrutura completa para blog com posts, categorias e autores",
    contentTypes: [
      {
        name: "Post do Blog",
        slug: "blog-posts",
        description: "Artigos e posts do blog",
        addons: [
          { name: "Conteúdo", type: "textarea", required: true },
          { name: "Data de Publicação", type: "dateInput", required: true },
          {
            name: "Categoria",
            type: "selectInput",
            required: true,
            config: {
              options: [
                { value: "tech", label: "Tecnologia" },
                { value: "business", label: "Negócios" },
                { value: "lifestyle", label: "Estilo de Vida" },
              ],
            },
          },
          { name: "Imagem de Destaque", type: "imageUpload", required: false },
          { name: "Publicado", type: "checkboxInput", required: false },
        ],
      },
    ],
    sections: [
      {
        name: "Posts do Blog",
        slug: "posts",
        description: "Todos os posts do blog",
      },
    ],
  },

  // Template para E-commerce
  ecommerce: {
    name: "Loja Online",
    description: "Estrutura para e-commerce com produtos e categorias",
    contentTypes: [
      {
        name: "Produto",
        slug: "products",
        description: "Produtos da loja",
        addons: [
          { name: "Descrição", type: "textarea", required: true },
          {
            name: "Preço",
            type: "numberInput",
            required: true,
            config: { min: 0, step: 0.01 },
          },
          {
            name: "Categoria",
            type: "selectInput",
            required: true,
            config: {
              options: [
                { value: "eletronicos", label: "Eletrônicos" },
                { value: "roupas", label: "Roupas" },
                { value: "casa", label: "Casa e Decoração" },
              ],
            },
          },
          { name: "Imagem Principal", type: "imageUpload", required: true },
          { name: "Em Estoque", type: "checkboxInput", required: false },
          { name: "Data de Lançamento", type: "dateInput", required: false },
        ],
      },
    ],
    sections: [
      {
        name: "Catálogo de Produtos",
        slug: "catalog",
        description: "Todos os produtos da loja",
      },
    ],
  },

  // Template para Portfólio
  portfolio: {
    name: "Portfólio Criativo",
    description: "Showcase de trabalhos e projetos",
    contentTypes: [
      {
        name: "Projeto",
        slug: "projects",
        description: "Projetos do portfólio",
        addons: [
          { name: "Descrição do Projeto", type: "textarea", required: true },
          { name: "Tecnologias Usadas", type: "textInput", required: false },
          { name: "Data de Conclusão", type: "dateInput", required: true },
          {
            name: "Tipo de Projeto",
            type: "selectInput",
            required: true,
            config: {
              options: [
                { value: "web", label: "Website" },
                { value: "app", label: "Aplicativo" },
                { value: "design", label: "Design" },
              ],
            },
          },
          { name: "Imagem do Projeto", type: "imageUpload", required: true },
          { name: "Projeto Destaque", type: "checkboxInput", required: false },
        ],
      },
    ],
    sections: [
      {
        name: "Meus Projetos",
        slug: "projects",
        description: "Todos os projetos do portfólio",
      },
    ],
  },

  // Template para Empresa/Serviços
  business: {
    name: "Site Empresarial",
    description: "Website institucional com serviços e equipe",
    contentTypes: [
      {
        name: "Serviço",
        slug: "services",
        description: "Serviços oferecidos",
        addons: [
          { name: "Descrição do Serviço", type: "textarea", required: true },
          {
            name: "Preço Inicial",
            type: "numberInput",
            required: false,
            config: { min: 0 },
          },
          {
            name: "Categoria",
            type: "selectInput",
            required: true,
            config: {
              options: [
                { value: "consultoria", label: "Consultoria" },
                { value: "desenvolvimento", label: "Desenvolvimento" },
                { value: "design", label: "Design" },
              ],
            },
          },
          { name: "Ícone do Serviço", type: "imageUpload", required: false },
          { name: "Serviço Ativo", type: "checkboxInput", required: false },
        ],
      },
    ],
    sections: [
      {
        name: "Nossos Serviços",
        slug: "services",
        description: "Todos os serviços oferecidos",
      },
    ],
  },
};

// Função para importar template
export function importTemplate(templateKey, userId) {
  const template = WIZARD_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template '${templateKey}' não encontrado`);
  }

  return {
    contentTypes: template.contentTypes.map((ct) => ({
      ...ct,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    sections: template.sections.map((section) => ({
      ...section,
      userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
}

// Função para exportar estrutura atual do usuário
export function exportUserStructure(contentTypes, sections) {
  return {
    exported_at: new Date(),
    contentTypes: contentTypes.map((ct) => ({
      name: ct.name,
      slug: ct.slug,
      description: ct.description,
      addons: ct.addons,
    })),
    sections: sections.map((section) => ({
      name: section.name,
      slug: section.slug,
      description: section.description,
      contentTypeId: section.contentTypeId,
    })),
  };
}
