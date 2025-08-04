const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});
// Função para buscar todos os dados da API pública
async function getSourceData() {
  const apiUrl = `${process.env.GATSBY_API_URL}/api/public/content`;
  const apiKey = process.env.GATSBY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Variáveis de ambiente GATSBY_API_URL e GATSBY_API_KEY são obrigatórias."
    );
  }

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error(
      "Falha ao buscar dados da API. O build será interrompido.",
      error
    );
    process.exit(1);
  }
}

exports.createPages = async ({ actions }) => {
  const { createPage } = actions;

  const allContent = await getSourceData();

  // --- Helpers para navegar na estrutura de dados da API ---
  const findSectionBySlug = (slug) => allContent.find((c) => c.slug === slug);
  const findItemBySlug = (section, itemSlug) =>
    section?.items.find((i) => i.slug === itemSlug);

  // --- 1. Extrair Dados Globais ---
  const configurations = findSectionBySlug("configurations")?.items || [];
  const globalData = {
    header: findItemBySlug(findSectionBySlug("configurations"), "header")?.data,
    footer: findItemBySlug(findSectionBySlug("configurations"), "footer")?.data,
    site: findItemBySlug(findSectionBySlug("configurations"), "site")?.data,
    services: findItemBySlug(findSectionBySlug("configurations"), "services")
      ?.data,
    topbar: findItemBySlug(findSectionBySlug("configurations"), "topbar")?.data,
    testimonials: findItemBySlug(
      findSectionBySlug("configurations"),
      "testimonials"
    )?.data,
    cities:
      findItemBySlug(findSectionBySlug("configurations"), "cities")?.data || [],
  };

  // --- 2. Gerar Páginas de Cidades ---
  const citiesData = globalData.cities || [];
  const cityTemplates = findSectionBySlug("cities")?.items || [];

  if (citiesData.length > 0 && cityTemplates.length > 0) {
    const defaultCityTemplate = findItemBySlug(
      findSectionBySlug("cities"),
      "default-city"
    );
    const cityTemplate = findItemBySlug(
      findSectionBySlug("cities"),
      "city-template"
    );

    if (defaultCityTemplate && cityTemplate) {
      const defaultCityInfo = citiesData.find((c) => c.isDefault);
      const defaultCityUrl = defaultCityInfo
        ? `/service-areas/${defaultCityInfo.slug}`
        : null;

      citiesData.forEach((city) => {
        const templateItem = city.isDefault
          ? defaultCityTemplate
          : cityTemplate;
        const templateData = templateItem.data;
        const title = templateData.title.replace(/\[city\]/g, city.name);
        const headline = templateData.headline.replace(/\[city\]/g, city.name);

        let pageBuilderData = templateData.page_builder || [];
        if (pageBuilderData) {
          pageBuilderData = JSON.parse(
            JSON.stringify(pageBuilderData).replace(/\[city\]/g, city.name)
          );
        }

        const body = templateData.content
          ? templateData.content.replace(/\[city\]/g, city.name)
          : "";

        createPage({
          path: `/service-areas/${city.slug}`,
          component: path.resolve("./src/templates/CityPage.js"),
          context: {
            city: city.name,
            title: title,
            headline: headline,
            page_builder: pageBuilderData,
            body: body,
            bgImage: templateData.image,
            isDefault: city.isDefault || false,
            defaultCityUrl: !city.isDefault ? defaultCityUrl : null,
            globalData: globalData,
          },
        });
      });
    }
  }

  // --- 3. Gerar Páginas de Conteúdo (About, Services, Promotions) ---
  const pagesSection = findSectionBySlug("pages-content");
  if (pagesSection) {
    pagesSection.items.forEach((page) => {
      createPage({
        path: `/${page.slug}`,
        component: path.resolve(`./src/templates/SimplePage.js`),
        context: {
          pageData: page.data,
          globalData: globalData,
        },
      });
    });
  }

  // --- 4. Gerar Páginas Customizadas (Contact, Library) ---
  const customPagesSection = findSectionBySlug("custom-pages");
  if (customPagesSection) {
    customPagesSection.items.forEach((page) => {
      const template = page.data.template || "CustomPage"; // ex: CustomPage, LibraryPage
      createPage({
        path: `/${page.slug}`,
        component: path.resolve(`./src/templates/${template}.js`),
        context: {
          pageData: page.data,
          globalData: globalData,
        },
      });
    });
  }

  // --- 5. Gerar a Página Inicial ---
  const landingPageSection = findSectionBySlug("landing-page");
  if (landingPageSection) {
    createPage({
      path: "/",
      component: path.resolve("./src/templates/HomePage.js"),
      context: {
        pageData: landingPageSection.items,
        globalData: globalData,
      },
    });
  } else {
    console.warn(
      "Seção 'landing-page' não encontrada. A página inicial não será criada."
    );
  }
};

// As funções onCreateNode e createSchemaCustomization não são mais necessárias
// quando os dados vêm 100% de uma API externa.
exports.onCreateNode = undefined;
exports.createSchemaCustomization = undefined;
