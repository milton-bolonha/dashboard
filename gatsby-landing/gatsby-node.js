const path = require("path");
const fs = require("fs");
const fm = require("front-matter");

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  // Create pages for each city
  const cities = JSON.parse(
    fs.readFileSync("./content/cities/cities.json", "utf8")
  );
  const defaultCityContent = fs.readFileSync(
    "./content/cities/default-city.md",
    "utf8"
  );
  const cityTemplateContent = fs.readFileSync(
    "./content/cities/city-template.md",
    "utf8"
  );

  cities.forEach((city) => {
    const isDefault = city.isDefault || false;
    const rawContent = isDefault ? defaultCityContent : cityTemplateContent;
    const fmData = fm(rawContent);

    const title = fmData.attributes.title.replace(/\[city\]/g, city.name);

    // Substitui [city] no corpo do page_builder (se existir)
    let pageBuilderData = fmData.attributes.page_builder || [];
    if (pageBuilderData) {
      pageBuilderData = JSON.parse(
        JSON.stringify(pageBuilderData).replace(/\[city\]/g, city.name)
      );
    }

    createPage({
      path: `/service-areas/${city.slug}`,
      component: path.resolve("./src/templates/CityPage.js"),
      context: {
        city: city.name,
        title: title,
        page_builder: pageBuilderData,
        bgImage: fmData.attributes.image, // Pega a imagem do frontmatter
        isDefault: isDefault, // Adicionando a flag aqui
      },
    });
  });

  // Create pages for each simple page
  const simplePages = await graphql(`
    {
      allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/pages/" } }
      ) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `);

  simplePages.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: `/${node.fields.slug}`,
      component: path.resolve("./src/templates/SimplePage.js"),
      context: {
        slug: node.fields.slug,
      },
    });
  });

  // Create pages for each custom page
  const customPages = await graphql(`
    {
      allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/custom-pages/" } }
      ) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `);

  console.log(
    "Custom Pages Query Result:",
    JSON.stringify(customPages, null, 2)
  );

  customPages.data.allMarkdownRemark.edges.forEach(({ node }) => {
    console.log(`Creating page for: ${node.fields.slug}`);
    createPage({
      path: `/${node.fields.slug}`,
      component: path.resolve("./src/templates/CustomPage.js"),
      context: {
        slug: node.fields.slug,
      },
    });
  });

  // Create the Library page
  const libraryPage = await graphql(`
    {
      markdownRemark(
        fileAbsolutePath: { regex: "/content/custom-pages/library.md/" }
      ) {
        fields {
          slug
        }
      }
    }
  `);

  if (libraryPage.data.markdownRemark) {
    createPage({
      path: `/${libraryPage.data.markdownRemark.fields.slug}`,
      component: path.resolve("./src/templates/LibraryPage.js"),
      context: {
        slug: libraryPage.data.markdownRemark.fields.slug,
      },
    });
  }
};

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
      image: String
      address: String
      phone: String
      description: String
      page_builder: [PageBuilderSections]
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
    }
    type PageBuilderBox {
      title: String
      text: String
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
  `;
  createTypes(typeDefs);
};
