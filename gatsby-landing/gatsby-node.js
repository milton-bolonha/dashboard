const path = require("path");
const fetch = require("node-fetch"); // Adicionar esta linha

async function getSourceData() {
  const apiUrl = `${process.env.GATSBY_API_URL}/api/public/content`;
  const apiKey = process.env.GATSBY_API_KEY;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Failed to fetch source data:", error);
    process.exit(1); // Interrompe o build se a API falhar
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const allContent = await getSourceData();

  // Helper para encontrar seções facilmente
  const getContentBySlug = (slug) => allContent.find((c) => c.slug === slug);

  // Extrair dados globais para injetar em todas as páginas
  const globalData = {
    header: getContentBySlug("header")?.items[0]?.data,
    footer: getContentBySlug("footer")?.items[0]?.data,
    site: getContentBySlug("site")?.items[0]?.data,
    services: getContentBySlug("services")?.items[0]?.data,
    topbar: getContentBySlug("topbar")?.items[0]?.data,
    cities: getContentBySlug("cities")?.items[0]?.data, // A LINHA QUE FALTAVA
  };

  // 1. Gerar Páginas Customizadas e de Conteúdo (About, Services, etc.)
  const pages = (getContentBySlug("pages")?.items || []).concat(
    getContentBySlug("custom-pages")?.items || []
  );

  pages.forEach((page) => {
    const pageTemplate = page.data.template || "CustomPage"; // ex: CustomPage, LibraryPage
    createPage({
      path: `/${page.slug}`,
      component: path.resolve(`./src/templates/${pageTemplate}.js`),
      context: {
        pageData: page,
        globalData: globalData,
      },
    });
  });

  // 2. Gerar Páginas de Cidades
  const citiesList = getContentBySlug("cities")?.items[0]?.data || {};
  const cityTemplate = getContentBySlug("cities-pages")?.items.find(
    (t) => t.slug === "city-template"
  );

  if (Object.keys(citiesList).length > 0 && cityTemplate) {
    Object.values(citiesList).forEach((city) => {
      createPage({
        path: `/service-areas/${city.slug}`,
        component: path.resolve("./src/templates/CityPage.js"),
        context: {
          city,
          templateData: cityTemplate,
          globalData: globalData,
        },
      });
    });
  }

  // 3. Gerar a Página Inicial (index)
  const landingPageSection =
    getContentBySlug("landing-page") ||
    allContent.find(
      (s) =>
        s.slug === "" &&
        s.items &&
        s.items.some((item) => ["hero", "boxes"].includes(item.slug))
    );

  const testimonialsSection = getContentBySlug("testimonials");

  if (landingPageSection) {
    const pageData = [landingPageSection];
    if (testimonialsSection) {
      pageData.push(testimonialsSection);
    }

    createPage({
      path: "/",
      component: path.resolve("./src/templates/HomePage.js"),
      context: {
        pageData: pageData, // Passa landing-page e testimonials
        globalData: globalData,
      },
    });
  } else {
    console.warn(
      "Seção 'landing-page' não encontrada. Página inicial não será criada."
    );
  }
};

// As funções abaixo não são mais necessárias pois não estamos mais processando arquivos Markdown locais.
/*
exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions;
  if (node.internal.type === `MarkdownRemark`) {
    const slug = path.basename(node.fileAbsolutePath, ".md");
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    });
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type MarkdownRemark implements Node {
      frontmatter: MarkdownRemarkFrontmatter
    }
    type MarkdownRemarkFrontmatter {
      title: String
      template: String
      address: String
      phone: String
      description: String
      page_builder: [PageBuilderSections]
    }
    type SiteSiteMetadata {
      title: String
      description: String
      author: String
      siteUrl: String
      keywords: [String]
      business: SiteBusiness
      tracking: SiteTracking
      integrations: SiteIntegrations
    }
    type SiteBusiness {
      name: String
      address: SiteBusinessAddress
      phone: String
      email: String
      openingHours: String
      social: SiteBusinessSocial
      logo: String
    }
    type SiteBusinessAddress {
      street: String
      city: String
      region: String
      postalCode: String
      country: String
    }
    type SiteBusinessSocial {
      facebook: String
      instagram: String
    }
    type SiteTracking {
      googleSiteVerification: String
      gtag: String
    }
    type SiteIntegrations {
      googleAds: String
      microsoftAds: String
    }
    type PageBuilderSections {
      type: String
      title: String
      subtitle: String
      text: String
      imageUrl: String
      textPosition: String
      boxes: [PageBuilderBox]
      form: PageBuilderForm
      map: PageBuilderMap
      sectionId: String
      hero: PageBuilderHero
      testimonials: PageBuilderTestimonials
      settings: PageBuilderSettings
    }
    type PageBuilderBox {
      title: String
      text: String
      icon: String
    }
    type PageBuilderForm {
      formType: String
      formData: PageBuilderFormData
    }
    type PageBuilderFormData {
      formId: String
    }
    type PageBuilderMap {
      src: String
      title: String
    }
    type PageBuilderHero {
      background: PageBuilderHeroBackground
      heading: PageBuilderHeroHeading
      subHeading: PageBuilderHeroHeading
      textSlider: PageBuilderHeroTextSlider
      form: PageBuilderForm
      textPosition: String
    }
    type PageBuilderHeroBackground {
      image: String
    }
    type PageBuilderHeroHeading {
      level: Int
      text: String
    }
    type PageBuilderHeroTextSlider {
      heading: String
      content: String
      button: PageBuilderHeroButton
    }
    type PageBuilderHeroButton {
      label: String
      link: String
    }
    type PageBuilderTestimonials {
      title: String
    }
    type PageBuilderSettings {
      layout: String
      imageSide: String
    }
  `;
  createTypes(typeDefs);
};
*/
