/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Window Caulking Toronto`,
    description: `Default description for the site.`,
    author: `Window Caulking Toronto`,
    siteUrl: `https://windowcaulkingtoronto.ca`,
    keywords: ["Gatsby", "React", "SEO"],
    business: {
      name: "Window Caulking Toronto",
      address: {
        street: "75 Rowntree Dairy Rd",
        city: "Woodbridge",
        region: "ON",
        postalCode: "L4L 6C8",
        country: "Canada",
      },
      phone: "+1-647-557-1116",
      email: "info@windowcaulking.ca",
      openingHours: "Mo-Fr 09:00-20:00",
      social: {
        facebook: "https://facebook.com/your-page",
        instagram: "https://instagram.com/your-page",
      },
      logo: "/images/logo.png", // Caminho para o logo a partir da pasta static
    },
    tracking: {
      // Mantido para o Seo.js atual, mas pode ser unificado
      googleSiteVerification: "",
      gtag: "",
    },
    integrations: {
      googleAds: "", // ex: AW-123456789
      microsoftAds: "", // ex: 247010382
    },
  },
  plugins: [
    "gatsby-plugin-postcss",
    "gatsby-plugin-image",
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        icon: "static/images/favicon-16x16.png",
      },
    },
    "gatsby-transformer-remark",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: "./src/images/",
      },
      __key: "images",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "simple-pages",
        path: `${__dirname}/content/pages`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "services",
        path: `${__dirname}/content/services`,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "custom-pages",
        path: `${__dirname}/content/custom-pages`,
      },
    },
  ],
};
